# 🚀 QUICK START - Get Running TODAY

## ⏱️ Timeline: **30-60 minutes** (if you have MySQL ready)

---

## ✅ What You Need

1. **Node.js** >= 18.0.0 (check: `node --version`)
2. **MySQL** >= 8.0 (or use Docker)
3. **npm** >= 8.0.0 (comes with Node.js)

---

## 🎯 FASTEST PATH (Demo Mode - No Database)

### Option 1: Frontend Only Demo (5 minutes)
Perfect for showing UI/UX to investors!

```bash
cd frontend
npm install
npm start
```

**That's it!** Frontend runs on `http://localhost:3000`

⚠️ **Note**: Some features need backend, but UI/UX is fully visible!

---

## 🚀 FULL SETUP (30-60 minutes)

### Step 1: Backend Setup (15-20 min)

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Create .env file (copy this)
cat > .env << 'EOF'
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=reved_kids

# Security (generate with: openssl rand -hex 32)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
ENCRYPTION_KEY=your-encryption-key-32-characters-minimum-length-required
COOKIE_SECRET=your-cookie-secret-32-characters-minimum-length-required

# Server
PORT=5000
NODE_ENV=development

# Redis (optional - skip for now)
REDIS_ENABLED=false
EOF

# 3. Create MySQL database
mysql -u root -p -e "CREATE DATABASE reved_kids;"

# 4. Run migrations
npm run db:migrate

# 5. Seed sample data (if available)
npm run db:seed

# 6. Start backend
npm run dev
```

Backend runs on `http://localhost:5000`

---

### Step 2: Frontend Setup (10-15 min)

```bash
# In a new terminal
cd frontend
npm install
npm start
```

Frontend runs on `http://localhost:3000`

---

### Step 3: Test It! (5 min)

1. Open `http://localhost:3000`
2. Try logging in (or register)
3. Navigate through the app
4. Test an exercise

---

## 🐳 DOCKER QUICK START (If you have Docker)

```bash
# Start MySQL with Docker
docker run --name mysql-reved \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=reved_kids \
  -p 3306:3306 \
  -d mysql:8.0

# Wait 30 seconds for MySQL to start, then:
cd backend
npm install
# Create .env (use DB_PASSWORD=rootpassword)
npm run db:migrate
npm run dev
```

---

## ⚡ TROUBLESHOOTING

### "Cannot connect to database"
- Check MySQL is running: `mysql -u root -p`
- Verify `.env` has correct credentials
- Try: `mysql -u root -p -e "SHOW DATABASES;"`

### "Port already in use"
- Backend: Change `PORT=5000` to `PORT=5001` in `.env`
- Frontend: Change port in `package.json` scripts

### "Module not found"
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

---

## 🎯 MINIMUM VIABLE DEMO (10 minutes)

If you just need to show the UI:

```bash
cd frontend
npm install
npm start
```

Open `http://localhost:3000` - UI works, backend features will show errors but UI is polished!

---

## ✅ CHECKLIST

- [ ] Node.js installed (`node --version`)
- [ ] MySQL installed and running
- [ ] Backend `.env` file created
- [ ] Database created (`reved_kids`)
- [ ] Backend dependencies installed (`cd backend && npm install`)
- [ ] Frontend dependencies installed (`cd frontend && npm install`)
- [ ] Backend running (`npm run dev` in backend/)
- [ ] Frontend running (`npm start` in frontend/)
- [ ] Can access `http://localhost:3000`

---

## 🚨 NEED HELP?

If you get stuck:
1. Check error messages carefully
2. Verify MySQL is running
3. Check `.env` file has correct values
4. Make sure ports 3000 and 5000 are free

**You can have it running TODAY!** 🎉




