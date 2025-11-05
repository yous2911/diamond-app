#!/usr/bin/env node

/**
 * Staging Environment Setup Script
 * RevEd Kids Backend - Staging Database Setup
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up RevEd Kids Staging Environment...\n');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.bold}Step ${step}:${colors.reset} ${message}`, 'blue');
}

// Check if MySQL is available
function checkMySQL() {
  logStep(1, 'Checking MySQL connection...');
  try {
    execSync('mysql --version', { stdio: 'pipe' });
    log('✅ MySQL is available', 'green');
    return true;
  } catch (error) {
    log('❌ MySQL is not available. Please install MySQL first.', 'red');
    return false;
  }
}

// Create staging database
function createStagingDatabase() {
  logStep(2, 'Creating staging database...');
  
  const sqlFile = path.join(__dirname, 'setup-staging-database.sql');
  
  if (!fs.existsSync(sqlFile)) {
    log('❌ SQL setup file not found', 'red');
    return false;
  }
  
  try {
    // Read the SQL file and execute it
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute MySQL commands
    execSync(`mysql -u root -p"thisisREALLYIT29!" < "${sqlFile}"`, { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    
    log('✅ Staging database created successfully', 'green');
    return true;
  } catch (error) {
    log('❌ Failed to create staging database', 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
}

// Create staging environment file
function createStagingEnv() {
  logStep(3, 'Setting up staging environment configuration...');
  
  const stagingEnvPath = path.join(__dirname, 'env.staging');
  
  if (!fs.existsSync(stagingEnvPath)) {
    log('❌ Staging environment file not found', 'red');
    return false;
  }
  
  log('✅ Staging environment file ready', 'green');
  log(`   Location: ${stagingEnvPath}`, 'yellow');
  return true;
}

// Create staging directories
function createStagingDirectories() {
  logStep(4, 'Creating staging directories...');
  
  const directories = [
    './uploads/staging',
    './logs',
    './logs/staging'
  ];
  
  directories.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      log(`✅ Created directory: ${dir}`, 'green');
    } else {
      log(`📁 Directory already exists: ${dir}`, 'yellow');
    }
  });
  
  return true;
}

// Test staging database connection
function testStagingConnection() {
  logStep(5, 'Testing staging database connection...');
  
  try {
    const testQuery = `
      USE reved_kids_staging;
      SELECT COUNT(*) as student_count FROM students;
      SELECT COUNT(*) as competency_count FROM competencies;
      SELECT COUNT(*) as exercise_count FROM exercises;
    `;
    
    const result = execSync(`mysql -u root -p"thisisREALLYIT29!" -e "${testQuery}"`, { 
      encoding: 'utf8',
      cwd: __dirname 
    });
    
    log('✅ Staging database connection successful', 'green');
    log('📊 Database contains test data:', 'yellow');
    console.log(result);
    return true;
  } catch (error) {
    log('❌ Failed to connect to staging database', 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
}

// Create staging startup script
function createStagingScripts() {
  logStep(6, 'Creating staging startup scripts...');
  
  // Create staging start script
  const startScript = `#!/bin/bash
# Staging Environment Startup Script

echo "🚀 Starting RevEd Kids Backend in STAGING mode..."

# Set environment to staging
export NODE_ENV=staging

# Copy staging environment file
cp env.staging .env

# Start the application
npm run start:staging
`;

  const startScriptPath = path.join(__dirname, 'start-staging.sh');
  fs.writeFileSync(startScriptPath, startScript);
  
  // Make it executable on Unix systems
  try {
    execSync(`chmod +x "${startScriptPath}"`, { stdio: 'pipe' });
  } catch (error) {
    // Ignore chmod errors on Windows
  }
  
  // Create Windows batch file
  const startBatch = `@echo off
echo 🚀 Starting RevEd Kids Backend in STAGING mode...

REM Set environment to staging
set NODE_ENV=staging

REM Copy staging environment file
copy env.staging .env

REM Start the application
npm run start:staging
`;

  const startBatchPath = path.join(__dirname, 'start-staging.bat');
  fs.writeFileSync(startBatchPath, startBatch);
  
  log('✅ Staging startup scripts created', 'green');
  log(`   Unix: ${startScriptPath}`, 'yellow');
  log(`   Windows: ${startBatchPath}`, 'yellow');
  
  return true;
}

// Update package.json with staging scripts
function updatePackageJson() {
  logStep(7, 'Updating package.json with staging scripts...');
  
  const packageJsonPath = path.join(__dirname, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    log('❌ package.json not found', 'red');
    return false;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Add staging scripts
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts['start:staging'] = 'cross-env NODE_ENV=staging node dist/server.js';
    packageJson.scripts['dev:staging'] = 'cross-env NODE_ENV=staging nodemon src/server.ts';
    packageJson.scripts['test:staging'] = 'cross-env NODE_ENV=staging vitest run';
    packageJson.scripts['build:staging'] = 'cross-env NODE_ENV=staging npm run build';
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    
    log('✅ Package.json updated with staging scripts', 'green');
    return true;
  } catch (error) {
    log('❌ Failed to update package.json', 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
}

// Main setup function
async function setupStaging() {
  log('🎯 RevEd Kids Staging Environment Setup', 'bold');
  log('=====================================\n', 'bold');
  
  const steps = [
    { name: 'MySQL Check', fn: checkMySQL },
    { name: 'Database Creation', fn: createStagingDatabase },
    { name: 'Environment Setup', fn: createStagingEnv },
    { name: 'Directory Creation', fn: createStagingDirectories },
    { name: 'Connection Test', fn: testStagingConnection },
    { name: 'Script Creation', fn: createStagingScripts },
    { name: 'Package Update', fn: updatePackageJson }
  ];
  
  let successCount = 0;
  
  for (const step of steps) {
    try {
      const success = step.fn();
      if (success) {
        successCount++;
      }
    } catch (error) {
      log(`❌ Error in ${step.name}: ${error.message}`, 'red');
    }
  }
  
  // Final summary
  log('\n🎉 Staging Setup Complete!', 'bold');
  log('========================\n', 'bold');
  
  if (successCount === steps.length) {
    log('✅ All steps completed successfully!', 'green');
    log('\n📋 Next Steps:', 'blue');
    log('1. Start staging server: npm run start:staging', 'yellow');
    log('2. Or use: ./start-staging.sh (Unix) or start-staging.bat (Windows)', 'yellow');
    log('3. Access staging at: http://localhost:3004', 'yellow');
    log('4. Test with staging users:', 'yellow');
    log('   - test.student@staging.com', 'yellow');
    log('   - staging.user@staging.com', 'yellow');
    log('   - admin@staging.com', 'yellow');
  } else {
    log(`⚠️  ${successCount}/${steps.length} steps completed`, 'yellow');
    log('Please review the errors above and retry.', 'red');
  }
  
  log('\n🔧 Staging Database Commands:', 'blue');
  log('Reset data: CALL ResetStagingData();', 'yellow');
  log('Generate test progress: CALL GenerateTestProgress();', 'yellow');
  log('View dashboard: SELECT * FROM staging_dashboard;', 'yellow');
}

// Run setup
if (require.main === module) {
  setupStaging().catch(error => {
    log(`❌ Setup failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { setupStaging };












