# Render.com Deployment Guide - Selfie Verification System

## 🎯 Overview

Deploy your selfie verification app to Render.com with PostgreSQL database - **100% FREE**!

**What you'll get:**
- Free web service (sleeps after 15 min inactivity)
- Free PostgreSQL database (90 days, then $7/month or use external free DB)
- Automatic SSL certificate
- GitHub auto-deployment
- No memory limits like cPanel

---

## 📋 Prerequisites

1. ✅ GitHub account
2. ✅ Your code pushed to GitHub repository
3. ✅ Render.com account (free signup)

---

## 🚀 Step-by-Step Deployment

### **Step 1: Push Your Code to GitHub**

If not already done:

```bash
cd /Users/kingsley/Desktop/selfie_verification

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - PostgreSQL ready"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

---

### **Step 2: Sign Up for Render**

1. Go to: https://render.com
2. Click **"Get Started"**
3. Sign up with GitHub (recommended) or email
4. Authorize Render to access your repositories

---

### **Step 3: Create PostgreSQL Database**

1. From Render Dashboard, click **"New +"**
2. Select **"PostgreSQL"**
3. Configure:
   - **Name:** `selfie-verification-db`
   - **Database:** `selfie_verification`
   - **User:** `selfie_admin` (auto-generated)
   - **Region:** Choose closest to your users
   - **Plan:** **Free** (select this!)

4. Click **"Create Database"**

5. **IMPORTANT:** Copy the connection details:
   - **Internal Database URL** (starts with `postgresql://...`)
   - Save this - you'll need it!

**Example:**
```
postgresql://selfie_admin:XXXXX@dpg-xxxxx.oregon-postgres.render.com/selfie_verification
```

---

### **Step 4: Create Web Service**

1. From Render Dashboard, click **"New +"**
2. Select **"Web Service"**
3. Click **"Connect a repository"**
4. Select your repository: `selfie_verification`
5. Configure:

#### Basic Settings:
| Setting | Value |
|---------|-------|
| **Name** | `selfie-verification-service` |
| **Region** | Same as database |
| **Branch** | `main` |
| **Root Directory** | (leave blank) |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

#### Plan:
- Select **"Free"** (0$/month)

6. Click **"Advanced"** to add environment variables

---

### **Step 5: Add Environment Variables**

Click **"Add Environment Variable"** for each:

```bash
# System
NODE_ENV=production

# Database (CRITICAL - use the URL from Step 3)
DATABASE_URL=postgresql://selfie_admin:XXXXX@dpg-xxxxx.oregon-postgres.render.com/selfie_verification

# Security
ADMIN_DEFAULT_PASSWORD=Shop0203$
SESSION_SECRET=af4d6d0b71bc82e9a3e4bf6d68f215e30d6b25dd279ffea9c1a370178504a4a6

# Application URLs (update after deployment)
APP_BASE_URL_PROD=https://selfie-verification-service.onrender.com
BORROWERS_PORTAL_URL=https://mcubeplus.com/borrowersaccount/

# Selfie API
SELFIE_API_BASE_URL=https://selfie.imsgh.org:2035/skyface
SELFIE_MERCHANT_KEY=961b1044-c797-4abb-9272-1c6e3688d814
SELFIE_CENTER=BRANCHLESS
SELFIE_USER_ID=MCUBE_PORTAL
SELFIE_DATA_TYPE=PNG

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=identity.review@mcubeplus.com
EMAIL_PASS=jjprtqcpwjvivcof
EMAIL_FROM=identity.review@mcubeplus.com
KYC_SUCCESS_RECIPIENTS=ops@mcubeplus.com,compliance@mcubeplus.com
```

**IMPORTANT:** Replace the `DATABASE_URL` value with your actual database URL from Step 3!

---

### **Step 6: Deploy!**

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repo
   - Run `npm install`
   - Run `npm start`
   - Create SSL certificate
   - Assign URL

3. **Wait 3-5 minutes** for initial deployment

4. Watch the logs for:
```
Using PostgreSQL database
Connected to PostgreSQL database
PostgreSQL tables initialized
Selfie verification service listening on port 4000 in production mode
```

---

### **Step 7: Get Your Production URL**

After deployment completes:

1. Your app will be at: `https://YOUR-SERVICE-NAME.onrender.com`
   - Example: `https://selfie-verification-service.onrender.com`

