#!/usr/bin/env node

/**
 * Email Service Test Script
 * Tests Gmail SMTP configuration and email sending functionality
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function testEmailConfiguration() {
  logSection('📧 EMAIL CONFIGURATION TEST');
  
  const config = {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM,
    recipients: process.env.KYC_SUCCESS_RECIPIENTS,
  };

  // Display configuration (hide password)
  log('\nConfiguration:', 'blue');
  console.log(`  Host: ${config.host}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  Secure (SSL): ${config.secure}`);
  console.log(`  STARTTLS: ${!config.secure && config.port === 587 ? 'Enabled' : 'Disabled'}`);
  console.log(`  User: ${config.user}`);
  console.log(`  Password: ${config.pass ? '***' + config.pass.slice(-4) : 'NOT SET'}`);
  console.log(`  From: ${config.from}`);
  console.log(`  Recipients: ${config.recipients}`);
  
  // Validate configuration
  log('\n✓ Configuration Validation:', 'blue');
  
  const checks = [
    { name: 'EMAIL_HOST set', value: !!config.host, expected: 'smtp.gmail.com' },
    { name: 'EMAIL_PORT set', value: config.port === 587, expected: '587' },
    { name: 'EMAIL_USER set', value: !!config.user, expected: 'identity.review@mcubeplus.com' },
    { name: 'EMAIL_PASS set', value: !!config.pass, expected: '[HIDDEN]' },
    { name: 'EMAIL_FROM set', value: !!config.from, expected: 'identity.review@mcubeplus.com' },
    { name: 'Recipients set', value: !!config.recipients, expected: 'ops@mcubeplus.com,...' },
    { name: 'Correct port for STARTTLS', value: config.port === 587 && !config.secure, expected: 'true' },
  ];
  
  let allValid = true;
  checks.forEach(check => {
    const symbol = check.value ? '✓' : '✗';
    const color = check.value ? 'green' : 'red';
    log(`  ${symbol} ${check.name}: ${check.expected}`, color);
    if (!check.value) allValid = false;
  });
  
  if (!allValid) {
    log('\n❌ Configuration validation failed!', 'red');
    process.exit(1);
  }
  
  log('\n✅ All configuration checks passed!', 'green');
  
  return config;
}

async function testSMTPConnection(config) {
  logSection('🔌 SMTP CONNECTION TEST');
  
  log('Creating transporter...', 'blue');
  
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      // For Gmail with STARTTLS
      ciphers: 'SSLv3',
      rejectUnauthorized: false,
    },
    requireTLS: true,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    // Enable debug output
    debug: false,
    logger: false,
  });
  
  log('Testing connection to Gmail SMTP server...', 'blue');
  
  try {
    await transporter.verify();
    log('✅ SMTP connection successful!', 'green');
    log('   Gmail SMTP server is reachable and credentials are valid.', 'green');
    return transporter;
  } catch (error) {
    log('❌ SMTP connection failed!', 'red');
    console.error('\nError details:');
    console.error(error.message);
    
    if (error.code === 'EAUTH') {
      log('\n💡 Authentication failed. Possible causes:', 'yellow');
      log('   1. Incorrect username or password', 'yellow');
      log('   2. Gmail "Less secure app access" is OFF', 'yellow');
      log('   3. App Password not generated (if 2FA is enabled)', 'yellow');
      log('\n   Recommendation: Use Gmail App Password for better security', 'yellow');
    } else if (error.code === 'ECONNECTION') {
      log('\n💡 Connection failed. Possible causes:', 'yellow');
      log('   1. No internet connection', 'yellow');
      log('   2. Firewall blocking SMTP', 'yellow');
      log('   3. Gmail SMTP server is down', 'yellow');
    }
    
    process.exit(1);
  }
}

async function sendTestEmail(transporter, config) {
  logSection('📨 TEST EMAIL SEND');
  
  const testRecipient = config.recipients.split(',')[0].trim();
  
  log(`Sending test email to: ${testRecipient}`, 'blue');
  
  const mailOptions = {
    from: config.from,
    to: testRecipient,
    subject: '🧪 Test Email - M\'Cube Plus KYC System',
    text: [
      'This is a test email from the M\'Cube Plus Selfie Verification System.',
      '',
      'Email Configuration Test Results:',
      '✅ SMTP connection successful',
      '✅ Authentication successful',
      '✅ Email sending functional',
      '',
      `Sent at: ${new Date().toISOString()}`,
      '',
      'If you received this email, the email service is working correctly!',
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">🧪 Email Configuration Test</h2>
        <p>This is a test email from the <strong>M'Cube Plus Selfie Verification System</strong>.</p>
        
        <h3 style="color: #059669;">✅ Test Results:</h3>
        <ul>
          <li>✅ SMTP connection successful</li>
          <li>✅ Authentication successful</li>
          <li>✅ Email sending functional</li>
        </ul>
        
        <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
        
        <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <p style="margin: 0; color: #059669;">
            <strong>✅ Success!</strong> If you received this email, the email service is working correctly!
          </p>
        </div>
        
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 0.875rem; color: #6b7280;">
          M'Cube Plus Selfie Verification System<br>
          Email Service Test
        </p>
      </div>
    `,
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    log('✅ Test email sent successfully!', 'green');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    log(`\n📬 Check ${testRecipient} for the test email.`, 'cyan');
    return true;
  } catch (error) {
    log('❌ Failed to send test email!', 'red');
    console.error('\nError details:');
    console.error(error.message);
    return false;
  }
}

async function sendKYCTestEmail(transporter, config) {
  logSection('📋 KYC SUCCESS EMAIL TEST');
  
  const recipients = config.recipients;
  
  log(`Sending KYC success test email to: ${recipients}`, 'blue');
  
  const mailOptions = {
    from: config.from,
    to: recipients,
    subject: 'KYC selfie verification success: Test User',
    text: [
      'A user has successfully completed KYC selfie verification.',
      '',
      'Name: Test User',
      'Email: test@example.com',
      'Session ID: test_session_123456',
      'Status: approved',
      `Completed At: ${new Date().toISOString()}`,
      '',
      'Note: This is a test email to verify the KYC notification system.',
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">✅ KYC Verification Success</h2>
        <p>A user has successfully completed KYC selfie verification.</p>
        
        <ul style="line-height: 1.8;">
          <li><strong>Name:</strong> Test User</li>
          <li><strong>Email:</strong> test@example.com</li>
          <li><strong>Session ID:</strong> test_session_123456</li>
          <li><strong>Status:</strong> approved</li>
          <li><strong>Completed At:</strong> ${new Date().toISOString()}</li>
        </ul>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <p style="margin: 0; color: #92400e;">
            <strong>🧪 Test Email:</strong> This is a test to verify the KYC notification system is working.
          </p>
        </div>
        
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 0.875rem; color: #6b7280;">
          M'Cube Plus Selfie Verification System
        </p>
      </div>
    `,
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    log('✅ KYC test email sent successfully!', 'green');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Recipients: ${recipients}`);
    log(`\n📬 Check recipient inboxes for the KYC success email.`, 'cyan');
    return true;
  } catch (error) {
    log('❌ Failed to send KYC test email!', 'red');
    console.error('\nError details:');
    console.error(error.message);
    return false;
  }
}

async function runTests() {
  log('\n📧 EMAIL SERVICE TEST SUITE', 'blue');
  log('Testing Gmail SMTP Configuration', 'yellow');
  console.log('');
  
  try {
    // Test 1: Configuration
    const config = await testEmailConfiguration();
    
    // Test 2: SMTP Connection
    const transporter = await testSMTPConnection(config);
    
    // Test 3: Send Test Email
    const testEmailSent = await sendTestEmail(transporter, config);
    
    // Test 4: Send KYC Test Email
    const kycEmailSent = await sendKYCTestEmail(transporter, config);
    
    // Summary
    logSection('📊 TEST SUMMARY');
    
    const results = [
      { name: 'Configuration Validation', status: true },
      { name: 'SMTP Connection', status: true },
      { name: 'Test Email Send', status: testEmailSent },
      { name: 'KYC Email Send', status: kycEmailSent },
    ];
    
    results.forEach(result => {
      const symbol = result.status ? '✅' : '❌';
      const color = result.status ? 'green' : 'red';
      log(`${symbol} ${result.name}`, color);
    });
    
    const allPassed = results.every(r => r.status);
    
    if (allPassed) {
      log('\n✅ ALL TESTS PASSED!', 'green');
      log('Email service is configured correctly and working perfectly!', 'green');
      log('\n🎯 Production Ready: YES', 'green');
    } else {
      log('\n⚠️  Some tests failed.', 'yellow');
      log('Please review the errors above and fix the issues.', 'yellow');
    }
    
    console.log('');
    
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    log('\n❌ Test suite error:', 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  log('\n❌ Fatal error:', 'red');
  console.error(error);
  process.exit(1);
});
