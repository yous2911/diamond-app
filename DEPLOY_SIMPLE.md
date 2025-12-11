# 🚀 Déploiement Simple - Vercel + Railway

## 📋 Checklist Rapide

### ✅ 1. Accès Local

**OUI, vous pouvez accéder à votre app localement !**

**Backend:**
```bash
cd backend
npm install
npm run dev
# → http://localhost:3003
```

**Frontend:**
```bash
cd frontend
npm install
npm start
# → http://localhost:3000
```

**Marketing Website:**
```bash
cd marketing-website
npm install
npm run dev
# → http://localhost:3001
```

---

## 🚂 RAILWAY (Backend)

### Étape 1: Créer Compte
1. Aller sur https://railway.app
2. Sign up avec GitHub
3. Cliquer "New Project"

### Étape 2: Ajouter MySQL
1. Dans votre projet Railway → **"+ New"**
2. **"Database"** → **"Add MySQL"**
3. Railway crée la DB automatiquement
4. **COPIER** les variables de connexion (vous en aurez besoin)

### Étape 3: Déployer Backend
1. **"+ New"** → **"GitHub Repo"**
2. Sélectionner: `yous2911/diamond-app`
3. **Root Directory:** `backend`
4. Cliquer **"Deploy"**

### Étape 4: Variables d'Environnement Railway

Dans Railway → Votre Service → **Variables**, ajouter:

```bash
# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database (Railway génère ces valeurs automatiquement)
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}

# Security (GÉNÉRER DES NOUVEAUX SECRETS!)
JWT_SECRET=<générer avec: openssl rand -hex 32>
JWT_REFRESH_SECRET=<générer avec: openssl rand -hex 32>
ENCRYPTION_KEY=<exactement 32 caractères>
COOKIE_SECRET=<générer avec: openssl rand -hex 32>

# CORS (mettre à jour après déploiement frontend)
CORS_ORIGIN=https://votre-frontend.vercel.app

# Redis (optionnel pour commencer)
REDIS_ENABLED=false

# GDPR
GDPR_ENABLED=true
```

### Étape 5: Générer Domain Railway
1. Railway → Settings → **Generate Domain**
2. Copier l'URL (ex: `https://diamond-app-production.up.railway.app`)
3. C'est votre **URL Backend API**

---

## ▲ VERCEL (Frontend)

### Étape 1: Créer Compte
1. Aller sur https://vercel.com
2. Sign up avec GitHub
3. Cliquer "Add New Project"

### Étape 2: Importer Repository
1. Sélectionner: `yous2911/diamond-app`
2. **Root Directory:** `frontend`
3. Framework: **Create React App** (auto-détecté)

### Étape 3: Build Settings
- **Build Command:** `npm run build`
- **Output Directory:** `build`
- **Install Command:** `npm install`

### Étape 4: Variables d'Environnement Vercel

Dans Vercel → Settings → **Environment Variables**:

```bash
REACT_APP_API_URL=https://votre-backend.railway.app/api
```

**⚠️ REMPLACER** `votre-backend.railway.app` par votre vraie URL Railway !

### Étape 5: Déployer
1. Cliquer **"Deploy"**
2. Attendre 2-3 minutes
3. Vercel donne l'URL: `https://diamond-app.vercel.app`

---

## 🔗 Connecter Frontend ↔ Backend

**Après les deux déploiements:**

1. **Mettre à jour Railway CORS:**
   - Railway → Variables
   - `CORS_ORIGIN` = votre URL Vercel
   - Le service redémarre automatiquement

2. **Mettre à jour Vercel API URL:**
   - Vercel → Settings → Environment Variables
   - `REACT_APP_API_URL` = votre URL Railway + `/api`
   - Redéployer le frontend

---

## ✅ Test Final

1. **Backend Health:** `https://votre-backend.railway.app/api/health`
2. **Frontend:** `https://votre-app.vercel.app`
3. **Tester Login:** Devrait fonctionner !

---

## 📝 Variables Locales (pour développement)

Créez `backend/env.backend`:

```bash
# Database Local
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=reved_kids

# Server
NODE_ENV=development
PORT=3003
HOST=0.0.0.0

# Security (générer des secrets pour dev)
JWT_SECRET=votre_secret_jwt_32_caracteres_minimum
JWT_REFRESH_SECRET=votre_refresh_secret_32_caracteres
ENCRYPTION_KEY=exactement32caracteresici
COOKIE_SECRET=votre_cookie_secret_32_caracteres

# CORS Local
CORS_ORIGIN=http://localhost:3000

# Redis (optionnel)
REDIS_ENABLED=false
```

Créez `frontend/.env`:

```bash
REACT_APP_API_URL=http://localhost:3003/api
```

---

## 🎯 URLs Finales

- **Frontend:** `https://votre-app.vercel.app`
- **Backend API:** `https://votre-backend.railway.app/api`
- **Marketing:** `https://marketing-reved.vercel.app` (déployer séparément)

---

## 🚨 Important

1. **Générer NOUVEAUX secrets pour production** (pas ceux de dev!)
2. **Database sera vide** - vous devrez créer des comptes ou seed
3. **CORS doit matcher** - frontend URL dans backend CORS_ORIGIN

---

**C'est tout ! Simple et direct.** 🚀




