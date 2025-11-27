#!/usr/bin/env node

/**
 * Simple Email Test with Standard Gmail Configuration
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('\n📧 SIMPLE GMAIL TEST\n');

// Use the most standard Gmail configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',  // Use built-in Gmail service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

console.log(`Testing with account: ${process.env.EMAIL_USER}\n`);

// Determine test recipient: TEST_EMAIL_TO override, otherwise first KYC recipient
const kycRecipients = (process.env.KYC_SUCCESS_RECIPIENTS || '').split(',').map(v => v.trim()).filter(Boolean);
const testEmailTo = (process.env.TEST_EMAIL_TO || '').trim() || (kycRecipients[0] || '');

if (!testEmailTo) {
  console.log('❌ No test recipient configured. Set TEST_EMAIL_TO or KYC_SUCCESS_RECIPIENTS.');
  process.exit(1);
}

console.log(`Test email will be sent to: ${testEmailTo}\n`);

// Test connection
transporter.verify(function(error, success) {
  if (error) {
    console.log('❌ Connection failed:');
    console.log(error.message);
    console.log('\nPossible causes:');
    console.log('1. Incorrect email or password');
    console.log('2. Gmail requires "App Password" (if 2FA is enabled)');
    console.log('3. Gmail Workspace account restrictions');
    console.log('\n💡 Solution: Use Gmail App Password');
    console.log('   Visit: https://myaccount.google.com/apppasswords');
    process.exit(1);
  } else {
    console.log('✅ Connection successful!\n');
    
    // Send test email
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: testEmailTo,
      subject: '✅ SMTP Test - M\'Cube Plus KYC System',
      text: 'Email service is working correctly!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #059669;">✅ Email Test Successful!</h2>
          <p>The M'Cube Plus Selfie Verification System email service is configured correctly and working.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        </div>
      `,
    };
    
    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log('❌ Failed to send:');
        console.log(error.message);
        process.exit(1);
      } else {
        console.log('✅ Email sent successfully!');
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   To: ${mailOptions.to}`);
        console.log('\n🎉 Email service is fully functional!\n');
        process.exit(0);
      }
    });
  }
});
