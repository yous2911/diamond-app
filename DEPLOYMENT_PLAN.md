# 🚀 PLAN DE DÉPLOIEMENT COMPLET - DIAMOND APP

## 📋 RÉSUMÉ EXÉCUTIF

**Architecture de Déploiement:**
- **Backend (API):** Railway.app (Node.js/Fastify)
- **Frontend (React):** Vercel (CDN global, SSL automatique)
- **Base de Données:** MySQL (Railway ou service externe)

**Temps estimé:** 30-45 minutes

---

## ✅ PROBLÈMES CORRIGÉS

### 1. ✅ Ports Unifiés
- Backend: **PORT=3003** (cohérent partout)
- Frontend: Utilise `REACT_APP_API_URL` (pas de port fixe)
- CORS: Configuré pour accepter le domaine Vercel

### 2. ✅ Scripts Windows Corrigés
- Frontend `package.json` nettoyé (pas de `set PORT=`)
- Compatible Linux/Cloud

### 3. ✅ Configuration API Unifiée
- Tous les services frontend utilisent `REACT_APP_API_URL`
- Fallback vers `http://localhost:3003/api` en développement

---

## 🎯 ÉTAPE 1: DÉPLOYER LE BACKEND SUR RAILWAY

### Prérequis
1. Compte Railway (gratuit): https://railway.app
2. GitHub repo connecté

### Actions

#### 1.1 Préparer le Backend
```bash
cd backend
# Vérifier que env.backend existe et contient les secrets
```

#### 1.2 Créer le Projet Railway
1. Aller sur https://railway.app
2. Cliquer "New Project" → "Deploy from GitHub repo"
3. Sélectionner votre repo
4. Railway détecte automatiquement Node.js

#### 1.3 Configurer les Variables d'Environnement

Dans Railway Dashboard → Variables, ajouter:

```env
# Server
NODE_ENV=production
PORT=3003
HOST=0.0.0.0

# Database (Railway MySQL ou externe)
DB_HOST=votre-host-mysql
DB_PORT=3306
DB_USER=votre-user
DB_PASSWORD=votre-password-production
DB_NAME=reved_kids

# Redis (optionnel - laisser false pour MVP)
REDIS_ENABLED=false

# Secrets (COPIER depuis env.backend)
JWT_SECRET=e6ad1fba2434a5b35f076fca6c0fa1ca7b142f98fba64aedb0a99899da2e085d3caeb79c515a4a4cf8e8cd9e02361dd0e3c7307f97d88f0c1efb9a6c205e2d69
JWT_REFRESH_SECRET=fa755f7c6fb66cc6f61a02d5268874a8361118f044ab21afb5a09d2960a78d22f916e9212f2963aaf3ae411e85bd644fcd2a835afed7c71ef9d25157b4465412
ENCRYPTION_KEY=e800199550b63cf38f0bfaa74fc04989
COOKIE_SECRET=a17105ea3945b8ae09b07411851235a43189c6f9e6589a6d7d53af53f77236efa5a05c78acd8c7749de46533e226e31b83bf41105ae39bb6047808b54cc27138

# CORS (TEMPORAIRE - sera mis à jour après déploiement frontend)
CORS_ORIGIN=*

# Security
HTTPS_ONLY=true
SECURE_COOKIES=true
SAME_SITE=strict
TRUST_PROXY=true

# Email (si configuré)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=fastrevedkids@gmail.com
SMTP_PASS=votre-app-password
SMTP_FROM=fastrevedkids@gmail.com
```

#### 1.4 Déployer
1. Railway va automatiquement:
   - Détecter `package.json`
   - Installer les dépendances (`npm ci --production`)
   - Build (`npm run build`)
   - Démarrer (`npm start`)

2. **Notez l'URL générée** (ex: `https://diamond-backend.up.railway.app`)

#### 1.5 Vérifier le Déploiement
```bash
# Tester l'endpoint health
curl https://votre-backend.railway.app/api/health

# Devrait retourner: {"status":"ok",...}
```

#### 1.6 Initialiser la Base de Données
```bash
# Via Railway CLI ou SSH
railway run npm run db:migrate
railway run npm run seed
```

---

## 🎯 ÉTAPE 2: CORRIGER LE FRONTEND

### 2.1 Vérifier package.json

Le fichier `frontend/package.json` ne doit **PAS** contenir:
```json
"start": "set PORT=3004 && react-scripts start"  // ❌ Windows seulement
```

Mais plutôt:
```json
"start": "react-scripts start",  // ✅ Universel
"build": "react-scripts build"
```

### 2.2 Créer .env.production

Créer `frontend/.env.production`:
```env
REACT_APP_API_URL=https://votre-backend.railway.app/api
```

