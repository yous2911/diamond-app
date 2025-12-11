# 🚀 Quick Setup Commands

## Step 1: Add Role Column (if missing)

```powershell
cd C:\Users\rachida\Desktop\DIAMOND-APP\backend
node scripts/add-role-column.js
```

## Step 2: Seed/Check Test Accounts

```powershell
cd C:\Users\rachida\Desktop\DIAMOND-APP\backend
node scripts/check-and-seed-db.js
```

## Step 3: Fix Passwords (if needed)

```powershell
cd C:\Users\rachida\Desktop\DIAMOND-APP\backend
node scripts/fix-test-passwords.js
```

---

## 🎯 All-in-One Command (run all 3)

```powershell
cd C:\Users\rachida\Desktop\DIAMOND-APP\backend
node scripts/add-role-column.js
node scripts/check-and-seed-db.js
node scripts/fix-test-passwords.js
```

---

## ✅ After Running Commands

1. **Restart your backend** (if it's running):
   - Press `Ctrl+C` in the backend terminal
   - Then: `npm run dev`

2. **Restart your frontend** (if it's running):
   - Press `Ctrl+C` in the frontend terminal  
   - Then: `npm start`

3. **Try logging in** with:
   - Prénom: `Emma`
   - Nom: `Martin`
   - Password: `password1234`

---

## 📋 Test Account Credentials

| Prénom | Nom | Password |
|--------|-----|----------|
| Emma | Martin | `password1234` |
| Lucas | Dubois | `password1234` |
| Léa | Bernard | `password1234` |
| Noah | Garcia | `password1234` |
| Alice | Rodriguez | `password1234` |







