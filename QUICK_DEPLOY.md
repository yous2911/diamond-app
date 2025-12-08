# 🚀 Quick Deployment Guide

## Fastest Way to Deploy

### Option 1: Use the Deployment Script (Recommended)

```powershell
.\deploy.ps1
```

This script will:
- ✅ Check for required files
- ✅ Install dependencies
- ✅ Let you choose what to start (backend, frontend, or both)

### Option 2: Manual Deployment

#### 1. Setup Backend Environment

```powershell
cd backend
# Copy example env file if it doesn't exist
if (-not (Test-Path env.backend)) {
    Copy-Item env.backend.example env.backend
}

# Edit env.backend and set:
# - DB_PASSWORD (your MySQL password)
# - JWT_SECRET (generate: openssl rand -hex 32)
# - JWT_REFRESH_SECRET (generate: openssl rand -hex 32)
# - ENCRYPTION_KEY (must be exactly 32 characters)
# - COOKIE_SECRET (generate: openssl rand -hex 32)
```

#### 2. Install Dependencies

```powershell
# Backend
cd backend
npm install

# Frontend (new terminal)
cd frontend
npm install
```

#### 3. Start Services

**Backend:**
```powershell
cd backend
npm run dev
# Runs on http://localhost:3003
```

**Frontend:**
```powershell
cd frontend
npm start
# Runs on http://localhost:3000
```

## What to Check After Deployment

### Backend Health
- ✅ `GET http://localhost:3003/api/health` - Should return 200 OK
- ✅ Check console for "Server started successfully"
- ✅ Check for database connection errors

### Frontend
- ✅ Opens at `http://localhost:3000`
- ✅ No console errors
- ✅ Can navigate between pages
- ✅ Login screen appears

### Common Issues

1. **Database Connection Failed**
   - Check MySQL is running
   - Verify credentials in `env.backend`
   - Check DB_NAME matches your database

2. **Port Already in Use**
   - Backend: Change PORT in `env.backend` (default: 3003)
   - Frontend: Change in `package.json` or use PORT=3001 npm start

3. **Missing Environment Variables**
   - Backend requires `env.backend` file (not `.env`)
   - All secrets must be set (JWT_SECRET, ENCRYPTION_KEY, etc.)

4. **CORS Errors**
   - Check CORS_ORIGIN in `env.backend` includes frontend URL
   - Default: `http://localhost:3000,http://localhost:3001,http://localhost:3004`

## Quick Test Endpoints

```bash
# Health check
curl http://localhost:3003/api/health

# Test login (if you have test data)
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"prenom":"Alice","nom":"Dupont","password":"test123"}'
```

## Next Steps

After deployment, test:
1. ✅ Backend health endpoint
2. ✅ Frontend loads without errors
3. ✅ Login/authentication flow
4. ✅ Navigation between pages
5. ✅ Exercise functionality
6. ✅ API endpoints (check browser network tab)

If something breaks, check:
- Browser console (F12)
- Backend console logs
- Network requests (F12 → Network tab)





