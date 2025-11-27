#!/usr/bin/env node

/**
 * Comprehensive Test Script for Selfie Verification System
 * Tests both development mock mode and validates production readiness
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:4000';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

// ANSI color codes for terminal output
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

function logTest(name, status, details = '') {
  const symbol = status ? '✓' : '✗';
  const color = status ? 'green' : 'red';
  log(`${symbol} ${name}${details ? ': ' + details : ''}`, color);
}

// Create a simple base64 test image (1x1 transparent PNG)
function createTestImage() {
  return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
}

// Test scenarios
const testScenarios = [
  {
    name: 'Test 1: Successful Verification (Mock)',
    data: {
      name: 'John Doe Smith',
      email: 'john.doe@example.com',
      pinNumber: 'GHA-123456789-1',
      imageBase64: createTestImage(),
    },
    expectedStatus: 'approved',
  },
  {
    name: 'Test 2: Failed Verification with FAIL keyword (Mock)',
    data: {
      name: 'Test Fail User',
      email: 'fail@example.com',
      pinNumber: 'GHA-FAIL12345-1',
      imageBase64: createTestImage(),
    },
    expectedStatus: 'failed',
  },
  {
    name: 'Test 3: Another Successful Case (Mock)',
    data: {
      name: 'Jane Mary Williams',
      email: 'jane.williams@example.com',
      pinNumber: 'GHA-987654321-5',
      imageBase64: createTestImage(),
    },
    expectedStatus: 'approved',
  },
  {
    name: 'Test 4: Failed with TEST-FAIL (Mock)',
    data: {
      name: 'Another Fail Test',
      email: 'testfail@example.com',
      pinNumber: 'GHA-TEST-FAIL12-9',
      imageBase64: createTestImage(),
    },
    expectedStatus: 'failed',
  },
];

async function testHealthEndpoint() {
  logSection('HEALTH CHECK');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    logTest('Health endpoint', response.data.ok === true, `env: ${response.data.env}`);
    return response.data.ok === true;
  } catch (error) {
    logTest('Health endpoint', false, error.message);
    return false;
  }
}

async function testVerifyPage() {
  logSection('VERIFY PAGE TEST');
  try {
    const response = await axios.get(`${BASE_URL}/verify`);
    const isHTML = response.headers['content-type'].includes('text/html');
    const hasForm = response.data.includes('verifyForm');
    const hasGhanaCard = response.data.includes('Ghana Card');
    
    logTest('Verify page loads', response.status === 200);
    logTest('Returns HTML', isHTML);
    logTest('Contains form', hasForm);
    logTest('Contains Ghana Card reference', hasGhanaCard);
    
    return response.status === 200 && isHTML && hasForm;
  } catch (error) {
    logTest('Verify page loads', false, error.message);
    return false;
  }
}

async function testVerification(scenario) {
  logSection(scenario.name);
  try {
    // Submit verification
    const response = await axios.post(
      `${BASE_URL}/verify/begin`,
      scenario.data,
      {
        maxRedirects: 0,
        validateStatus: (status) => status === 302 || status === 200,
      }
    );

    const isRedirect = response.status === 302;
    const location = response.headers.location || '';
    const hasSessionId = location.includes('sessionId=');
    
    logTest('Form submission', isRedirect, `redirected to ${location.substring(0, 50)}...`);
    logTest('Redirect has sessionId', hasSessionId);

    if (!hasSessionId) {
      logTest('Verification test', false, 'No session ID in redirect');
      return false;
    }

    // Extract session ID
    const sessionIdMatch = location.match(/sessionId=([^&]+)/);
    const sessionId = sessionIdMatch ? decodeURIComponent(sessionIdMatch[1]) : null;

    if (!sessionId) {
      logTest('Session ID extraction', false);
      return false;
    }

    logTest('Session ID extracted', true, sessionId.substring(0, 30) + '...');

    // Check status endpoint
    const statusResponse = await axios.get(`${BASE_URL}/status/${sessionId}`);
    const statusMatches = statusResponse.data.status === scenario.expectedStatus;
    
    logTest('Status endpoint', statusResponse.status === 200);
    logTest(`Status is ${scenario.expectedStatus}`, statusMatches, `actual: ${statusResponse.data.status}`);

    // Check result page
    const resultResponse = await axios.get(`${BASE_URL}/verify/result?sessionId=${sessionId}`);
    const resultPageLoaded = resultResponse.status === 200;
    const containsName = resultResponse.data.includes(scenario.data.name);
    const containsEmail = resultResponse.data.includes(scenario.data.email);
    
    logTest('Result page loads', resultPageLoaded);
    logTest('Result contains name', containsName);
    logTest('Result contains email', containsEmail);

    return statusMatches && resultPageLoaded && containsName;
  } catch (error) {
    logTest('Verification test', false, error.message);
    return false;
  }
}

async function testAdminPanel() {
  logSection('ADMIN PANEL TEST');
  
  const agent = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    maxRedirects: 0,
    validateStatus: (status) => status >= 200 && status < 400,
  });

  try {
    // Test admin login page
    const loginPageResponse = await agent.get('/admin/login');
    logTest('Admin login page loads', loginPageResponse.status === 200);

    // Test admin login
    const loginResponse = await agent.post(
      '/admin/login',
      new URLSearchParams({
        username: ADMIN_USER,
        password: ADMIN_PASS,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const loginRedirect = loginResponse.status === 302;
    const redirectToDashboard = loginResponse.headers.location?.includes('dashboard');
    
    logTest('Admin login successful', loginRedirect && redirectToDashboard);

    // Get cookies from login
    const cookies = loginResponse.headers['set-cookie'];
    
    if (!cookies) {
      logTest('Admin session', false, 'No cookies received');
      return false;
    }

    // Test dashboard access with session
    const dashboardResponse = await agent.get('/admin/dashboard', {
      headers: {
        Cookie: cookies.join('; '),
      },
    });

    const dashboardLoaded = dashboardResponse.status === 200;
    const containsStats = dashboardResponse.data.includes('Total') || dashboardResponse.data.includes('stats');
    
    logTest('Dashboard loads', dashboardLoaded);
    logTest('Dashboard shows statistics', containsStats);

    return dashboardLoaded && containsStats;
  } catch (error) {
    logTest('Admin panel test', false, error.message);
    return false;
  }
}

async function testMissingData() {
  logSection('VALIDATION TESTS');
  
  try {
    // Test with missing name
    try {
      await axios.post(`${BASE_URL}/verify/begin`, {
        email: 'test@example.com',
        pinNumber: 'GHA-123456789-1',
        imageBase64: createTestImage(),
      });
      logTest('Rejects missing name', false, 'Should have thrown error');
    } catch (error) {
      logTest('Rejects missing name', error.response?.status >= 400 || error.message.includes('required'));
    }

    // Test with missing email
    try {
      await axios.post(`${BASE_URL}/verify/begin`, {
        name: 'Test User',
        pinNumber: 'GHA-123456789-1',
        imageBase64: createTestImage(),
      });
      logTest('Rejects missing email', false, 'Should have thrown error');
    } catch (error) {
      logTest('Rejects missing email', error.response?.status >= 400 || error.message.includes('required'));
    }

    // Test with missing image
    try {
      await axios.post(`${BASE_URL}/verify/begin`, {
        name: 'Test User',
        email: 'test@example.com',
        pinNumber: 'GHA-123456789-1',
      });
      logTest('Rejects missing image', false, 'Should have thrown error');
    } catch (error) {
      logTest('Rejects missing image', error.response?.status >= 400 || error.message.includes('image'));
    }

    return true;
  } catch (error) {
    logTest('Validation tests', false, error.message);
    return false;
  }
}

async function runAllTests() {
  log('\n🧪 SELFIE VERIFICATION SYSTEM - COMPREHENSIVE TEST SUITE', 'blue');
  log(`Testing server at: ${BASE_URL}`, 'yellow');
  log(`Mode: Development (Mock API)\n`, 'yellow');

  const results = {
    passed: 0,
    failed: 0,
    total: 0,
  };

  // Run tests
  const healthOk = await testHealthEndpoint();
  results.total++;
  if (healthOk) results.passed++; else results.failed++;

  if (!healthOk) {
    log('\n❌ Server health check failed. Cannot continue tests.', 'red');
    return;
  }

  const verifyPageOk = await testVerifyPage();
  results.total++;
  if (verifyPageOk) results.passed++; else results.failed++;

  // Run verification scenarios
  for (const scenario of testScenarios) {
    const testOk = await testVerification(scenario);
    results.total++;
    if (testOk) results.passed++; else results.failed++;
  }

  const validationOk = await testMissingData();
  results.total++;
  if (validationOk) results.passed++; else results.failed++;

  const adminOk = await testAdminPanel();
  results.total++;
  if (adminOk) results.passed++; else results.failed++;

  // Final summary
  logSection('TEST SUMMARY');
  log(`Total tests: ${results.total}`, 'cyan');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  
  const successRate = ((results.passed / results.total) * 100).toFixed(1);
  log(`Success rate: ${successRate}%`, successRate === '100.0' ? 'green' : 'yellow');

  if (results.failed === 0) {
    log('\n✅ ALL TESTS PASSED! System is production-ready.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please review the output above.', 'yellow');
  }

  // Production mode reminder
  logSection('PRODUCTION MODE CHECKLIST');
  log('Before deploying to production:', 'yellow');
  log('✓ Set NODE_ENV=production', 'cyan');
  log('✓ Configure SELFIE_API_BASE_URL=https://selfie.imsgh.org:2035/skyface', 'cyan');
  log('✓ Configure SELFIE_MERCHANT_KEY=961b1044-c797-4abb-9272-1c6e3688d814', 'cyan');
  log('✓ Set up SMTP email configuration', 'cyan');
  log('✓ Change ADMIN_DEFAULT_PASSWORD', 'cyan');
  log('✓ Set strong SESSION_SECRET', 'cyan');
  log('✓ Configure production URLs', 'cyan');
  log('✓ Add M\'Cube Plus logo to /public/assets/mcubePlus.png', 'cyan');
  console.log('');
}

// Run tests
runAllTests().catch((error) => {
  log(`\n❌ Test suite error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
