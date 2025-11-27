#!/bin/bash

################################################################################
# Production Deployment Zip Creator
# Creates a clean zip file with only production-necessary files
################################################################################

echo "Creating production deployment package..."

# Name of the output zip file
OUTPUT_ZIP="selfie_verification_production.zip"

# Remove old zip if exists
if [ -f "$OUTPUT_ZIP" ]; then
    rm "$OUTPUT_ZIP"
    echo "Removed old zip file"
fi

# Create zip with only production files
zip -r "$OUTPUT_ZIP" \
    src/ \
    views/ \
    public/ \
    package.json \
    package-lock.json \
    .env.production \
    -x "*.DS_Store" \
    -x "node_modules/*" \
    -x "data/*" \
    -x "*.db" \
    -x "*.db-shm" \
    -x "*.db-wal" \
    -x ".git/*" \
    -x ".gitignore" \
    -x ".env" \
    -x ".env.local" \
    -x "*.md" \
    -x "*.txt" \
    -x "*.pdf" \
    -x "test_*.js" \
    -x "*_test.js" \
    -x "backup_*.sh" \
    -x "create_production_zip.sh" \
    -x "*.log" \
    -x "logs/*" \
    -x "tmp/*" \
    -x "temp/*"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Production zip created successfully!"
    echo "📦 File: $OUTPUT_ZIP"
    echo "📊 Size: $(du -h "$OUTPUT_ZIP" | cut -f1)"
    echo ""
    echo "Contents:"
    unzip -l "$OUTPUT_ZIP" | head -20
    echo ""
    echo "Ready to upload to cPanel!"
else
    echo "❌ Error creating zip file"
    exit 1
fi
