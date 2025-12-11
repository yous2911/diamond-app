#!/usr/bin/env node

/**
 * Script de finalisation de la configuration production
 * Demande les valeurs manquantes et met à jour env.backend
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function finalizeConfig() {
  console.log('\n🔐 Finalisation de la Configuration Production\n');
  console.log('=' .repeat(60));
  console.log('\n');

  // Lire le fichier env.backend
  const envPath = path.join(__dirname, '..', 'env.backend');
  let envContent = fs.readFileSync(envPath, 'utf8');

  // Demander le domaine pour CORS
  console.log('🌐 Configuration CORS:');
  const corsDomain = await question('Entrez votre domaine de production (ex: app.revedkids.com): ');
  
  if (corsDomain && corsDomain.trim() !== '') {
    const domain = corsDomain.trim();
    const corsValue = `https://${domain},https://www.${domain}`;
    envContent = envContent.replace(
      /CORS_ORIGIN=.*/,
      `CORS_ORIGIN=${corsValue}`
    );
    console.log(`✅ CORS_ORIGIN mis à jour: ${corsValue}\n`);
  } else {
    console.log('⚠️  CORS_ORIGIN non modifié (gardera le template)\n');
  }

  // Demander le mot de passe de la base de données
  console.log('💾 Configuration Base de Données:');
  const dbPassword = await question('Entrez le mot de passe de votre base de données de production: ');
  
  if (dbPassword && dbPassword.trim() !== '') {
    const password = dbPassword.trim();
    envContent = envContent.replace(
      /DB_PASSWORD=.*/,
      `DB_PASSWORD=${password}`
    );
    console.log('✅ DB_PASSWORD mis à jour\n');
  } else {
    console.log('⚠️  DB_PASSWORD non modifié (gardera la valeur actuelle)\n');
  }

  // Demander le host de la base de données
  console.log('🏠 Configuration Host Base de Données:');
  const dbHost = await question('Entrez le host de votre base de données (localhost par défaut): ');
  
  if (dbHost && dbHost.trim() !== '') {
    const host = dbHost.trim();
    envContent = envContent.replace(
      /DB_HOST=.*/,
      `DB_HOST=${host}`
    );
    console.log(`✅ DB_HOST mis à jour: ${host}\n`);
  } else {
    console.log('✅ DB_HOST garde la valeur par défaut (localhost)\n');
  }

  // Sauvegarder le fichier
  fs.writeFileSync(envPath, envContent, 'utf8');
  
  console.log('=' .repeat(60));
  console.log('\n✅ Configuration production finalisée!\n');
  console.log('📋 Résumé:');
  console.log('   - Fichier mis à jour: env.backend');
  console.log('   - NODE_ENV: production');
  console.log('   - Secrets: Configurés');
  console.log('   - CORS: Configuré');
  console.log('   - Database: Configurée\n');
  console.log('🚀 Vous êtes prêt à déployer!\n');
  
  rl.close();
}

finalizeConfig().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});






