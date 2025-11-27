# cPanel Deployment Guide - M'Cube Plus Selfie Verification

**Server:** premium56.web-hosting.com  
**Home Directory:** `/home/mcubyjwq`  
**App Directory:** `/home/mcubyjwq/mcubeplus.com/verification`  
**Production URL:** `https://mcubeplus.com/verification`

---

## Prerequisites

✅ cPanel with Node.js support  
✅ SSH access (optional but recommended)  
✅ Domain `verify.mcubeplus.com` pointing to your server  
✅ SSL certificate (cPanel AutoSSL or Let's Encrypt)

---

## Step 1: Prepare Your Code

### On Your Local Machine:

1. **Commit all changes to git:**
   ```bash
   cd /Users/kingsley/Desktop/selfie_verification
   git add .
   git commit -m "Production configuration for cPanel"
   git push origin main
   ```

2. **Or create a zip file (without node_modules):**
   ```bash
   # Exclude node_modules from zip
   zip -r selfie_verification.zip . -x "node_modules/*" -x "data/*" -x ".git/*"
   ```

---

## Step 2: Upload Code to cPanel

### Option A: Using Git (Recommended)

1. In cPanel → **Git Version Control**
2. Click **Create**:
   - Repository URL: `your-github-repo-url`
   - Repository Path: `/home/mcubyjwq/mcubeplus.com/verification`
   - Repository Name: `selfie_verification`
3. Click **Create**
4. Future updates: Click **Pull or Deploy** → **Update from Remote**

### Option B: Using File Manager

1. In cPanel → **File Manager**
2. Navigate to `/home/mcubyjwq/`
3. If `mcubeplus.com` doesn't exist, create it (New Folder)
4. Enter `mcubeplus.com` directory
5. Upload `selfie_verification.zip`
6. Right-click → Extract
7. Move all files from extracted folder to `mcubeplus.com` root

**Final structure should be:**
```
/home/mcubyjwq/mcubeplus.com/verification/
├── src/
├── views/
├── public/
├── package.json
├── .env.production
└── ...
```

---

## Step 3: Create Database Directory

**IMPORTANT:** Database must be outside the web directory for security.

### Via SSH (Recommended):
```bash
mkdir -p /home/mcubyjwq/selfie_data
chmod 755 /home/mcubyjwq/selfie_data
```

### Via File Manager:
1. Navigate to `/home/mcubyjwq/`
2. Click **+ Folder**
3. Name: `selfie_data`
4. Right-click → Permissions → Set to `755`

---

## Step 4: Setup Node.js Application

1. In cPanel → **Setup Node.js App**
2. Click **Create Application**

**Application Settings:**
- **Node.js version:** 18.x or higher (latest LTS)
- **Application mode:** Production
- **Application root:** `mcubeplus.com/verification`
- **Application URL:** (leave blank or set subdomain if needed)
- **Application startup file:** `src/server.js`
- **Passenger log file:** (default)

3. Click **Create**

---

## Step 5: Configure Environment Variables

In the Node.js app configuration page, add these environment variables:

**CRITICAL - Update these values:**

```bash
# System
NODE_ENV=production
PORT=4000

# IMPORTANT: Set strong passwords!
ADMIN_DEFAULT_PASSWORD=YourStrongPassword123!
SESSION_SECRET=af4d6d0b71bc82e9a3e4bf6d68f215e30d6b25dd279ffea9c1a370178504a4a6

# URLs
APP_BASE_URL_PROD=https://mcubeplus.com/verification
BORROWERS_PORTAL_URL=https://mcubeplus.com/borrowersaccount/

# Database (CRITICAL)
DB_PATH=/home/mcubyjwq/selfie_data/verifications.db

# Selfie API
SELFIE_API_BASE_URL=https://selfie.imsgh.org:2035/skyface
SELFIE_MERCHANT_KEY=961b1044-c797-4abb-9272-1c6e3688d814
SELFIE_CENTER=BRANCHLESS
SELFIE_USER_ID=MCUBE_PORTAL
SELFIE_DATA_TYPE=PNG

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=identity.review@mcubeplus.com
EMAIL_PASS=jjprtqcpwjvivcof
EMAIL_FROM=identity.review@mcubeplus.com
KYC_SUCCESS_RECIPIENTS=ops@mcubeplus.com,compliance@mcubeplus.com
```

**⚠️ IMPORTANT:**
- Change `ADMIN_DEFAULT_PASSWORD` to a strong password
- Change `SESSION_SECRET` to a random 32+ character string
- Don't share these values

---

## Step 6: Install Dependencies

In the Node.js app page:

1. Click **Run NPM Install** button
   
   OR via SSH:
   ```bash
   cd /home/mcubyjwq/mcubeplus.com/verification
   npm install --production
   ```

2. Wait for installation to complete (may take 2-3 minutes)

---

## Step 7: Start the Application

1. In Node.js app page, click **Start Application** (or **Restart**)
2. Check status - should show "Running"
3. Note the application URL provided by cPanel

**Check logs if errors occur:**
- View logs in cPanel Node.js app page
- Or via SSH:
  ```bash
  tail -f /home/mcubyjwq/logs/mcubeplus.com.log
  ```

---

## Step 8: Verify Domain Access

### Your app will be at: `https://mcubeplus.com/verification`

1. **No subdomain setup needed:**
   - App runs in `/verification` subfolder of main domain
   - Accessible at: `https://mcubeplus.com/verification`

2. **Ensure SSL for main domain:**
   - In cPanel → **SSL/TLS Status**
   - Find `mcubeplus.com`
   - Verify SSL certificate is active
   - If not, click **Run AutoSSL**

3. **Access URLs:**
   - Verification page: `https://mcubeplus.com/verification/verify`
   - Admin panel: `https://mcubeplus.com/verification/admin/dashboard`

---

## Step 9: Configure Reverse Proxy (If needed)

If cPanel doesn't automatically proxy the Node app to the domain:

1. In cPanel → **Terminal** or SSH:
   ```bash
   cd /home/mcubyjwq/mcubeplus.com
   nano .htaccess
   ```

2. Add this content:
   ```apache
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^(.*)$ http://localhost:4000/$1 [P,L]
   ```

3. Save and exit

**Note:** Most cPanel Node.js setups handle this automatically.

---

## Step 10: Verify Deployment

### Test the application:

1. **Open in browser:**
   ```
   https://verify.mcubeplus.com/verify
   ```

2. **Should see:**
   - M'Cube Plus branding
   - Identity verification form
   - Camera and upload options

3. **Test a verification:**
   - Fill in name, email, Ghana Card PIN
   - Upload or capture a selfie
   - Submit form
   - Should redirect to results page

4. **Test admin panel:**
   ```
   https://verify.mcubeplus.com/admin/dashboard
   ```
   - Login with your `ADMIN_DEFAULT_PASSWORD`
   - Should see verification statistics

5. **Check database was created:**
   ```bash
   ls -lh /home/mcubyjwq/selfie_data/
   # Should see verifications.db
   ```

---

## Step 11: Setup Automated Backups

See `backup_cpanel_db.sh` script included in the project.

### Quick setup:

1. Upload `backup_cpanel_db.sh` to `/home/mcubyjwq/`
2. Make executable:
   ```bash
   chmod +x /home/mcubyjwq/backup_cpanel_db.sh
   ```
3. In cPanel → **Cron Jobs**:
   - Minute: `0`
   - Hour: `2`
   - Day: `*`
   - Month: `*`
   - Weekday: `*`
   - Command: `/home/mcubyjwq/backup_cpanel_db.sh`

This runs daily at 2 AM.

---

## Troubleshooting

### App won't start:

1. **Check Node.js version:**
   - Use 18.x or higher
   - In cPanel → Setup Node.js App → change version

2. **Check logs:**
   ```bash
   tail -100 /home/mcubyjwq/logs/mcubeplus.com.log
   ```

3. **Check environment variables:**
   - All variables set correctly?
   - No typos in variable names?

### Database errors:

1. **Check DB_PATH:**
   ```bash
   echo $DB_PATH
   # Should show: /home/mcubyjwq/selfie_data/verifications.db
   ```

2. **Check permissions:**
   ```bash
   ls -la /home/mcubyjwq/selfie_data/
   # Should be writable by your user
   ```

3. **Manually create if needed:**
   ```bash
   touch /home/mcubyjwq/selfie_data/verifications.db
   chmod 644 /home/mcubyjwq/selfie_data/verifications.db
   ```

### Cannot access on domain:

1. **Check DNS propagation:**
   ```bash
   dig verify.mcubeplus.com
   nslookup verify.mcubeplus.com
   ```
   - May take 1-24 hours to propagate

2. **Check SSL certificate:**
   - In cPanel → SSL/TLS Status
   - Should show valid certificate for verify.mcubeplus.com

3. **Check domain configuration:**
   - In cPanel → Domains
   - verify.mcubeplus.com should be listed

### Email not sending:

1. **Test SMTP:**
   ```bash
   cd /home/mcubyjwq/mcubeplus.com
   node test_email_simple.js
   ```

2. **Check Gmail settings:**
   - App password still valid?
   - 2FA enabled on Gmail account?

---

## Updating the Application

### When you make changes:

1. **Via Git:**
   - Push changes to GitHub
   - In cPanel → Git Version Control → Pull or Deploy

2. **Via File Upload:**
   - Upload changed files
   - Replace existing files

3. **After any update:**
   - In cPanel → Setup Node.js App → **Restart**
   - Clear browser cache and test

---

## Production Checklist

- [ ] Code uploaded to `/home/mcubyjwq/mcubeplus.com/`
- [ ] Database directory created: `/home/mcubyjwq/selfie_data/`
- [ ] Node.js app created and configured
- [ ] All environment variables set (especially DB_PATH)
- [ ] Strong ADMIN_DEFAULT_PASSWORD set
- [ ] Strong SESSION_SECRET set
- [ ] Dependencies installed (npm install)
- [ ] Application started successfully
- [ ] Domain `verify.mcubeplus.com` configured
- [ ] SSL certificate active
- [ ] Test verification completed successfully
- [ ] Admin panel accessible
- [ ] Database created and writable
- [ ] Email notifications tested
- [ ] Automated backups configured
- [ ] Error logs checked (no critical errors)

---

## Quick Reference

**App Directory:** `/home/mcubyjwq/mcubeplus.com/verification/`  
**Database:** `/home/mcubyjwq/selfie_data/verifications.db`  
**Backups:** `/home/mcubyjwq/backups/`  
**Logs:** `/home/mcubyjwq/logs/verification.log`  
**Public URL:** `https://mcubeplus.com/verification`  
**Admin Panel:** `https://mcubeplus.com/verification/admin/dashboard`

---

## Support

If you encounter issues:

1. Check logs first
2. Verify environment variables
3. Test database connection
4. Check domain/DNS configuration
5. Review cPanel error logs

**Database location is critical:**  
`DB_PATH=/home/mcubyjwq/selfie_data/verifications.db`

---

**Last Updated:** November 27, 2025  
**Version:** 1.0  
**Deployment Type:** cPanel Production
