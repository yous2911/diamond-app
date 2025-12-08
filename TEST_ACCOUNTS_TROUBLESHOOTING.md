# 🔧 Test Accounts Troubleshooting Guide

## ✅ What I Fixed

1. **Frontend API Port**: Changed from `5000` → `3003` to match backend
2. **Frontend Test Accounts**: Updated to match database accounts exactly
3. **Seed Script**: Added `role` field support for authentication

## 🔍 Potential Issues to Check

### 1. **Database Not Seeded**
**Problem**: Test accounts don't exist in the database.

**Fix**:
```powershell
cd C:\Users\rachida\Desktop\DIAMOND-APP\backend
node scripts/check-and-seed-db.js
```

This will:
- Check if accounts exist
- Create them if missing
- Fix password hashes
- Set the `role` field

### 2. **Role Column Missing**
**Problem**: The `role` column might not exist in the `students` table.

**Fix**:
```powershell
cd C:\Users\rachida\Desktop\DIAMOND-APP\backend
node scripts/add-role-column.js
```

### 3. **Password Hash Issues**
**Problem**: Passwords might not be hashed correctly.

**Fix**:
```powershell
cd C:\Users\rachida\Desktop\DIAMOND-APP\backend
node scripts/fix-test-passwords.js
```

### 4. **Case Sensitivity**
**Problem**: MySQL string comparisons are case-sensitive by default.

**Solution**: Make sure names match exactly:
- ✅ `Emma` (not `emma` or `EMMA`)
- ✅ `Martin` (not `martin` or `MARTIN`)

### 5. **Port Mismatch**
**Problem**: Frontend trying to connect to wrong port.

**Status**: ✅ **FIXED** - Changed from port 5000 to 3003

### 6. **Frontend Test Accounts Mismatch**
**Problem**: Frontend showing accounts that don't exist in database.

**Status**: ✅ **FIXED** - Updated to match database:
- Emma Martin
- Lucas Dubois
- Léa Bernard
- Noah Garcia
- Alice Rodriguez

## 📋 Complete Setup Checklist

Run these commands in order:

```powershell
# 1. Add role column (if missing)
cd C:\Users\rachida\Desktop\DIAMOND-APP\backend
node scripts/add-role-column.js

# 2. Seed/check test accounts
node scripts/check-and-seed-db.js

# 3. Fix passwords (if needed)
node scripts/fix-test-passwords.js
```

## 🧪 Test Account Credentials

| Prénom | Nom | Level | Password |
|--------|-----|-------|----------|
| Emma | Martin | CP | `password1234` |
| Lucas | Dubois | CP | `password1234` |
| Léa | Bernard | CP | `password1234` |
| Noah | Garcia | CE1 | `password1234` |
| Alice | Rodriguez | CE1 | `password1234` |

**Important**: Password must be exactly `password1234` (12 characters - minimum required)

## 🔍 Verify Everything Works

1. **Check Backend is Running**:
   - Should see: `Server listening at http://0.0.0.0:3003`
   - No Redis errors (should say "Redis disabled")

2. **Check Frontend is Running**:
   - Should open at `http://localhost:3000`
   - Should show test account buttons

3. **Try Login**:
   - Click any test account button
   - Should auto-fill: Prénom, Nom, Password
   - Click "Se connecter"
   - Should redirect to dashboard

## 🐛 Common Errors

### Error: "Identifiants incorrects"
**Causes**:
- Account doesn't exist in database → Run seed script
- Password hash is wrong → Run fix-passwords script
- Name case mismatch → Check exact spelling

### Error: "ERR_CONNECTION_REFUSED"
**Causes**:
- Backend not running → Start with `npm run dev`
- Wrong port → Frontend should use port 3003 (✅ fixed)

### Error: "role is undefined"
**Causes**:
- Role column missing → Run `add-role-column.js`
- Role not set on account → Run seed script (✅ fixed)

## ✅ Final Verification

After running all scripts, verify in MySQL:

```sql
SELECT prenom, nom, email, 
       CASE WHEN password_hash IS NOT NULL THEN '✅' ELSE '❌' END as has_password,
       CASE WHEN role IS NOT NULL THEN role ELSE '❌' END as role
FROM students 
WHERE email LIKE '%@test.com'
ORDER BY prenom;
```

All accounts should show:
- ✅ has_password
- role = 'student'

---

**Last Updated**: After fixing port, frontend accounts, and seed script role support




