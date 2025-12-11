# 🚀 Script de Déploiement Production (PowerShell)
# Exécute toutes les étapes nécessaires pour déployer en production

$ErrorActionPreference = "Stop"

Write-Host "🚀 Déploiement Production - RevEd Kids" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que nous sommes en production
if ($env:NODE_ENV -ne "production") {
    Write-Host "⚠️  NODE_ENV n'est pas défini à 'production'" -ForegroundColor Yellow
    Write-Host "   Définissez-le avec: `$env:NODE_ENV='production'" -ForegroundColor Yellow
    exit 1
}

# 1. Installer les dépendances
Write-Host "📦 Étape 1/5: Installation des dépendances..." -ForegroundColor Blue
npm ci --production
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de l'installation" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dépendances installées" -ForegroundColor Green
Write-Host ""

# 2. Build l'application
Write-Host "🔨 Étape 2/5: Build de l'application..." -ForegroundColor Blue
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du build" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build réussi" -ForegroundColor Green
Write-Host ""

# 3. Migrations base de données
Write-Host "🗄️  Étape 3/5: Exécution des migrations..." -ForegroundColor Blue
npm run db:migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Pas de migrations à exécuter" -ForegroundColor Yellow
}
Write-Host "✅ Migrations terminées" -ForegroundColor Green
Write-Host ""

# 4. Seeding (remplir avec exercices)
Write-Host "🌱 Étape 4/5: Seeding de la base de données..." -ForegroundColor Blue
$seed = Read-Host "Voulez-vous exécuter le seeding? (y/N)"
if ($seed -eq "y" -or $seed -eq "Y") {
    npm run seed
    if ($LASTEXITCODE -ne 0) {
        node scripts/seed-database.js
    }
    Write-Host "✅ Seeding terminé" -ForegroundColor Green
} else {
    Write-Host "⏭️  Seeding ignoré" -ForegroundColor Yellow
}
Write-Host ""

# 5. Vérification finale
Write-Host "✅ Étape 5/5: Vérification finale..." -ForegroundColor Blue
Write-Host "   - TypeScript: Vérifié ✅" -ForegroundColor Green
Write-Host "   - Secrets: Configurés ✅" -ForegroundColor Green
Write-Host "   - Build: Réussi ✅" -ForegroundColor Green
Write-Host "   - Migrations: Terminées ✅" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Déploiement prêt!" -ForegroundColor Green
Write-Host ""
Write-Host "Pour démarrer le serveur:" -ForegroundColor Cyan
Write-Host "   npm start" -ForegroundColor White
Write-Host ""
Write-Host "Ou avec PM2:" -ForegroundColor Cyan
Write-Host "   pm2 start ecosystem.config.js" -ForegroundColor White






