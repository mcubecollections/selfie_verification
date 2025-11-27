#!/usr/bin/env node

/**
 * Test Script for Image Preview Functionality
 * Tests both camera capture and file upload preview features
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:4000';

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

function logTest(name, status, details = '') {
  const symbol = status ? '✓' : '✗';
  const color = status ? 'green' : 'red';
  log(`${symbol} ${name}${details ? ': ' + details : ''}`, color);
}

// Create a test image file
function createTestImageFile() {
  const testImagePath = path.join(__dirname, 'test_image.png');
  // Simple 1x1 PNG (base64 decoded)
  const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  fs.writeFileSync(testImagePath, Buffer.from(base64Data, 'base64'));
  return testImagePath;
}

async function testImageUploadPreview() {
  logSection('TEST 1: Image Upload Preview Functionality');
  
  let browser;
  let passed = true;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.goto(`${BASE_URL}/verify`, { waitUntil: 'networkidle2' });
    
    logTest('Verification page loaded', true);
    
    // Check initial state - placeholder should be visible
    const placeholderVisible = await page.evaluate(() => {
      const placeholder = document.getElementById('uploadPlaceholder');
      return placeholder && !placeholder.classList.contains('hidden');
    });
    logTest('Upload placeholder visible initially', placeholderVisible);
    if (!placeholderVisible) passed = false;
    
    // Check preview is hidden initially
    const previewHidden = await page.evaluate(() => {
      const preview = document.getElementById('imagePreviewContainer');
      return preview && preview.classList.contains('hidden');
    });
    logTest('Preview container hidden initially', previewHidden);
    if (!previewHidden) passed = false;
    
    // Create test image and upload
    const testImagePath = createTestImageFile();
    const fileInput = await page.$('#selfieFile');
    await fileInput.uploadFile(testImagePath);
    
    // Wait for preview to appear
    await page.waitForTimeout(500);
    
    // Check placeholder is now hidden
    const placeholderHidden = await page.evaluate(() => {
      const placeholder = document.getElementById('uploadPlaceholder');
      return placeholder && placeholder.classList.contains('hidden');
    });
    logTest('Upload placeholder hidden after upload', placeholderHidden);
    if (!placeholderHidden) passed = false;
    
    // Check preview is now visible
    const previewVisible = await page.evaluate(() => {
      const preview = document.getElementById('imagePreviewContainer');
      return preview && !preview.classList.contains('hidden');
    });
    logTest('Preview container visible after upload', previewVisible);
    if (!previewVisible) passed = false;
    
    // Check preview image has source
    const previewHasImage = await page.evaluate(() => {
      const img = document.getElementById('imagePreview');
      return img && img.src && img.src.startsWith('data:');
    });
    logTest('Preview image has data URL source', previewHasImage);
    if (!previewHasImage) passed = false;
    
    // Check retake button is visible
    const retakeBtnVisible = await page.evaluate(() => {
      const btn = document.getElementById('retakeBtn');
      return btn && btn.offsetParent !== null;
    });
    logTest('Retake button visible', retakeBtnVisible);
    if (!retakeBtnVisible) passed = false;
    
    // Check confirm button is visible
    const confirmBtnVisible = await page.evaluate(() => {
      const btn = document.getElementById('confirmBtn');
      return btn && btn.offsetParent !== null;
    });
    logTest('Confirm button visible', confirmBtnVisible);
    if (!confirmBtnVisible) passed = false;
    
    // Test retake functionality
    await page.click('#retakeBtn');
    await page.waitForTimeout(300);
    
    // Check placeholder is visible again
    const placeholderVisibleAgain = await page.evaluate(() => {
      const placeholder = document.getElementById('uploadPlaceholder');
      return placeholder && !placeholder.classList.contains('hidden');
    });
    logTest('Placeholder visible after retake', placeholderVisibleAgain);
    if (!placeholderVisibleAgain) passed = false;
    
    // Check preview is hidden again
    const previewHiddenAgain = await page.evaluate(() => {
      const preview = document.getElementById('imagePreviewContainer');
      return preview && preview.classList.contains('hidden');
    });
    logTest('Preview hidden after retake', previewHiddenAgain);
    if (!previewHiddenAgain) passed = false;
    
    // Clean up test file
    fs.unlinkSync(testImagePath);
    
  } catch (error) {
    logTest('Test execution', false, error.message);
    passed = false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  return passed;
}

async function testFormSubmissionWithPreview() {
  logSection('TEST 2: Form Submission with Preview');
  
  let browser;
  let passed = true;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.goto(`${BASE_URL}/verify`, { waitUntil: 'networkidle2' });
    
    // Fill form fields
    await page.type('#name', 'Test User Preview');
    await page.type('#email', 'preview@example.com');
    await page.type('#pinNumber', 'GHA-123456789-1');
    
    logTest('Form fields filled', true);
    
    // Upload image
    const testImagePath = createTestImageFile();
    const fileInput = await page.$('#selfieFile');
    await fileInput.uploadFile(testImagePath);
    await page.waitForTimeout(500);
    
    logTest('Image uploaded and preview shown', true);
    
    // Try to submit form (should work since we have preview)
    const submitBtn = await page.$('#submitBtn');
    await submitBtn.click();
    
    // Wait for navigation or processing
    await page.waitForTimeout(1000);
    
    // Check if we're being redirected or processing started
    const currentUrl = page.url();
    const isProcessing = await page.evaluate(() => {
      const btnText = document.getElementById('btnText');
      return btnText && btnText.textContent.includes('Processing');
    });
    
    const submitted = currentUrl !== `${BASE_URL}/verify` || isProcessing;
    logTest('Form submission started with preview', submitted);
    if (!submitted) passed = false;
    
    // Clean up
    fs.unlinkSync(testImagePath);
    
  } catch (error) {
    logTest('Test execution', false, error.message);
    passed = false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  return passed;
}

async function testPreviewWithoutImage() {
  logSection('TEST 3: Form Validation Without Image');
  
  let browser;
  let passed = true;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.goto(`${BASE_URL}/verify`, { waitUntil: 'networkidle2' });
    
    // Fill form fields but no image
    await page.type('#name', 'Test User No Image');
    await page.type('#email', 'noimage@example.com');
    await page.type('#pinNumber', 'GHA-987654321-5');
    
    logTest('Form fields filled without image', true);
    
    // Try to submit
    const submitBtn = await page.$('#submitBtn');
    await submitBtn.click();
    await page.waitForTimeout(500);
    
    // Check if error message is shown
    const errorShown = await page.evaluate(() => {
      const error = document.getElementById('errorMessage');
      return error && error.classList.contains('show') && error.textContent.includes('selfie');
    });
    
    logTest('Error message shown for missing image', errorShown);
    if (!errorShown) passed = false;
    
    // Check we're still on the same page
    const currentUrl = page.url();
    const stillOnPage = currentUrl === `${BASE_URL}/verify`;
    logTest('Form not submitted without image', stillOnPage);
    if (!stillOnPage) passed = false;
    
  } catch (error) {
    logTest('Test execution', false, error.message);
    passed = false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  return passed;
}

async function runAllTests() {
  log('\n🎨 IMAGE PREVIEW FUNCTIONALITY - TEST SUITE', 'blue');
  log(`Testing server at: ${BASE_URL}`, 'yellow');
  console.log('');
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0,
  };
  
  // Test 1: Upload Preview
  const test1 = await testImageUploadPreview();
  results.total++;
  if (test1) results.passed++; else results.failed++;
  
  // Test 2: Form Submission
  const test2 = await testFormSubmissionWithPreview();
  results.total++;
  if (test2) results.passed++; else results.failed++;
  
  // Test 3: Validation
  const test3 = await testPreviewWithoutImage();
  results.total++;
  if (test3) results.passed++; else results.failed++;
  
  // Summary
  logSection('TEST SUMMARY');
  log(`Total tests: ${results.total}`, 'cyan');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  
  const successRate = ((results.passed / results.total) * 100).toFixed(1);
  log(`Success rate: ${successRate}%`, successRate === '100.0' ? 'green' : 'yellow');
  
  if (results.failed === 0) {
    log('\n✅ ALL PREVIEW TESTS PASSED!', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please review the output above.', 'yellow');
  }
  
  console.log('');
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Check if puppeteer is available
try {
  require.resolve('puppeteer');
  runAllTests().catch((error) => {
    log(`\n❌ Test suite error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
} catch (e) {
  log('\n⚠️  Puppeteer not installed. Installing...', 'yellow');
  log('Run: npm install --save-dev puppeteer', 'cyan');
  log('Then run this test again.', 'cyan');
  process.exit(1);
}
