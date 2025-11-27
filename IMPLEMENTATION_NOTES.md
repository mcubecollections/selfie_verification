# Implementation Notes - Selfie Verification System

## Changes Made

### 1. API Endpoint Correction (Critical Fix)
**File:** `src/selfieService.js`

**Previous (Incorrect):**
```javascript
const url = `${baseUrl}/api/v1/third-party/verification/base_64/verification/kyc/face`;
```

**Current (Correct):**
```javascript
const url = `${baseUrl}/api/v1/third-party/verification/base_64`;
```

**Reason:** The API documentation screenshot shows the correct endpoint as `/api/v1/third-party/verification/base_64`

### 2. UserID Implementation (Per Requirements)
**File:** `src/selfieService.js`

**Change:** Updated `userID` field in API payload to use the person's **full name** instead of static "MCUBE_PORTAL"

**Previous:**
```javascript
userID: config.selfie.userId || "MCUBE_PORTAL"
```

**Current:**
```javascript
userID: trimmedName  // Uses actual person's name from form
```

**Note from Requirements:** "The userID is for the Name of the person who wants to verify (name/full name field) as seen on ID card"

### 3. Async/Await Fixes
**File:** `src/routes/verification.js`

Fixed several routes that were missing `await` keywords:
- `POST /verify/begin` - Added `await` for database operations
- `GET /verify/result` - Made async and added `await`
- `GET /status/:sessionId` - Made async and added `await`

### 4. Enhanced Mock Development Mode
**File:** `src/selfieService.js`

Mock responses now include:
- Person data with full name and PIN for successful verifications
- More realistic response structure matching production API

## Configuration

### Environment Variables Required

#### Development Mode (Minimum)
```env
NODE_ENV=development
PORT=4000
APP_BASE_URL_DEV=http://localhost:4000
```

**Note:** In development mode, if `SELFIE_API_BASE_URL` or `SELFIE_MERCHANT_KEY` are empty, the system uses mock verification:
- Any PIN **without** "FAIL" → Verification succeeds
- Any PIN **with** "FAIL" → Verification fails

#### Production Mode (Required)
```env
NODE_ENV=production
PORT=4000
APP_BASE_URL_PROD=https://verify.mcubeplus.com

# IMS Selfie API Configuration
SELFIE_API_BASE_URL=https://selfie.imsgh.org:2035/skyface
SELFIE_MERCHANT_KEY=961b1044-c797-4abb-9272-1c6e3688d814
SELFIE_CENTER=BRANCHLESS
SELFIE_USER_ID=MCUBE_PORTAL  # Note: Not used anymore, name is used instead
SELFIE_DATA_TYPE=PNG

# Email Configuration (Optional but recommended)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-password
EMAIL_FROM=kyc@mcubeplus.com
KYC_SUCCESS_RECIPIENTS=ops@mcubeplus.com,compliance@mcubeplus.com

# Security
ADMIN_DEFAULT_PASSWORD=admin123  # Change in production!
SESSION_SECRET=your-secret-key-change-in-production

# URLs
BORROWERS_PORTAL_URL=https://mcubeplus.com/borrowersaccount/
```

## API Payload Structure

The system sends the following payload to the Selfie API:

```json
{
  "pinNumber": "GHA-123456789-1",
  "image": "base64EncodedImageString",
  "dataType": "PNG",
  "center": "BRANCHLESS",
  "userID": "John Doe Smith",
  "merchantKey": "961b1044-c797-4abb-9272-1c6e3688d814"
}
```

### Key Points:
- **pinNumber**: Ghana Card PIN in format GHA-XXXXXXXXX-X
- **image**: Base64-encoded PNG image (without data URI prefix)
- **dataType**: Always "PNG" (images are converted client-side)
- **center**: "BRANCHLESS" as configured
- **userID**: Full name of the person (as it appears on their ID card)
- **merchantKey**: Merchant identification key from IMS

## Expected API Response

Based on the implementation, the system expects:

```json
{
  "data": {
    "code": "00",
    "success": true,
    "verified": "TRUE",
    "transactionGuid": "unique-transaction-id",
    "person": {
      "fullName": "John Doe Smith",
      "pinNumber": "GHA-123456789-1"
    }
  }
}
```

Or flat structure:
```json
{
  "code": "00",
  "success": true,
  "verified": "TRUE",
  "transactionGuid": "unique-transaction-id"
}
```

