const express = require("express");
const config = require("../config");
const database = require("../database");
const selfieService = require("../selfieService");
const emailService = require("../emailService");
const cloudinaryService = require("../cloudinaryService");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ ok: true, env: config.nodeEnv });
});

router.get("/", (req, res) => {
  res.render("landing");
});

router.get("/verify", (req, res) => {
  res.render("start", {
    borrowersPortalUrl: config.app.borrowersPortalUrl,
  });
});

router.post("/verify/begin", async (req, res, next) => {
  try {
    const name = req.body.name || "";
    const email = req.body.email || "";
    const pinNumber = req.body.pinNumber || "";
    const imageBase64 = req.body.imageBase64 || "";

    if (!name || !email) {
      throw new Error("Name and email are required");
    }

    const requestData = {
      name,
      email,
      pinNumber: pinNumber.substring(0, 3) + "***",
      imageSize: imageBase64.length,
    };

    const verification = await selfieService.verifyKycFace({
      pinNumber,
      imageBase64,
      name,
    });

    const sessionId =
      verification.transactionGuid ||
      `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    // Upload selfie image to Cloudinary
    let cloudinaryUrl = null;
    try {
      cloudinaryUrl = await cloudinaryService.uploadSelfieImage(imageBase64, sessionId);
      console.log('Selfie uploaded successfully:', cloudinaryUrl);
    } catch (uploadError) {
      console.error('Failed to upload selfie to Cloudinary:', uploadError);
      // Continue even if upload fails - don't block verification
    }

    await database.createVerification({
      sessionId,
      name,
      email,
      pinNumber,
      status: verification.status,
      code: verification.code,
      verified: verification.verified,
      transactionGuid: verification.transactionGuid,
      personData: verification.person,
      requestData,
      responseData: verification.raw,
      cloudinaryUrl,
    });

    if (verification.status === "approved") {
      try {
        await emailService.sendKycSuccessEmail({
          name,
          email,
          status: verification.status,
          sessionId,
        });
      } catch (error) {
        console.error("Email send error:", error);
      }
    }

    res.redirect(
      `/verify/result?sessionId=${encodeURIComponent(sessionId)}`
    );
  } catch (error) {
    next(error);
  }
});

router.get("/verify/progress", (req, res) => {
  const sessionId = req.query.sessionId || "";
  if (!sessionId) {
    res.redirect("/verify");
    return;
  }

  res.render("progress", {
    sessionId,
    borrowersPortalUrl: config.app.borrowersPortalUrl,
  });
});

router.get("/verify/result", async (req, res) => {
  const sessionId =
    req.query.sessionId ||
    req.query.session_id ||
    req.query.id ||
    req.query.referenceId ||
    "";

  const verification = sessionId
    ? await database.getVerificationBySessionId(sessionId)
    : null;

  if (!verification) {
    res.render("result", {
      status: "unknown",
      name: null,
      email: null,
      borrowersPortalUrl: config.app.borrowersPortalUrl,
    });
    return;
  }

  res.render("result", {
    status: verification.status,
    name: verification.name,
    email: verification.email,
    borrowersPortalUrl: config.app.borrowersPortalUrl,
  });
});

router.get("/status/:sessionId", async (req, res) => {
  const sessionId = req.params.sessionId;
  const verification = await database.getVerificationBySessionId(sessionId);
  if (!verification) {
    res.status(404).json({ error: "Unknown session" });
    return;
  }

  res.json({
    sessionId: verification.session_id,
    status: verification.status,
    updatedAt: verification.updated_at,
  });
});

if (config.nodeEnv !== "production") {
  router.post("/dev/selfie/:sessionId/success", async (req, res) => {
    res.json({ ok: true, message: "Dev endpoints removed - sessions are now immutable in database" });
  });

  router.post("/dev/selfie/:sessionId/fail", (req, res) => {
    res.json({ ok: true, message: "Dev endpoints removed - sessions are now immutable in database" });
  });
}

router.post("/webhooks/selfie", (req, res) => {
  res
    .status(501)
    .send("Webhook is not used for the current selfie verification provider.");
});

module.exports = router;
