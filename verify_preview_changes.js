#!/usr/bin/env node

/**
 * Quick verification that preview HTML elements exist
 */

const http = require('http');

const BASE_URL = 'http://localhost:4000';

console.log('\n🔍 Verifying Preview Feature Implementation...\n');

http.get(`${BASE_URL}/verify`, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    const checks = [
      { name: 'Upload Placeholder div', pattern: 'id="uploadPlaceholder"' },
      { name: 'Image Preview Container', pattern: 'id="imagePreviewContainer"' },
      { name: 'Image Preview element', pattern: 'id="imagePreview"' },
      { name: 'Retake button', pattern: 'id="retakeBtn"' },
      { name: 'Confirm button', pattern: 'id="confirmBtn"' },
      { name: 'Preview container hidden class', pattern: 'imagePreviewContainer" class="hidden"' },
      { name: 'Preview actions div', pattern: 'class="preview-actions"' },
      { name: 'showImagePreview function', pattern: 'function showImagePreview' },
      { name: 'hideImagePreview function', pattern: 'function hideImagePreview' },
      { name: 'previewDataUrl variable', pattern: 'previewDataUrl' },
      { name: 'Retake event listener', pattern: 'retakeBtn.addEventListener' },
      { name: 'Confirm event listener', pattern: 'confirmBtn.addEventListener' },
    ];
    
    let passed = 0;
    let failed = 0;
    
    checks.forEach(check => {
      const found = data.includes(check.pattern);
      const symbol = found ? '✓' : '✗';
      const color = found ? '\x1b[32m' : '\x1b[31m';
      console.log(`${color}${symbol}\x1b[0m ${check.name}`);
      if (found) passed++; else failed++;
    });
    
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Total checks: ${checks.length}`);
    console.log(`\x1b[32mPassed: ${passed}\x1b[0m`);
    console.log(`\x1b[31mFailed: ${failed}\x1b[0m`);
    
    if (failed === 0) {
      console.log('\n\x1b[32m✅ All preview elements are present in the HTML!\x1b[0m');
      console.log('\x1b[33m📋 Manual testing guide: open manual_test_preview.html\x1b[0m');
      console.log('\x1b[36m🌐 Test URL: http://localhost:4000/verify\x1b[0m\n');
    } else {
      console.log('\n\x1b[31m❌ Some elements are missing!\x1b[0m\n');
      process.exit(1);
    }
  });
}).on('error', (err) => {
  console.error('\x1b[31m❌ Error connecting to server:\x1b[0m', err.message);
  console.log('\x1b[33mMake sure the server is running on http://localhost:4000\x1b[0m\n');
  process.exit(1);
});
