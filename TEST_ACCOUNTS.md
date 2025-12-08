# 🧪 Test Accounts (Comptes de Test)

## 📋 Available Test Accounts

### ⚠️ IMPORTANT: Password Requirements

**The password must be at least 12 characters long!**

All test accounts use the password: **`password1234`** (12 characters)

#### CP Level (6-8 years old)
1. **Emma Martin**
   - Email: `emma.martin@test.com`
   - Prénom: `Emma`
   - Nom: `Martin`
   - Level: CP
   - XP: 150
   - Password: `password1234`

2. **Lucas Dubois**
   - Email: `lucas.dubois@test.com`
   - Prénom: `Lucas`
   - Nom: `Dubois`
   - Level: CP
   - XP: 200
   - Password: `password1234`

3. **Léa Bernard**
   - Email: `lea.bernard@test.com`
   - Prénom: `Léa`
   - Nom: `Bernard`
   - Level: CP
   - XP: 100
   - Password: `password1234`

#### CE1 Level (9-11 years old)
4. **Noah Garcia**
   - Email: `noah.garcia@test.com`
   - Prénom: `Noah`
   - Nom: `Garcia`
   - Level: CE1
   - XP: 300
   - Password: `password1234`

5. **Alice Rodriguez**
   - Email: `alice.rodriguez@test.com`
   - Prénom: `Alice`
   - Nom: `Rodriguez`
   - Level: CE1
   - XP: 250
   - Password: `password1234`

---

## 🎮 Frontend Test Accounts (Quick Login)

These accounts appear in the LoginScreen component for quick testing:

1. **Alice Dupont** - CP (6-8 ans)
2. **Bob Martin** - CP (6-8 ans)
3. **Charlie Durand** - CP (6-8 ans)
4. **Lucas Martin** - CE1 (9-11 ans)
5. **Emma Dubois** - CE1 (9-11 ans)
6. **Noah Lefevre** - CE1 (9-11 ans)

⚠️ **Note**: These frontend accounts may not exist in the database. Use the database-seeded accounts above for actual login.

---

## 🔑 How to Login

### Method 1: Using Prénom and Nom
```
Prénom: Emma
Nom: Martin
Password: password1234
```

### Method 2: Using Email (if supported)
```
Email: emma.martin@test.com
Password: password1234
```

---

## 🚀 Setting Up Test Accounts

If test accounts don't exist in your database, run:

```bash
# Option 1: Using SQL script
cd backend
mysql -u root -p reved_kids < scripts/seed-test-students.sql

# Option 2: Using Node.js script
cd backend
node scripts/setup-auth-database.js

# Option 3: Using migration with sample data
cd backend
npm run migrate
```

## 🔧 Fixing Password Issues

If passwords don't work (they need to be 12+ characters), run:

```bash
cd backend
node scripts/fix-test-passwords.js
```

This will update all test accounts to use `password1234` (12 characters).

---

## 📝 Quick Reference

| Prénom | Nom | Level | Password |
|--------|-----|-------|----------|
| Emma | Martin | CP | password1234 |
| Lucas | Dubois | CP | password1234 |
| Léa | Bernard | CP | password1234 |
| Noah | Garcia | CE1 | password1234 |
| Alice | Rodriguez | CE1 | password1234 |

---

## ⚠️ Important Notes

1. **All test accounts use the same password**: `password1234` (12 characters - required minimum)
2. **Password validation requires minimum 12 characters** - `password123` (11 chars) will be rejected!
3. **Frontend quick-login accounts** (Alice Dupont, Bob Martin, etc.) may need to be created in the database first
4. **If login fails**, make sure:
   - Database is seeded with test accounts
   - Password is exactly `password1234` (12 characters)
   - Prénom and Nom match exactly (case-sensitive)
   - Run `node scripts/fix-test-passwords.js` to update passwords if needed

