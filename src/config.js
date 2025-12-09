const nodeEnv = process.env.NODE_ENV || "development";

const isProd = nodeEnv === "production";

const defaultPort = process.env.PORT || "4000";

const baseUrl =
  (isProd ? process.env.APP_BASE_URL_PROD : process.env.APP_BASE_URL_DEV) ||
  `http://localhost:${defaultPort}`;

function parseRecipients(value) {
  if (!value) {
    return [];
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

module.exports = {
  nodeEnv,
  isProd,
  port: parseInt(defaultPort, 10),
  app: {
    baseUrl,
    borrowersPortalUrl:
      process.env.BORROWERS_PORTAL_URL ||
      "https://mcubeplus.com/",
  },
  selfie: {
    baseUrl: process.env.SELFIE_API_BASE_URL || "",
    merchantKey: process.env.SELFIE_MERCHANT_KEY || "",
    center: process.env.SELFIE_CENTER || "BRANCHLESS",
    userId: process.env.SELFIE_USER_ID || "MCUBE_PORTAL",
    dataType: process.env.SELFIE_DATA_TYPE || "PNG",
  },
  email: {
    host: process.env.EMAIL_HOST || "",
    port: parseInt(process.env.EMAIL_PORT || "587", 10),
    secure: process.env.EMAIL_SECURE === "true",
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || "",
    recipients: parseRecipients(process.env.KYC_SUCCESS_RECIPIENTS || ""),
  },
};
