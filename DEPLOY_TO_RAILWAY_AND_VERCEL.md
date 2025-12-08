# 🚀 Deploy to Railway (Backend) + Vercel (Frontend)

## Quick Deploy Guide - Show Your Baby! 👶

---

## 🎯 PART 1: Deploy Backend to Railway

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project"

### Step 2: Add MySQL Database
1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add MySQL"**
3. Railway will create a MySQL database automatically
4. **Copy the connection details** (you'll need them)

### Step 3: Deploy Backend
1. In Railway project, click **"+ New"** → **"GitHub Repo"**
2. Select your repository: `yous2911/diamond-app`
3. Railway will detect it's a Node.js project
4. Set **Root Directory** to: `backend`
5. Click **"Deploy"**

### Step 4: Configure Environment Variables
In Railway dashboard, go to your service → **Variables** tab, add:

```bash
# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database (Railway provides these - copy from MySQL service)
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}

# Security (GENERATE NEW SECRETS!)
JWT_SECRET=<generate-with: openssl rand -hex 32>
JWT_REFRESH_SECRET=<generate-with: openssl rand -hex 32>
ENCRYPTION_KEY=<must-be-exactly-32-characters>
COOKIE_SECRET=<generate-with: openssl rand -hex 32>

# CORS (update after frontend is deployed)
CORS_ORIGIN=https://your-frontend.vercel.app

# Optional
REDIS_ENABLED=false
GDPR_ENABLED=true
```

### Step 5: Generate Domain
1. In Railway, go to your service → **Settings** → **Generate Domain**
2. Copy the URL (e.g., `https://diamond-app-production.up.railway.app`)
3. This is your **backend API URL**

---

## 🎯 PART 2: Deploy Frontend to Vercel

### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "Add New Project"

### Step 2: Import Repository
1. Select your repository: `yous2911/diamond-app`
2. Set **Root Directory** to: `frontend`
3. Framework Preset: **"Create React App"**

### Step 3: Configure Build Settings
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

### Step 4: Add Environment Variables
In Vercel dashboard → **Settings** → **Environment Variables**, add:

```bash
REACT_APP_API_URL=https://your-railway-backend.up.railway.app/api
```

**Replace** `your-railway-backend.up.railway.app` with your actual Railway domain!

### Step 5: Deploy
1. Click **"Deploy"**
2. Wait for build to complete
3. Vercel will give you a URL like: `https://diamond-app.vercel.app`

---

## 🔗 Connect Frontend to Backend

After both are deployed:

1. **Update Vercel Environment Variable:**
   - Go to Vercel → Your Project → Settings → Environment Variables
   - Update `REACT_APP_API_URL` to your Railway backend URL
   - Redeploy frontend

2. **Update Railway CORS:**
   - Go to Railway → Your Service → Variables
   - Update `CORS_ORIGIN` to your Vercel frontend URL
   - Service will auto-restart

---

## ✅ Quick Checklist

### Backend (Railway)
- [ ] MySQL database added
- [ ] Backend service deployed
- [ ] Environment variables set (especially secrets!)
- [ ] Domain generated
- [ ] Health check works: `https://your-backend.railway.app/api/health`

### Frontend (Vercel)
- [ ] Repository imported
- [ ] Root directory set to `frontend`
- [ ] `REACT_APP_API_URL` environment variable set
- [ ] Deployed successfully
- [ ] Can access frontend URL

### Connection
- [ ] Frontend can call backend API
- [ ] CORS configured correctly
- [ ] Login works

---

## 🚨 Important Notes

1. **Generate NEW secrets for production!** Don't use development secrets
2. **Database will be empty** - you may need to run migrations
3. **Test accounts won't exist** - you'll need to create them or seed the database
4. **CORS must match** - frontend URL must be in backend's CORS_ORIGIN

---

## 🎉 After Deployment

Your app will be live at:
- **Frontend**: `https://your-app.vercel.app`
- **Backend API**: `https://your-backend.railway.app/api`

You can show your baby (project) to anyone! 🎊





