# Script PowerShell pour remplacer console.log par logger structuré
# À exécuter depuis le répertoire /backend

Write-Host "🔧 Remplacement des console.log par logger structuré..." -ForegroundColor Green

# Rechercher tous les fichiers TypeScript source (excluant tests et examples)
$sourceFiles = Get-ChildItem -Path "src" -Recurse -Filter "*.ts" | 
    Where-Object { $_.FullName -notmatch "test|spec|example|mock" }

Write-Host "📁 Fichiers trouvés : $($sourceFiles.Count)" -ForegroundColor Blue

foreach ($file in $sourceFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Vérifier si le fichier contient déjà l'import logger
    $hasLoggerImport = $content -match "import.*logger.*from.*utils/logger"
    
    # Effectuer les remplacements
    $content = $content -replace 'console\.log\(', 'logger.info('
    $content = $content -replace 'console\.error\(', 'logger.error('
    $content = $content -replace 'console\.warn\(', 'logger.warn('
    $content = $content -replace 'console\.info\(', 'logger.info('
    $content = $content -replace 'console\.debug\(', 'logger.debug('
    
    # Si des remplacements ont été effectués et qu'il n'y a pas d'import logger
    if ($content -ne $originalContent -and !$hasLoggerImport) {
        # Ajouter l'import logger après les autres imports
        $importPattern = "(import.*from.*['\`"];?\s*\n)"
        if ($content -match $importPattern) {
            $content = $content -replace $importPattern, '$1import { logger } from ''../utils/logger'';`n'
        } else {
            # Si aucun import trouvé, ajouter au début du fichier
            $content = "import { logger } from '../utils/logger';`n" + $content
        }
        
        Write-Host "✅ Modifié : $($file.Name)" -ForegroundColor Green
    }
    
    # Sauvegarder seulement si des changements ont été apportés
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
    }
}

Write-Host "🎉 Remplacement terminé!" -ForegroundColor Green
Write-Host "📋 Résumé: Logger structuré appliqué aux fichiers source principaux" -ForegroundColor Yellow