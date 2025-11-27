# Quick Deployment Summary - cPanel Production

**Your cPanel Setup:**
- **Server:** premium56.web-hosting.com
- **Home:** `/home/mcubyjwq`
- **App Directory:** `/home/mcubyjwq/mcubeplus.com/verification/`
- **Database:** `/home/mcubyjwq/selfie_data/verifications.db`
- **Backups:** `/home/mcubyjwq/backups/`
- **Logs:** `/home/mcubyjwq/logs/verification.log`
- **Public URL:** `https://mcubeplus.com/verification`
- **Admin Panel:** `https://mcubeplus.com/verification/admin/dashboard`

---

## Pre-Deployment Checklist

### Files Configured for Your cPanel:

- [x] `src/database.js` - Uses `DB_PATH` environment variable
- [x] `.env.production` - Configured with cPanel paths
- [x] `.gitignore` - Excludes database and sensitive files
- [x] `CPANEL_DEPLOYMENT_GUIDE.md` - Complete step-by-step guide
- [x] `backup_cpanel_db.sh` - Automated backup script

---

## 🚀 Quick Deployment Steps

### 1. Create Production Package

**Run the production zip script:**
```bash
cd /Users/kingsley/Desktop/selfie_verification
./create_production_zip.sh
```

This creates a clean **`selfie_verification_production.zip`** with:
- ✅ Only production files (src/, views/, public/, package.json, .env.production)
- ❌ Excludes: .env, documentation, test files, .gitignore, node_modules

**Then upload to cPanel File Manager:**
- Navigate to: `/home/mcubyjwq/mcubeplus.com/verification/`
- Upload: `selfie_verification_production.zip`
- Extract and delete zip

### 2. Create Database Directory
```bash
# Via SSH or File Manager
mkdir -p /home/mcubyjwq/selfie_data
chmod 755 /home/mcubyjwq/selfie_data
```

### 3. Setup Node.js App in cPanel
- **Application root:** `mcubeplus.com/verification`
- **Startup file:** `src/server.js`
- **Node version:** 18.x or higher

### 4. Add Environment Variables (CRITICAL)
**Copy ALL variables from `.env.production` to cPanel Node.js app settings:**

**Most Important:**
```bash
DB_PATH=/home/mcubyjwq/selfie_data/verifications.db
ADMIN_DEFAULT_PASSWORD=ChangeThisToStrongPassword!
SESSION_SECRET=af4d6d0b71bc82e9a3e4bf6d68f215e30d6b25dd279ffea9c1a370178504a4a6
```

**All Variables:**
- `NODE_ENV=production`
- `DB_PATH=/home/mcubyjwq/selfie_data/verifications.db`
- `ADMIN_DEFAULT_PASSWORD` (set strong password)
- `SESSION_SECRET` (32+ random characters)
- `APP_BASE_URL_PROD=https://mcubeplus.com/verification`
- `BORROWERS_PORTAL_URL=https://mcubeplus.com/borrowersaccount/`
- All SELFIE_* variables (API config)
- All EMAIL_* variables (SMTP config)

### 5. Install Dependencies
```bash
# In cPanel Node.js app: Click "Run NPM Install"
# Or via SSH:
cd /home/mcubyjwq/mcubeplus.com/verification
npm install --production
```

### 6. Start Application
- In cPanel → Setup Node.js App → Click "Start" or "Restart"

### 7. Verify Domain Access
- Your app will be accessible at: `https://mcubeplus.com/verification`
- Ensure main domain `mcubeplus.com` has SSL certificate
- No separate subdomain configuration needed

### 8. Setup Backups
```bash
# Upload backup script
chmod +x /home/mcubyjwq/backup_cpanel_db.sh

# Add cron job (daily at 2 AM):
# 0 2 * * * /home/mcubyjwq/backup_cpanel_db.sh
```

---

## 🔒 Security Checklist

**BEFORE going live:**

