# M'Cube Plus Selfie Verification System

## ✨ Features Implemented

### User-Facing Features
- **✓ Modern, Professional UI** with M'Cube Plus branding
- **✓ Step-by-step verification flow** with progress indicators
- **✓ Interactive selfie capture** with real-time validation
- **✓ Loading states and animations** for better UX
- **✓ Clear success/failure messaging** with helpful guidance
- **✓ Mobile-responsive design** with optimized layouts
- **✓ Ghana Card PIN validation** with format checking
- **✓ Image preprocessing** (640x480 PNG, <1MB)
- **✓ Email notifications** on successful verification

### Admin Panel Features
- **✓ Secure admin authentication** with bcrypt
- **✓ Dashboard with statistics** (Total, Approved, Failed, Pending)
- **✓ Verification history** with search functionality
- **✓ Detailed verification view** with full request/response data
- **✓ Real-time status updates**

### Technical Features
- **✓ SQLite database** for persistent storage
- **✓ Session management** with express-session
- **✓ IMS Selfie API integration** with configurable endpoints
- **✓ Dev/Production mode** support
- **✓ Error handling** and graceful failures
- **✓ Standalone system** - no borrowerId dependency
- **✓ Email integration** with nodemailer

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (currently tested on v24.10.0)
- npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or for production
npm start
```

Server will start on: `http://localhost:4000`

---

## 🔐 Admin Panel

**Default Credentials:**
- Username: `admin`
- Password: `admin123`

Access at: `http://localhost:4000/admin/dashboard`

**IMPORTANT:** Change the default password in production!

---

## 📝 Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
# Server Config
NODE_ENV=development
PORT=4000

# URLs
APP_BASE_URL_DEV=http://localhost:4000
APP_BASE_URL_PROD=https://verify.mcubeplus.com
BORROWERS_PORTAL_URL=https://mcubeplus.com/borrowersaccount/

# IMS Selfie API (from your PDF)
SELFIE_API_BASE_URL=https://selfie.imsgh.org:2035/skyface
SELFIE_MERCHANT_KEY=961b1044-c797-4abb-9272-1c6e3688d814
SELFIE_CENTER=BRANCHLESS
SELFIE_USER_ID=MCUBE_PORTAL
SELFIE_DATA_TYPE=PNG

# Email (SMTP)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-password
EMAIL_FROM=kyc@mcubeplus.com

# Admin
ADMIN_DEFAULT_PASSWORD=admin123
SESSION_SECRET=your-secret-key-change-in-production

# Email Recipients (comma-separated)
KYC_SUCCESS_RECIPIENTS=ops@mcubeplus.com,compliance@mcubeplus.com
```

---

## 🎯 API Endpoints

### Public Endpoints
- `GET /verify` - Start verification (entry point from WordPress)
- `POST /verify/begin` - Submit verification
- `GET /verify/result?sessionId=xxx` - View result
- `GET /status/:sessionId` - Check status (JSON)
- `GET /health` - Health check

### Admin Endpoints
- `GET /admin/login` - Admin login page
- `POST /admin/login` - Login submission
- `GET /admin/dashboard` - Dashboard (requires auth)
- `GET /admin/verification/:sessionId` - View details
- `GET /admin/search?q=query` - Search verifications
- `GET /admin/logout` - Logout

---

## 🔗 WordPress/LoanDisk Integration

### Simple Integration

Redirect unverified users to:
```
https://verify.mcubeplus.com/verify
```

The system will collect name and email directly from the user.

### Advanced Integration (with pre-fill)

```php
// In your WordPress theme or plugin
$verify_url = 'https://verify.mcubeplus.com/verify'
            . '?name=' . urlencode($user_name)
            . '&email=' . urlencode($user_email);

wp_redirect($verify_url);
exit;
```

---

## 🗄️ Database

SQLite database is automatically created at `/data/verifications.db`

### Tables

**verifications**
- `id` - Auto-increment primary key
- `session_id` - Unique session identifier
- `name` - User's full name
- `email` - User's email
- `pin_number` - Ghana Card PIN
- `status` - approved/failed/pending
- `code` - API response code
- `verified` - TRUE/FALSE from API
- `transaction_guid` - From IMS API
- `person_data` - JSON from API
- `request_data` - Request details (JSON)
- `response_data` - Full API response (JSON)
- `created_at` - Timestamp
- `updated_at` - Timestamp

**admin_users**
- `id` - Primary key
- `username` - Admin username
- `password_hash` - Bcrypt hash
- `created_at` - Timestamp

---

## 🎨 Design System

### Colors
- **Primary Blue:** `#2563eb`
- **Dark Blue:** `#1d4ed8`
- **Success Green:** `#10b981` / `#059669`
- **Error Red:** `#ef4444` / `#dc2626`
- **Warning Orange:** `#f59e0b` / `#d97706`
- **Purple Gradient:** `#667eea` → `#764ba2`

### Typography
- Font: System fonts (-apple-system, Segoe UI, Roboto)
- Headings: 700 weight
- Body: 400-600 weight

---

## 🧪 Development Mode

When merchant key is missing, the system uses a mock API:
- PINs containing "FAIL" → verification fails
- All other PINs → verification succeeds
- No real API calls made

---

## 📧 Email Notifications

Emails are sent **only on successful KYC verification** to configured recipients.

Email includes:
- User name
- Email address
- Session ID
- Status
- Timestamp

---

## 🔒 Security Features

- **Password hashing** with bcrypt (10 rounds)
- **Session management** with secure cookies
- **SQL injection prevention** with parameterized queries
- **Input validation** on all forms
- **Ghana Card PIN format validation**
- **Image size limits** (<1MB)
- **HTTPS redirect** in production (recommended)

---

## 📊 Admin Dashboard Stats

Real-time statistics:
- **Total Verifications** - All time count
- **Approved** - Successful verifications
- **Failed** - Failed verifications
- **Pending** - In progress (if any)

Search functionality: Search by name, email, or Ghana Card PIN

---

## 🐛 Troubleshooting

### Database Issues
If database gets corrupted:
```bash
rm -rf data/verifications.db
npm run dev  # Will recreate
```

### Admin Login Issues
Reset admin password:
```bash
# Delete admin_users table and restart
# Default admin will be recreated
```

### Port Already in Use
```bash
lsof -ti :4000 | xargs kill -9
npm run dev
```

---

## 📦 Production Deployment

### 1. Configure Environment
- Set `NODE_ENV=production`
- Update all URLs to production values
- Set strong `SESSION_SECRET`
- Change `ADMIN_DEFAULT_PASSWORD`
- Configure real SMTP settings
- Set `SELFIE_MERCHANT_KEY`

### 2. Run with Process Manager
```bash
# Using PM2
pm2 start src/server.js --name mcube-verify

# Or systemd service
# Create /etc/systemd/system/mcube-verify.service
```

### 3. Reverse Proxy (Nginx)
```nginx
server {
    listen 443 ssl;
    server_name verify.mcubeplus.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📄 License

Proprietary - M'Cube Plus

---

## 🙏 Support

For issues or questions, contact your M'Cube Plus technical team.
