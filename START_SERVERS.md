# 🚀 Start Servers - Quick Commands

## PowerShell Commands (Copy/Paste)

### Terminal 1 - Backend:
```powershell
cd C:\Users\rachida\Desktop\DIAMOND-APP\backend
npm run dev
```

### Terminal 2 - Frontend (New PowerShell Window):
```powershell
cd C:\Users\rachida\Desktop\DIAMOND-APP\frontend
npm start
```

---

## 🔧 Fix Test Accounts (If Login Fails)

### Step 1: Seed Test Accounts
```powershell
cd C:\Users\rachida\Desktop\DIAMOND-APP\backend
node scripts/check-and-seed-db.js
```

This will:
- ✅ Check if test accounts exist
- ✅ Create/update them with correct password
- ✅ Use password: `password1234` (12 characters)

### Step 2: If Still Not Working, Fix Passwords
```powershell
cd C:\Users\rachida\Desktop\DIAMOND-APP\backend
node scripts/fix-test-passwords.js
```

---

## 🔑 Test Account Credentials

**Password:** `password1234` (12 characters - required!)

### Working Accounts:
1. **Emma Martin** (CP)
   - Prénom: `Emma`
   - Nom: `Martin`
   - Password: `password1234`

2. **Lucas Dubois** (CP)
   - Prénom: `Lucas`
   - Nom: `Dubois`
   - Password: `password1234`

3. **Léa Bernard** (CP)
   - Prénom: `Léa`
   - Nom: `Bernard`
   - Password: `password1234`

4. **Noah Garcia** (CE1)
   - Prénom: `Noah`
   - Nom: `Garcia`
   - Password: `password1234`

5. **Alice Rodriguez** (CE1)
   - Prénom: `Alice`
   - Nom: `Rodriguez`
   - Password: `password1234`

---

## ⚠️ Common Issues

### Issue 1: "Account not found"
**Fix:** Run `node scripts/check-and-seed-db.js`

### Issue 2: "Invalid password"
**Fix:** Run `node scripts/fix-test-passwords.js`

### Issue 3: "Database connection error"
**Fix:** Check MySQL is running and credentials in `env.backend` are correct

---

## ✅ Quick Test

1. Start backend → Should see "Server running on port 3003"
2. Start frontend → Should open http://localhost:3000
3. Try login with: **Emma** / **Martin** / **password1234**
4. Should redirect to dashboard