- [ ] Change `ADMIN_DEFAULT_PASSWORD` to strong password
- [ ] Change `SESSION_SECRET` to random 32+ character string
- [ ] Verify `DB_PATH=/home/mcubyjwq/selfie_data/verifications.db`
- [ ] SSL certificate installed on `verify.mcubeplus.com`
- [ ] Database directory NOT in public_html
- [ ] `.env.production` NOT uploaded (use cPanel env vars)
- [ ] Test verification flow end-to-end
- [ ] Test admin panel login
- [ ] Test email notifications
- [ ] Backups configured and tested

---

## 🧪 Testing After Deployment

### 1. Test Verification Flow
```
Visit: https://mcubeplus.com/verification/verify
- Fill form with test data
- Upload or capture selfie
- Submit
- Should redirect to results page
- Check email sent (if verification approved)
```

### 2. Test Admin Panel
```
Visit: https://mcubeplus.com/verification/admin/dashboard
- Login with ADMIN_DEFAULT_PASSWORD
- Should see verification statistics
```

### 3. Check Database
```bash
# Via SSH
ls -lh /home/mcubyjwq/selfie_data/
# Should see verifications.db file
```

### 4. Check Logs
```bash
# Application logs
tail -f /home/mcubyjwq/logs/verification.log
# Should show "Using database at: /home/mcubyjwq/selfie_data/verifications.db"
# Should show "Connected to SQLite database"
```

---

## 📁 Your Directory Structure

```
/home/mcubyjwq/
├── mcubeplus.com/
│   └── verification/          # Your app code (upload here)
│   ├── src/
│   │   ├── server.js
│   │   ├── database.js         # Now uses DB_PATH env var
│   │   ├── config.js
│   │   ├── selfieService.js
│   │   └── ...
│   ├── views/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── selfie_data/                # Database directory (create this)
│   └── verifications.db        # Created automatically on first run
│
├── backups/                    # Backups (created by backup script)
│   ├── verifications_20251127_020000.db
│   └── ...
│
├── backup_cpanel_db.sh         # Upload backup script here
│
└── logs/
    ├── mcubeplus.com.log       # Application logs
    └── backup.log              # Backup logs
```

---

## ⚡ Quick Commands Reference

### Check if database exists:
```bash
ls -lh /home/mcubyjwq/selfie_data/verifications.db
```

### View application logs:
```bash
tail -100 /home/mcubyjwq/logs/mcubeplus.com.log
```

### Run manual backup:
```bash
/home/mcubyjwq/backup_cpanel_db.sh
```

### Check environment variables (if SSH access):
```bash
cd /home/mcubyjwq/mcubeplus.com
printenv | grep -E 'DB_PATH|NODE_ENV|ADMIN'
```

### Restart application:
```
In cPanel → Setup Node.js App → Click "Restart"
```

---

## 🆘 Common Issues

### App won't start
1. Check Node.js version (must be 18+)
2. Verify all environment variables are set
3. Check logs: `/home/mcubyjwq/logs/mcubeplus.com.log`

### Database errors
1. Verify `DB_PATH=/home/mcubyjwq/selfie_data/verifications.db`
2. Check directory exists and has permissions (755)
3. Look for "Using database at:" in logs

### Domain not accessible
1. Check DNS propagation (can take 1-24 hours)
2. Verify domain added in cPanel → Domains
3. Check SSL certificate status

---

## 📞 Support Files

- **Complete Guide:** `CPANEL_DEPLOYMENT_GUIDE.md`
- **Backup Script:** `backup_cpanel_db.sh`
- **Production Config:** `.env.production`

---

## 🎯 Critical Environment Variables

**These MUST be set in cPanel Node.js app configuration:**

```bash
# Database (MOST IMPORTANT)
DB_PATH=/home/mcubyjwq/selfie_data/verifications.db

# Security (CHANGE THESE!)
ADMIN_DEFAULT_PASSWORD=YourStrongPasswordHere
SESSION_SECRET=your-random-32-plus-character-secret

# System
NODE_ENV=production
PORT=4000
```

---

**Last Updated:** November 27, 2025  
**For:** M'Cube Plus Selfie Verification System  
**Server:** premium56.web-hosting.com (/home/mcubyjwq)
