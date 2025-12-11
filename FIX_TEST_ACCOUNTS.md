# 🔧 Fix Test Accounts - Quick Guide

## The Problem
Test accounts might not exist OR have wrong password hashes.

## ✅ Solution (Run This):

```powershell
# Step 1: Seed/Create test accounts
cd C:\Users\rachida\Desktop\DIAMOND-APP\backend
node scripts/check-and-seed-db.js
```

This script will:
- ✅ Check if test accounts exist
- ✅ Create them if missing
- ✅ Update passwords to `password1234` (12 chars)
- ✅ Show you which accounts are ready

## 🔑 Test Account Credentials

**Password:** `password1234` (12 characters - REQUIRED!)

### Try These Accounts:

1. **Emma Martin** (CP)
   - Prénom: `Emma`
   - Nom: `Martin`
   - Password: `password1234`

2. **Lucas Dubois** (CP)
   - Prénom: `Lucas`
   - Nom: `Dubois`
   - Password: `password1234`

3. **Noah Garcia** (CE1)
   - Prénom: `Noah`
   - Nom: `Garcia`
   - Password: `password1234`

## 🚀 Start Servers Commands

### Terminal 1 - Backend:
```powershell
cd C:\Users\rachida\Desktop\DIAMOND-APP\backend
npm run dev
```

### Terminal 2 - Frontend:
```powershell
cd C:\Users\rachida\Desktop\DIAMOND-APP\frontend
npm start
```

## ⚠️ If Login Still Fails:

1. **Check database connection** - Make sure MySQL is running
2. **Run fix passwords script:**
   ```powershell
   cd backend
   node scripts/fix-test-passwords.js
   ```
3. **Check backend logs** - Look for authentication errors

## 📝 What the Script Does:

- Connects to MySQL database
- Checks if test accounts exist
- Creates accounts with proper password hash (`password1234`)
- Updates existing accounts if passwords are wrong
- Shows you which accounts are ready

---

**After running the script, test accounts should work!**







