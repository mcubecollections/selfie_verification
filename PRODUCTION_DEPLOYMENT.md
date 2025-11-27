# Production Deployment - Quick Guide

## 📦 Step 1: Create Production Package

Run the production zip script:

```bash
cd /Users/kingsley/Desktop/selfie_verification
./create_production_zip.sh
```

This creates: **`selfie_verification_production.zip`** (~124KB)

### ✅ What's Included:
- `src/` - All source code
- `views/` - All EJS templates
- `public/` - All static assets
- `package.json` & `package-lock.json` - Dependencies
- `.env.production` - Production configuration

### ❌ What's Excluded:
- `.env` - Development environment file
- `.gitignore` - Git configuration
- `*.md` - Documentation files (README, guides, etc.)
- `*.txt` - Text documentation
- `*.pdf` - PDF documentation
- `test_*.js` - Test scripts
- `backup_*.sh` - Backup scripts
- `node_modules/` - Will be installed on server
- `data/` - Local database
- `.git/` - Git repository

---

## 🚀 Step 2: Upload to cPanel

1. **Login to cPanel:**
   - URL: `https://premium56.web-hosting.com:2083`
   - Username: `mcubyjwq`

2. **File Manager:**
   - Navigate to: `/home/mcubyjwq/mcubeplus.com/verification/`
   - Upload: `selfie_verification_production.zip`
   - Extract the files
   - Delete the zip after extraction

---

## ⚙️ Step 3: Setup Node.js App

**In cPanel → Setup Node.js App:**

| Setting | Value |
|---------|-------|
| Node.js version | 18.x or higher |
| Application mode | Production |
| Application root | `mcubeplus.com/verification` |
| Startup file | `src/server.js` |

---

## 🔐 Step 4: Environment Variables

**Add these in Node.js app configuration:**

```bash
NODE_ENV=production
PORT=4000
DB_PATH=/home/mcubyjwq/selfie_data/verifications.db
ADMIN_DEFAULT_PASSWORD=Shop0203$
SESSION_SECRET=af4d6d0b71bc82e9a3e4bf6d68f215e30d6b25dd279ffea9c1a370178504a4a6
APP_BASE_URL_PROD=https://mcubeplus.com/verification
BORROWERS_PORTAL_URL=https://mcubeplus.com/borrowersaccount/
SELFIE_API_BASE_URL=https://selfie.imsgh.org:2035/skyface
SELFIE_MERCHANT_KEY=961b1044-c797-4abb-9272-1c6e3688d814
SELFIE_CENTER=BRANCHLESS
SELFIE_USER_ID=MCUBE_PORTAL
SELFIE_DATA_TYPE=PNG
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=identity.review@mcubeplus.com
EMAIL_PASS=jjprtqcpwjvivcof
EMAIL_FROM=identity.review@mcubeplus.com
KYC_SUCCESS_RECIPIENTS=ops@mcubeplus.com,compliance@mcubeplus.com
```

---

## 📥 Step 5: Install & Start

1. Click **"Run NPM Install"** (wait 2-5 minutes)
2. Click **"Start Application"**
3. Verify status shows **"Running"**

---

## ✅ Step 6: Verify Deployment

**Test URLs:**
- Verification: `https://mcubeplus.com/verification/verify`
- Admin Panel: `https://mcubeplus.com/verification/admin/dashboard`
  - Username: `admin`
  - Password: `Shop0203$`

**Check Logs:**
- Should see: `"Using database at: /home/mcubyjwq/selfie_data/verifications.db"`
- Should see: `"Connected to SQLite database"`

---

## 🔄 For Updates

To deploy updates:

1. **On local machine:**
   ```bash
   ./create_production_zip.sh
   ```

2. **On cPanel:**
   - Upload new zip to same location
   - Extract (overwrite existing files)
   - Restart Node.js app

---

## 📂 Production Structure

```
/home/mcubyjwq/
├── mcubeplus.com/
│   └── verification/              # Your app
│       ├── src/
│       ├── views/
│       ├── public/
│       ├── package.json
│       ├── .env.production
│       └── node_modules/          # Installed by npm
│
└── selfie_data/                   # Database (auto-created)
    └── verifications.db
```

---

## 🎯 Quick Checklist

- [ ] Run `./create_production_zip.sh`
- [ ] Verify zip size (~124KB)
- [ ] Upload to cPanel
- [ ] Extract in `/home/mcubyjwq/mcubeplus.com/verification/`
- [ ] Create Node.js app with correct settings
- [ ] Add all environment variables
- [ ] Run NPM Install
- [ ] Start application
- [ ] Test verification page
- [ ] Test admin panel
- [ ] Verify database created

---

## 🔒 Security Notes

✅ **What's secure:**
- `.env.production` is uploaded (contains production config)
- Development `.env` excluded (not exposed)
- Database outside web directory
- Documentation excluded (not public)
- Test scripts excluded

⚠️ **Important:**
- Never commit `.env.production` to git
- Keep admin password secure
- Keep SESSION_SECRET secret
- Keep email credentials private

---

**Production URL:** `https://mcubeplus.com/verification`

**Database:** `/home/mcubyjwq/selfie_data/verifications.db`

**Admin Login:** `admin` / `Shop0203$`
