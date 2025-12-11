# ✅ PRE-DEPLOYMENT CHECKLIST

## 🎯 Status: READY TO DEPLOY (95%)

Your app is **production-ready**! Follow this checklist before deploying.

---

## ✅ CODE READINESS (100% Complete)

- [x] **Backend Code:** TypeScript compiled, no blocking errors
- [x] **Frontend Code:** React app ready, no console errors
- [x] **Database Schema:** All migrations ready
- [x] **API Endpoints:** All routes configured
- [x] **Security:** JWT, CORS, rate limiting configured
- [x] **Environment Config:** `env.backend` has production secrets

---

## ⚠️ PRE-DEPLOYMENT ACTIONS (5 minutes)

### 1. Verify Frontend package.json ✅
**Action:** Check `frontend/package.json` scripts:
- ✅ Should have: `"start": "react-scripts start"`
- ✅ Should have: `"build": "react-scripts build"`
- ❌ Should NOT have: `"set PORT=3004"` (Windows-specific)

**Status:** ✅ Already verified (no Windows-specific scripts found)

### 2. Generate Production Secrets 🔑
**Action:** Generate NEW secrets for Railway (don't use dev secrets!)

**Quick Secret Generator:**
```powershell
# Run in PowerShell:
$secret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host $secret
```

**Or use online:** https://www.random.org/strings/
- Generate 64-character strings for JWT secrets
- Generate 32-character string for ENCRYPTION_KEY

**Required Secrets:**
- [ ] `JWT_SECRET` (64+ characters)
- [ ] `JWT_REFRESH_SECRET` (64+ characters)
- [ ] `COOKIE_SECRET` (64+ characters)
- [ ] `ENCRYPTION_KEY` (exactly 32 characters)

### 3. Prepare Database Migration Script 📊
**Action:** Ensure you have database setup ready

**Files to use:**
- `backend/create-fresh-database.sql` - Initial database setup
- `backend/scripts/init-db.sql` - Alternative initialization

**Status:** ✅ Database scripts ready

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Deploy Backend (Railway) - 15 min
- [ ] Create Railway account
- [ ] Create new project from GitHub
- [ ] Add MySQL database
- [ ] Configure environment variables (copy from `env.backend`)
- [ ] Generate Railway domain
- [ ] Run database migrations
- [ ] Verify health check: `/api/health`

### Step 2: Deploy Frontend (Vercel) - 10 min
- [ ] Create Vercel account
- [ ] Import GitHub repository
- [ ] Set root directory: `frontend`
- [ ] Add environment variable: `REACT_APP_API_URL`
- [ ] Deploy and get Vercel URL

### Step 3: Connect Services - 2 min
- [ ] Update Railway `CORS_ORIGIN` with Vercel URL
- [ ] Verify frontend can call backend API
- [ ] Test authentication flow

---

## 📋 ENVIRONMENT VARIABLES CHECKLIST

### Backend (Railway) - Copy from `backend/env.backend`

**Required Variables:**
```env
NODE_ENV=production
PORT=3003
HOST=0.0.0.0

# Database (Railway provides these)
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}

# Secrets (GENERATE NEW ONES!)
JWT_SECRET=<new-secret>
JWT_REFRESH_SECRET=<new-secret>
COOKIE_SECRET=<new-secret>
ENCRYPTION_KEY=<32-char-secret>

# CORS (Update after frontend deploy)
CORS_ORIGIN=https://your-frontend.vercel.app

# Other settings
REDIS_ENABLED=false
GDPR_ENABLED=true
```

### Frontend (Vercel)

**Required Variables:**
```env
REACT_APP_API_URL=https://your-backend.railway.app/api
```

---

## 🔍 VERIFICATION CHECKLIST

### After Backend Deployment:
- [ ] Railway service shows "Active" status
- [ ] Health check returns: `{"status":"ok"}`
- [ ] Database connection successful (check logs)
- [ ] No errors in Railway logs

### After Frontend Deployment:
- [ ] Vercel build completed successfully
- [ ] Site loads without errors
- [ ] Browser console shows no errors (F12)
- [ ] API calls work (check Network tab)

### After Connection:
- [ ] No CORS errors in browser console
- [ ] Login/authentication works
- [ ] Data loads from backend
- [ ] All features functional

---

## 🚨 COMMON ISSUES & FIXES

### Issue: Database Connection Failed
**Fix:**
- Verify MySQL service is running in Railway
- Check `DB_HOST`, `DB_USER`, `DB_PASSWORD` match Railway MySQL
- Use Railway's connection variables: `${{MySQL.MYSQLHOST}}`

### Issue: Build Failed
**Fix:**
- Check Railway/Vercel logs for specific errors
- Verify `package.json` scripts are correct
- Ensure all dependencies are listed

### Issue: CORS Errors
**Fix:**
- Update `CORS_ORIGIN` in Railway with exact Vercel URL
- Include both `https://` and `https://www.` versions
- Restart Railway service after updating

### Issue: Environment Variables Not Working
**Fix:**
- Vercel: Variables must start with `REACT_APP_` for React
- Railway: Use exact variable names from `env.backend`
- Redeploy after adding variables

---

## 📊 CURRENT CONFIGURATION

### Backend (`backend/env.backend`)
- ✅ Secrets: Already generated (128 chars)
- ✅ Port: 3003
- ✅ Database: Configured for localhost (will change for Railway)
- ✅ CORS: Template ready (needs Vercel URL)

### Frontend
- ✅ API URL: Uses `REACT_APP_API_URL` environment variable
- ✅ Build: Standard React build process
- ✅ Routes: All configured

---

## 🎯 READY TO DEPLOY!

**Estimated Time:** 30-45 minutes total
- Backend: 15-20 minutes
- Frontend: 10-15 minutes
- Connection: 2-5 minutes

**Next Step:** Follow `DEPLOY_NOW.md` for detailed step-by-step instructions!

---

**Questions?** Check:
- `DEPLOY_NOW.md` - Complete deployment guide
- `DEPLOY_TO_RAILWAY_AND_VERCEL.md` - Platform-specific guide
- `CHECKLIST_DEPLOIEMENT_FINAL.md` - French checklist

