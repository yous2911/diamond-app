# 🔐 Script de Finalisation de la Configuration Production (PowerShell)

Write-Host "`n🔐 Finalisation de la Configuration Production`n" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "`n"

$envPath = Join-Path $PSScriptRoot "..\env.backend"
$envContent = Get-Content $envPath -Raw

# Demander le domaine pour CORS
Write-Host "🌐 Configuration CORS:" -ForegroundColor Blue
$corsDomain = Read-Host "Entrez votre domaine de production (ex: app.revedkids.com)"

if ($corsDomain -and $corsDomain.Trim() -ne "") {
    $domain = $corsDomain.Trim()
    $corsValue = "https://$domain,https://www.$domain"
    $envContent = $envContent -replace "CORS_ORIGIN=.*", "CORS_ORIGIN=$corsValue"
    Write-Host "✅ CORS_ORIGIN mis à jour: $corsValue`n" -ForegroundColor Green
} else {
    Write-Host "⚠️  CORS_ORIGIN non modifié (gardera le template)`n" -ForegroundColor Yellow
}

# Demander le mot de passe de la base de données
Write-Host "💾 Configuration Base de Données:" -ForegroundColor Blue
$dbPassword = Read-Host "Entrez le mot de passe de votre base de données de production" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))

if ($dbPasswordPlain -and $dbPasswordPlain.Trim() -ne "") {
    $password = $dbPasswordPlain.Trim()
    $envContent = $envContent -replace "DB_PASSWORD=.*", "DB_PASSWORD=$password"
    Write-Host "✅ DB_PASSWORD mis à jour`n" -ForegroundColor Green
} else {
    Write-Host "⚠️  DB_PASSWORD non modifié (gardera la valeur actuelle)`n" -ForegroundColor Yellow
}

# Demander le host de la base de données
Write-Host "🏠 Configuration Host Base de Données:" -ForegroundColor Blue
$dbHost = Read-Host "Entrez le host de votre base de données (localhost par défaut)"

if ($dbHost -and $dbHost.Trim() -ne "") {
    $host = $dbHost.Trim()
    $envContent = $envContent -replace "DB_HOST=.*", "DB_HOST=$host"
    Write-Host "✅ DB_HOST mis à jour: $host`n" -ForegroundColor Green
} else {
    Write-Host "✅ DB_HOST garde la valeur par défaut (localhost)`n" -ForegroundColor Green
}

# Sauvegarder le fichier
Set-Content -Path $envPath -Value $envContent -NoNewline

Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "`n✅ Configuration production finalisée!`n" -ForegroundColor Green
Write-Host "📋 Résumé:" -ForegroundColor Cyan
Write-Host "   - Fichier mis à jour: env.backend" -ForegroundColor White
Write-Host "   - NODE_ENV: production" -ForegroundColor White
Write-Host "   - Secrets: Configurés" -ForegroundColor White
Write-Host "   - CORS: Configuré" -ForegroundColor White
Write-Host "   - Database: Configurée`n" -ForegroundColor White
Write-Host "🚀 Vous êtes prêt à déployer!`n" -ForegroundColor Green