**⚠️ IMPORTANT:** Remplacez `votre-backend.railway.app` par l'URL réelle de Railway.

---

## 🎯 ÉTAPE 3: DÉPLOYER LE FRONTEND SUR VERCEL

### Prérequis
1. Compte Vercel (gratuit): https://vercel.com
2. GitHub repo connecté

### Actions

#### 3.1 Créer le Projet Vercel
1. Aller sur https://vercel.com
2. Cliquer "Add New" → "Project"
3. Importer depuis GitHub
4. Sélectionner le dossier `frontend`

#### 3.2 Configurer les Variables d'Environnement

Dans Vercel Dashboard → Settings → Environment Variables:

```env
REACT_APP_API_URL=https://votre-backend.railway.app/api
```

**⚠️ IMPORTANT:** Utilisez l'URL complète avec `/api` à la fin.

#### 3.3 Configurer le Build
- **Framework Preset:** Create React App
- **Build Command:** `npm run build`
- **Output Directory:** `build`
- **Install Command:** `npm ci` (ou `npm install`)

#### 3.4 Déployer
1. Cliquer "Deploy"
2. Vercel va:
   - Installer les dépendances
   - Build le projet
   - Déployer sur CDN global
   - Générer SSL automatiquement

3. **Notez l'URL générée** (ex: `https://diamond-app.vercel.app`)

---

## 🎯 ÉTAPE 4: CONNECTER BACKEND ET FRONTEND (CORS)

### 4.1 Mettre à Jour CORS dans Railway

Retourner sur Railway Dashboard → Variables:

1. Trouver `CORS_ORIGIN`
2. Remplacer `*` par l'URL Vercel:
   ```
   CORS_ORIGIN=https://diamond-app.vercel.app,https://www.diamond-app.vercel.app
   ```
3. Railway redémarre automatiquement

### 4.2 Vérifier la Connexion

1. Ouvrir le frontend Vercel dans le navigateur
2. Ouvrir la Console (F12)
3. Tester une action (login, etc.)
4. Vérifier qu'il n'y a **PAS** d'erreur CORS

---

## 🎯 ÉTAPE 5: FINALISATION

### 5.1 Vérifications Finales

- [ ] Backend répond sur `/api/health`
- [ ] Frontend se charge sans erreurs
- [ ] Pas d'erreurs CORS dans la console
- [ ] Login fonctionne
- [ ] Les exercices s'affichent
- [ ] Base de données peuplée (exercices présents)

### 5.2 Scripts Utiles

```bash
# Backend - Vérifier les logs
railway logs

# Frontend - Vérifier les logs
vercel logs

# Backend - Redémarrer
railway restart

# Frontend - Redéployer
vercel --prod
```

---

## 🚨 PROBLÈMES COURANTS ET SOLUTIONS

### Problème: "CORS error" dans le navigateur
**Solution:** Vérifier que `CORS_ORIGIN` dans Railway contient exactement l'URL Vercel (avec `https://`)

### Problème: "Cannot connect to API"
**Solution:** 
1. Vérifier `REACT_APP_API_URL` dans Vercel
2. Vérifier que l'URL se termine par `/api`
3. Tester l'URL directement: `curl https://backend.railway.app/api/health`

### Problème: "Database connection failed"
**Solution:**
1. Vérifier les credentials DB dans Railway
2. Vérifier que la DB est accessible depuis Railway (pas de firewall local)

### Problème: "No exercises found"
**Solution:** Exécuter `railway run npm run seed` pour peupler la base

---

## 📊 CHECKLIST FINALE

### Backend (Railway)
- [ ] Projet créé sur Railway
- [ ] Variables d'environnement configurées
- [ ] Déploiement réussi
- [ ] Health check OK (`/api/health`)
- [ ] Base de données migrée
- [ ] Base de données seedée (exercices présents)
- [ ] CORS configuré avec URL Vercel

### Frontend (Vercel)
- [ ] Projet créé sur Vercel
- [ ] `REACT_APP_API_URL` configuré
- [ ] Build réussi
- [ ] Déploiement réussi
- [ ] Site accessible (pas d'erreurs 404)
- [ ] Pas d'erreurs CORS dans la console

### Tests Finaux
- [ ] Login fonctionne
- [ ] Dashboard s'affiche
- [ ] Exercices s'affichent
- [ ] Progression sauvegardée
- [ ] Pas d'erreurs dans la console

---

## 🎉 RÉSULTAT FINAL

Une fois tout configuré:
- **Backend:** `https://votre-backend.railway.app`
- **Frontend:** `https://votre-app.vercel.app`
- **SSL:** Automatique (cadenas vert)
- **CDN:** Global (Vercel)
- **Scalabilité:** Automatique

**Vous êtes prêt pour votre démo devant le jury ! 🚀**






