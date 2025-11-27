const axios = require("axios");
const config = require("./config");

async function verifyKycFace({ pinNumber, imageBase64, name }) {
  const trimmedPin = String(pinNumber || "").trim();
  const trimmedImage = String(imageBase64 || "").trim();
  const trimmedName = String(name || "").trim();

  if (!trimmedPin || !trimmedImage) {
    throw new Error("Missing Ghana Card PIN or selfie image");
  }

  if (!trimmedName) {
    throw new Error("Missing user name");
  }

  // Safety check: enforce selfie image size < 1MB on the server side
  try {
    const base64Length = trimmedImage.length;
    const approxBytes = Math.ceil((base64Length * 3) / 4);
    const maxBytes = 1024 * 1024;
    if (approxBytes > maxBytes) {
      throw new Error("Selfie image is too large; it must be less than 1MB");
    }
  } catch (e) {
    // If any unexpected error occurs during size calculation, surface a clear error
    throw new Error("Invalid selfie image data");
  }

  if (!config.selfie.baseUrl || !config.selfie.merchantKey) {
    if (config.isProd) {
      throw new Error("Selfie API is not configured");
    }

    const now = new Date();
    const isApproved =
      trimmedPin.toUpperCase().indexOf("FAIL") === -1 &&
      trimmedPin.toUpperCase().indexOf("TEST-FAIL") === -1;

    return {
      transactionGuid: `dev_${now.getTime()}`,
      status: isApproved ? "approved" : "failed",
      code: isApproved ? "00" : "01",
      verified: isApproved ? "TRUE" : "FALSE",
      success: isApproved,
      person: isApproved ? {
        fullName: trimmedName,
        pinNumber: trimmedPin,
      } : null,
      raw: {
        mock: true,
        pinNumber: trimmedPin,
        userName: trimmedName,
        isApproved,
        timestamp: now.toISOString(),
      },
    };
  }

  const baseUrl = config.selfie.baseUrl.replace(/\/+$/, "");
  const url = `${baseUrl}/api/v1/third-party/verification/base_64`;

  const payload = {
    pinNumber: trimmedPin,
    image: trimmedImage,
    dataType: config.selfie.dataType || "PNG",
    center: config.selfie.center || "BRANCHLESS",
    userID: trimmedName,
    merchantKey: config.selfie.merchantKey,
  };

  const response = await axios.post(url, payload, {
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 15000,
  });

  const root = response.data || {};
  const data = root.data || {};

  const code = String(data.code || root.code || "");
  const success = Boolean(
    typeof data.success !== "undefined" ? data.success : root.success
  );
  const verifiedStr = String(data.verified || root.verified || "").toUpperCase();

  const isApproved =
    code === "00" && (verifiedStr === "TRUE" || verifiedStr === "YES" || success);

  return {
    transactionGuid: data.transactionGuid || root.transactionGuid || null,
    status: isApproved ? "approved" : "failed",
    code,
    verified: verifiedStr,
    success,
    person: data.person || null,
    raw: root,
  };
}

module.exports = {
  verifyKycFace,
};
