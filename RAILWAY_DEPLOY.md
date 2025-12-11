# 🚂 Deploy Backend to Railway

## Quick Steps

### 1. Go to Railway
- Visit https://railway.app
- Sign up/login with GitHub
- Click "New Project" → "Deploy from GitHub repo"
- Select: `yous2911/diamond-app`

### 2. Configure Service
- **Root Directory**: `backend`
- Railway will auto-detect Node.js

### 3. Add MySQL Database
- Click "+ New" → "Database" → "Add MySQL"
- Railway creates it automatically

### 4. Set Environment Variables
In Railway → Your Service → Variables, add:

```
NODE_ENV=production
PORT=3000

# Database (Railway auto-provides these - use ${{MySQL.MYSQLHOST}} etc)
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}

# Generate these with: openssl rand -hex 32
JWT_SECRET=<your-32-char-secret>
JWT_REFRESH_SECRET=<your-32-char-secret>
ENCRYPTION_KEY=<exactly-32-characters>
COOKIE_SECRET=<your-32-char-secret>

# Update after frontend deploys
CORS_ORIGIN=https://your-frontend.vercel.app

REDIS_ENABLED=false
```

### 5. Generate Domain
- Settings → Generate Domain
- Copy the URL (e.g., `https://diamond-app-production.up.railway.app`)

### 6. Test
Visit: `https://your-backend.railway.app/api/health`

---

## ✅ Done! Backend is live!








