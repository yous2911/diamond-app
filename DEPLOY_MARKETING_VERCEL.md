# 🚀 Déploiement du Marketing Website sur Vercel

## ✅ Préparation terminée

Le marketing-website est maintenant prêt pour le déploiement sur Vercel !

### Corrections appliquées :
- ✅ Script de build corrigé (suppression de `--turbopack` qui n'est pas supporté en production)
- ✅ Configuration Next.js convertie de `.ts` à `.js` (requis pour le build)
- ✅ Build testé avec succès
- ✅ MetadataBase ajouté pour éviter les avertissements

## 📋 Étapes de déploiement sur Vercel

### 1. Préparer le dépôt Git
Assurez-vous que tous les changements sont commités :
```bash
git add .
git commit -m "Fix build configuration for Vercel deployment"
git push
```

### 2. Se connecter à Vercel
1. Allez sur https://vercel.com
2. Connectez-vous avec votre compte GitHub
3. Cliquez sur **"Add New Project"**

### 3. Importer le projet
1. Sélectionnez votre repository : `yous2911/diamond-app` (ou votre repo)
2. **IMPORTANT** : Configurez le **Root Directory** à : `marketing-website`
3. Framework Preset : **Next.js** (détecté automatiquement)

### 4. Configuration du build
Vercel détectera automatiquement :
- **Build Command** : `npm run build` (ou `next build`)
- **Output Directory** : `.next` (automatique pour Next.js)
- **Install Command** : `npm install`

### 5. Variables d'environnement (optionnel)
Si vous avez besoin de variables d'environnement, ajoutez-les dans :
**Settings → Environment Variables**

Par exemple :
```
NEXT_PUBLIC_SITE_URL=https://votre-site.vercel.app
```

### 6. Déployer
1. Cliquez sur **"Deploy"**
2. Attendez 2-3 minutes pour le build
3. Votre site sera disponible à : `https://votre-projet.vercel.app`

## 🎯 Configuration recommandée

### Root Directory
Dans Vercel → Settings → General → Root Directory :
```
marketing-website
```

### Build & Development Settings
- Framework Preset: **Next.js**
- Build Command: `npm run build` (ou laissez vide, détecté automatiquement)
- Output Directory: `.next` (détecté automatiquement)
- Install Command: `npm install`

## ✅ Checklist de déploiement

- [ ] Code commité et poussé sur GitHub
- [ ] Projet créé sur Vercel
- [ ] Root Directory configuré à `marketing-website`
- [ ] Build réussi sans erreurs
- [ ] Site accessible sur l'URL Vercel
- [ ] Toutes les pages se chargent correctement

## 🔧 Dépannage

### Si le build échoue :
1. Vérifiez que le Root Directory est bien `marketing-website`
2. Vérifiez les logs de build dans Vercel
3. Testez le build localement : `cd marketing-website && npm run build`

### Si les pages ne se chargent pas :
1. Vérifiez que tous les assets sont bien dans le dossier `public/`
2. Vérifiez les erreurs dans la console du navigateur
3. Vérifiez les logs de déploiement dans Vercel

## 🎉 Après le déploiement

Votre marketing website sera accessible publiquement sur l'URL fournie par Vercel !

**Note** : N'oubliez pas de mettre à jour les URLs dans `layout.tsx` avec votre vraie URL Vercel après le déploiement.

