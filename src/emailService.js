const nodemailer = require("nodemailer");
const config = require("./config");

function createTransport() {
  // Check if using Gmail - use optimized service configuration
  const isGmail = config.email.host && config.email.host.toLowerCase().includes('gmail');
  
  if (isGmail) {
    // Use Gmail service for optimal configuration
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  }
  
  // For other SMTP servers, use manual configuration
  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    requireTLS: true,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });
}

async function sendKycSuccessEmail(data) {
  const recipients = config.email.recipients;
  if (!recipients || recipients.length === 0) {
    return;
  }

  if (!config.email.host || !config.email.user || !config.email.from) {
    console.warn(
      "Email configuration is incomplete; skipping KYC success email send."
    );
    return;
  }

  const transporter = createTransport();

  const name = data.name || "Unknown";
  const email = data.email || "";
  const sessionId = data.sessionId || "";

  const subject = `KYC selfie verification success: ${name}`;

  const textLines = [
    "A user has successfully completed KYC selfie verification.",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Session ID: ${sessionId}`,
    `Status: ${data.status || "approved"}`,
    `Completed At: ${new Date().toISOString()}`,
  ];

  const htmlParts = [
    "<p>A user has successfully completed KYC selfie verification.</p>",
    "<ul>",
    `<li><strong>Name:</strong> ${name}</li>`,
    `<li><strong>Email:</strong> ${email}</li>`,
    `<li><strong>Session ID:</strong> ${sessionId}</li>`,
    `<li><strong>Status:</strong> ${data.status || "approved"}</li>`,
    `<li><strong>Completed At:</strong> ${new Date().toISOString()}</li>`,
    "</ul>",
  ];

  await transporter.sendMail({
    from: config.email.from,
    to: recipients,
    subject,
    text: textLines.join("\n"),
    html: htmlParts.join(""),
  });
}

module.exports = {
  sendKycSuccessEmail,
};
