# 💻 Setup Local - Accès à l'App

## ✅ OUI, vous pouvez accéder localement !

---

## 🚀 Démarrage Rapide

### Backend (Port 3003)
```bash
cd backend
npm install
npm run dev
```
→ **http://localhost:3003**

### Frontend (Port 3000)
```bash
cd frontend
npm install
npm start
```
→ **http://localhost:3000**

### Marketing Website (Port 3001)
```bash
cd marketing-website
npm install
npm run dev
```
→ **http://localhost:3001**

---

## 📝 Fichiers .env Requis

### 1. `backend/env.backend`

```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_mysql
DB_NAME=reved_kids

# Server
NODE_ENV=development
PORT=3003
HOST=0.0.0.0

# Security (générer avec: openssl rand -hex 32)
JWT_SECRET=votre_secret_jwt_au_moins_32_caracteres
JWT_REFRESH_SECRET=votre_refresh_secret_32_caracteres
ENCRYPTION_KEY=exactement32caracteresici
COOKIE_SECRET=votre_cookie_secret_32_caracteres

# CORS
CORS_ORIGIN=http://localhost:3000

# Redis (optionnel pour dev)
REDIS_ENABLED=false
```

### 2. `frontend/.env`

```bash
REACT_APP_API_URL=http://localhost:3003/api
```

### 3. `marketing-website/.env.local` (optionnel)

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

---

## ✅ Test Local

1. **Démarrer MySQL** (si pas déjà démarré)
2. **Démarrer Backend:** `cd backend && npm run dev`
3. **Démarrer Frontend:** `cd frontend && npm start`
4. **Ouvrir:** http://localhost:3000
5. **Tester Login:** Devrait fonctionner !

---

## 🔧 Si Problèmes

**Backend ne démarre pas:**
- Vérifier MySQL est démarré
- Vérifier `env.backend` existe
- Vérifier mot de passe MySQL correct

**Frontend ne se connecte pas:**
- Vérifier `REACT_APP_API_URL` dans `.env`
- Vérifier backend tourne sur port 3003
- Vérifier CORS dans backend permet `http://localhost:3000`

---

**C'est tout ! Simple.** ✅