### Success Criteria:
- `code === "00"` AND
- `verified === "TRUE"` OR `verified === "YES"` OR `success === true`

## Database Schema

### verifications table
```sql
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- session_id: TEXT UNIQUE NOT NULL
- name: TEXT NOT NULL
- email: TEXT NOT NULL
- pin_number: TEXT NOT NULL
- status: TEXT NOT NULL ('approved' | 'failed' | 'pending')
- code: TEXT
- verified: TEXT
- transaction_guid: TEXT
- person_data: TEXT (JSON)
- request_data: TEXT (JSON)
- response_data: TEXT (JSON)
- created_at: DATETIME
- updated_at: DATETIME
```

## Testing Scenarios

### Development Mode Testing

#### Scenario 1: Successful Verification (Mock)
```
Name: John Doe
Email: john@example.com
PIN: GHA-123456789-1
Expected: Verification succeeds
```

#### Scenario 2: Failed Verification (Mock)
```
Name: Test Fail
Email: test@example.com
PIN: GHA-FAIL123456-1
Expected: Verification fails
```

### Production Mode Testing

Requires valid:
- Ghana Card PIN from National ID system
- Selfie matching the person on the Ghana Card
- Valid merchant key and API credentials

## Security Considerations

1. **Session Management**: Express sessions with httpOnly cookies
2. **Password Hashing**: bcrypt with 10 rounds for admin passwords
3. **Input Validation**: Ghana Card PIN format validation
4. **Image Processing**: Client-side resize to 640x480 PNG, <1MB limit
5. **SQL Injection Prevention**: Parameterized queries throughout
6. **Error Handling**: Production errors don't leak sensitive information

## Known Dependencies

- Node.js 18+ recommended
- SQLite3 for database
- Express for web framework
- Axios for HTTP requests
- Nodemailer for emails
- bcryptjs for password hashing

## Notes for Production Deployment

1. Set `NODE_ENV=production` in environment
2. Update all production URLs
3. Configure real SMTP settings for email notifications
4. Change default admin password
5. Set strong `SESSION_SECRET`
6. Ensure `SELFIE_API_BASE_URL` and `SELFIE_MERCHANT_KEY` are configured
7. Use HTTPS (configure reverse proxy like Nginx)
8. Consider using PM2 or systemd for process management
9. Regular database backups of `data/verifications.db`
10. Monitor logs for API errors and failures

## Missing Assets

**Note:** The views reference `/assets/mcubePlus.png` but the file is not present in the repository. 
- The application will show a broken image icon where the logo should appear
- To fix: Add the M'Cube Plus logo file to `/public/assets/mcubePlus.png`
- Recommended size: 144x144px or similar square format

## API Integration Flow

```
User fills form → Client validates → Client converts image to PNG base64
       ↓
POST /verify/begin with name, email, pinNumber, imageBase64
       ↓
Server calls selfieService.verifyKycFace() with name, pinNumber, imageBase64
       ↓
       ├─→ [Dev Mode] Mock response based on PIN
       └─→ [Prod Mode] POST to https://selfie.imsgh.org:2035/skyface/api/v1/third-party/verification/base_64
                       with payload: {pinNumber, image, dataType, center, userID: name, merchantKey}
       ↓
Response parsed for code, verified, success fields
       ↓
Status determined: approved (code="00") or failed
       ↓
Record saved to database with session_id = transactionGuid or generated
       ↓
If approved: Send email notification to configured recipients
       ↓
Redirect to /verify/result?sessionId=xxx
```

## Troubleshooting

### Issue: API returns error 401/403
**Solution:** Verify `SELFIE_MERCHANT_KEY` is correct (961b1044-c797-4abb-9272-1c6e3688d814)

### Issue: API returns error about invalid format
**Solution:** Ensure image is base64-encoded PNG without data URI prefix

### Issue: Verification always fails in production
**Solution:** Check that:
- PIN format is correct (GHA-XXXXXXXXX-X)
- Image is clear and face is visible
- PIN exists in Ghana's National ID system
- Name matches the one on the Ghana Card

### Issue: Cannot connect to API
**Solution:** 
- Verify API endpoint: `https://selfie.imsgh.org:2035/skyface/api/v1/third-party/verification/base_64`
- Check firewall/network allows HTTPS to port 2035
- Verify SSL certificate trust

## Version History

- **v1.0.0**: Initial implementation
- **v1.1.0**: Fixed API endpoint URL and userID implementation (Current)
