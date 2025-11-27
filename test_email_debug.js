#!/usr/bin/env node

/**
 * Email Service Debug Test
 * Tests Gmail SMTP with full debug output
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('\n📧 EMAIL DEBUG TEST\n');

const config = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};

console.log('Configuration:');
console.log(`  Host: ${config.host}`);
console.log(`  Port: ${config.port}`);
console.log(`  User: ${config.auth.user}`);
console.log(`  Pass: ${config.auth.pass ? '***' + config.auth.pass.slice(-4) : 'NOT SET'}`);
console.log('');

// Create transporter with debug enabled
const transporter = nodemailer.createTransport({
  ...config,
  debug: true,
  logger: true,
});

console.log('Testing connection...\n');

transporter.verify(function(error, success) {
  if (error) {
    console.log('\n❌ Connection failed:');
    console.log(error);
    process.exit(1);
  } else {
    console.log('\n✅ Server is ready to take our messages');
    
    // Try sending a test email
    console.log('\nSending test email...\n');
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.KYC_SUCCESS_RECIPIENTS.split(',')[0],
      subject: 'Test Email from M\'Cube Plus',
      text: 'This is a test email to verify SMTP configuration.',
      html: '<p>This is a <strong>test email</strong> to verify SMTP configuration.</p>',
    };
    
    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log('\n❌ Failed to send email:');
        console.log(error);
        process.exit(1);
      } else {
        console.log('\n✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);
        process.exit(0);
      }
    });
  }
});
