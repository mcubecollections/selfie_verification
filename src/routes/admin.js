const express = require("express");
const bcrypt = require("bcryptjs");
const database = require("../database");
const adminAuth = require("../adminAuth");

const router = express.Router();

router.get("/admin/login", (req, res) => {
  if (req.session && req.session.adminId) {
    res.redirect("/admin/dashboard");
    return;
  }
  res.render("admin/login", {
    error: req.query.error || null,
  });
});

router.post("/admin/login", async (req, res) => {
  try {
    const username = req.body.username || "";
    const password = req.body.password || "";

    const admin = await database.getAdminByUsername(username);
    if (!admin || !admin.password_hash) {
      res.redirect("/admin/login?error=invalid");
      return;
    }

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      res.redirect("/admin/login?error=invalid");
      return;
    }

    req.session.adminId = admin.id;
    req.session.adminUsername = admin.username;
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.error("Login error:", error);
    res.redirect("/admin/login?error=invalid");
  }
});

router.get("/admin/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/admin/login");
});

router.get("/admin/dashboard", adminAuth.requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = 20;
    const offset = (page - 1) * limit;

    const verifications = await database.getAllVerifications(limit, offset);
    const stats = await database.getVerificationStats();

    res.render("admin/dashboard", {
      verifications,
      stats,
      page,
      adminUsername: req.session.adminUsername,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).send("Error loading dashboard");
  }
});

router.get("/admin/verification/:id", adminAuth.requireAuth, async (req, res) => {
  const sessionId = req.params.id;
  const verification = await database.getVerificationBySessionId(sessionId);

  if (!verification) {
    res.status(404).render("admin/404");
    return;
  }

  let parsedPersonData = null;
  let parsedRequestData = null;
  let parsedResponseData = null;

  try {
    if (verification.person_data) {
      parsedPersonData = JSON.parse(verification.person_data);
    }
  } catch (e) {}

  try {
    if (verification.request_data) {
      parsedRequestData = JSON.parse(verification.request_data);
    }
  } catch (e) {}

  try {
    if (verification.response_data) {
      parsedResponseData = JSON.parse(verification.response_data);
    }
  } catch (e) {}

  res.render("admin/detail", {
    verification,
    personData: parsedPersonData,
    requestData: parsedRequestData,
    responseData: parsedResponseData,
    adminUsername: req.session.adminUsername,
  });
});

router.get("/admin/search", adminAuth.requireAuth, async (req, res) => {
  const query = req.query.q || "";
  const verifications = query ? await database.searchVerifications(query) : [];
  const stats = await database.getVerificationStats();

  res.render("admin/dashboard", {
    verifications,
    stats,
    page: 1,
    searchQuery: query,
    adminUsername: req.session.adminUsername,
  });
});

module.exports = router;