2. **Update APP_BASE_URL_PROD:**
   - Go to **Environment** tab
   - Edit `APP_BASE_URL_PROD`
   - Set to your actual Render URL
   - Click **"Save Changes"**
   - Service will auto-redeploy

---

### **Step 8: Verify Deployment**

Test these URLs:

1. **Verification page:**
   ```
   https://your-service.onrender.com/verify
   ```
   Should show the verification form

2. **Admin panel:**
   ```
   https://your-service.onrender.com/admin/dashboard
   ```
   Login: `admin` / `Shop0203$`

3. **Check logs** in Render dashboard for any errors

---

## 🎯 Custom Domain (Optional)

Want to use `verify.mcubeplus.com` instead of `.onrender.com`?

1. In Render service, go to **"Settings"**
2. Scroll to **"Custom Domain"**
3. Click **"Add Custom Domain"**
4. Enter: `verify.mcubeplus.com`
5. Render will show DNS records to add
6. Add those records in your domain registrar
7. Wait for DNS propagation (5-60 minutes)

---

## 🔄 Auto-Deployment

Every time you push to GitHub `main` branch:
- Render automatically deploys the changes
- No manual upload needed!

```bash
# Make changes
git add .
git commit -m "Update feature"
git push

# Render auto-deploys in 2-3 minutes
```

---

## 📊 Monitoring

**View logs:**
1. Go to your service in Render
2. Click **"Logs"** tab
3. See real-time application logs

**Check database:**
1. Go to your PostgreSQL database in Render
2. Click **"Connect"** for connection details
3. Use tools like pgAdmin or TablePlus to view data

---

## ⚠️ Important Notes

### **Free Tier Limitations:**

1. **Service Sleeps:**
   - After 15 minutes of inactivity, service sleeps
   - First request wakes it up (~30 seconds delay)
   - Subsequent requests are instant

2. **Database Free Tier:**
   - 1GB storage
   - 90 days free, then $7/month
   - Or use external free PostgreSQL (ElephantSQL, Supabase)

3. **750 Hours/Month:**
   - Enough for one always-on service
   - Multiple services share the hours

### **Preventing Sleep:**

Use a free uptime monitor:
- https://uptimerobot.com (free)
- Ping your service every 5 minutes
- Keeps it awake during business hours

---

## 🔧 Troubleshooting

### **Build Failed:**

Check build logs for:
- Missing dependencies → Run `npm install` locally first
- Syntax errors → Test locally with `npm start`

### **Database Connection Error:**

Verify:
- `DATABASE_URL` is set correctly
- Database is in same region
- URL includes username, password, host, and database name

### **App Not Responding:**

- Check logs for errors
- Verify environment variables are set
- Ensure port 4000 is in use (Render auto-detects)

---

## 📈 Next Steps After Deployment

1. ✅ Test full verification flow
2. ✅ Test admin panel
3. ✅ Verify email notifications work
4. ✅ Set up uptime monitoring
5. ✅ Configure custom domain (optional)
6. ✅ Set up backup strategy for database

---

## 💰 Cost Comparison

| Platform | Cost | Limitations |
|----------|------|-------------|
| **Render Free** | $0/month | Service sleeps, 750 hrs |
| **cPanel** | $5-15/month | Memory limits, manual deploys |
| **Railway** | ~$5/month | Credit-based, no sleep |
| **Heroku** | $7/month | Deprecated free tier |

---

## 🆘 Support

**Render Support:**
- Dashboard → Help (bottom left)
- Community: https://community.render.com
- Docs: https://render.com/docs

**Your App URLs:**
- Web Service: https://your-service.onrender.com
- Admin: https://your-service.onrender.com/admin/dashboard
- Verification: https://your-service.onrender.com/verify

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] PostgreSQL database created on Render
- [ ] Database URL copied
- [ ] Web service created and linked to repo
- [ ] All environment variables added
- [ ] `DATABASE_URL` set correctly
- [ ] `APP_BASE_URL_PROD` updated after first deploy
- [ ] Deployment successful
- [ ] Verification page accessible
- [ ] Admin panel accessible
- [ ] Email notifications tested
- [ ] Uptime monitor configured (optional)

---

**Your app is now live on Render.com! 🎉**

No memory limits, automatic deploys, and PostgreSQL database - all free!
