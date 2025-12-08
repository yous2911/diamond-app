# 🚂 Déploiement Railway - Guide Rapide

## Étape 1: Créer le Projet

1. Aller sur https://railway.app
2. "New Project" → "Deploy from GitHub repo"
3. Sélectionner votre repo
4. Railway détecte automatiquement le backend

## Étape 2: Configurer les Variables

Dans Railway Dashboard → Variables, copier TOUTES les variables depuis `backend/env.backend`:

**Variables Critiques:**
- `NODE_ENV=production`
- `PORT=3003` (ou laisser Railway choisir)
- Tous les secrets (JWT_SECRET, ENCRYPTION_KEY, etc.)
- `CORS_ORIGIN=*` (temporaire, sera mis à jour après déploiement frontend)
- Configuration DB (DB_HOST, DB_USER, DB_PASSWORD, etc.)

## Étape 3: Ajouter MySQL (Optionnel)

1. Railway Dashboard → "New" → "Database" → "MySQL"
2. Railway génère automatiquement les variables:
   - `MYSQL_HOST`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`
3. Mapper ces variables vers vos variables:
   - `DB_HOST=${{MYSQL.HOST}}`
   - `DB_USER=${{MYSQL.USER}}`
   - `DB_PASSWORD=${{MYSQL.PASSWORD}}`
   - `DB_NAME=${{MYSQL.DATABASE}}`

## Étape 4: Déployer

Railway déploie automatiquement. Attendre que le statut soit "Active".

## Étape 5: Initialiser la Base de Données

Via Railway CLI:
```bash
railway login
railway link
railway run npm run db:migrate
railway run npm run seed
```

Ou via Railway Dashboard → "Deployments" → "View Logs" → Terminal

## Étape 6: Noter l'URL

Railway génère une URL comme: `https://diamond-backend.up.railway.app`

**Copiez cette URL** - vous en aurez besoin pour Vercel.

## Étape 7: Mettre à Jour CORS

Après avoir déployé le frontend sur Vercel:
1. Retourner sur Railway → Variables
2. Mettre à jour `CORS_ORIGIN` avec l'URL Vercel
3. Railway redémarre automatiquement

---

## Commandes Utiles

```bash
# Voir les logs
railway logs

# Redémarrer
railway restart

# Exécuter une commande
railway run npm run seed

# Ouvrir un shell
railway shell
```



