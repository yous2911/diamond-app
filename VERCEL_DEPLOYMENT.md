# ▲ Déploiement Vercel - Guide Rapide

## Étape 1: Créer le Projet

1. Aller sur https://vercel.com
2. "Add New" → "Project"
3. Importer depuis GitHub
4. Sélectionner le dossier `frontend` (pas la racine!)

## Étape 2: Configurer le Build

- **Framework Preset:** Create React App
- **Root Directory:** `frontend` (si repo à la racine)
- **Build Command:** `npm run build` (défaut)
- **Output Directory:** `build` (défaut)
- **Install Command:** `npm ci` (ou `npm install`)

## Étape 3: Configurer les Variables d'Environnement

Dans Settings → Environment Variables, ajouter:

```
REACT_APP_API_URL=https://votre-backend.railway.app/api
```

**⚠️ IMPORTANT:**
- Utiliser l'URL complète du backend Railway
- Ajouter `/api` à la fin
- Utiliser `https://` (pas `http://`)

## Étape 4: Déployer

1. Cliquer "Deploy"
2. Vercel va:
   - Installer les dépendances
   - Build le projet
   - Déployer sur CDN global
   - Générer SSL automatiquement

## Étape 5: Noter l'URL

Vercel génère une URL comme: `https://diamond-app.vercel.app`

**Copiez cette URL** - vous en aurez besoin pour mettre à jour CORS dans Railway.

## Étape 6: Mettre à Jour CORS dans Railway

1. Retourner sur Railway Dashboard
2. Variables → `CORS_ORIGIN`
3. Remplacer par: `https://diamond-app.vercel.app,https://www.diamond-app.vercel.app`
4. Railway redémarre automatiquement

---

## Commandes Utiles

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel --prod

# Voir les logs
vercel logs

# Voir les variables
vercel env ls
```

---

## ⚠️ PROBLÈMES COURANTS

### Build échoue avec "PORT is not defined"
**Solution:** Vérifier que `package.json` ne contient pas `set PORT=...` (commande Windows)

### Erreur CORS après déploiement
**Solution:** Vérifier que `CORS_ORIGIN` dans Railway contient l'URL Vercel exacte

### API calls échouent
**Solution:** Vérifier que `REACT_APP_API_URL` dans Vercel se termine par `/api`



