# ✅ CHECKLIST RAPIDE DE DÉPLOIEMENT

## 🚀 BACKEND (Railway) - 15 minutes

- [ ] Compte Railway créé
- [ ] Projet créé depuis GitHub
- [ ] Variables d'environnement copiées depuis `env.backend`
- [ ] MySQL ajouté (si nécessaire)
- [ ] Déploiement réussi
- [ ] URL backend notée: `https://________________.railway.app`
- [ ] Health check OK: `curl https://____.railway.app/api/health`
- [ ] Base de données migrée: `railway run npm run db:migrate`
- [ ] Base de données seedée: `railway run npm run seed`

## 🎨 FRONTEND (Vercel) - 10 minutes

- [ ] Compte Vercel créé
- [ ] Projet créé depuis GitHub (dossier `frontend`)
- [ ] Variable `REACT_APP_API_URL` configurée avec URL Railway + `/api`
- [ ] Déploiement réussi
- [ ] URL frontend notée: `https://________________.vercel.app`

## 🔗 CONNEXION - 5 minutes

- [ ] CORS mis à jour dans Railway avec URL Vercel
- [ ] Railway redémarré
- [ ] Frontend testé (pas d'erreurs CORS)
- [ ] Login fonctionne
- [ ] Exercices s'affichent

## ✅ TOTAL: ~30 minutes

**Vous êtes prêt ! 🎉**



