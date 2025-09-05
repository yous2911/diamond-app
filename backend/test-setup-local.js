#!/usr/bin/env node
/**
 * Local Testing Setup for Jules
 * This script sets up the application for testing without Docker
 * to avoid Docker Hub rate limiting issues
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Diamond App Local Testing Setup...');

// Check if we have the required dependencies
function checkRequirements() {
  const requirements = [
    { command: 'node', flag: '--version', name: 'Node.js' },
    { command: 'npm', flag: '--version', name: 'NPM' }
  ];

  console.log('📋 Checking requirements...');
  
  requirements.forEach(req => {
    try {
      const result = spawn.sync(req.command, [req.flag], { encoding: 'utf8' });
      if (result.status === 0) {
        console.log(`✅ ${req.name}: ${result.stdout.trim()}`);
      } else {
        console.log(`❌ ${req.name}: Not found`);
        process.exit(1);
      }
    } catch (error) {
      console.log(`❌ ${req.name}: Not found - ${error.message}`);
      process.exit(1);
    }
  });
}

// Setup environment for local testing
function setupEnvironment() {
  console.log('🔧 Setting up environment...');
  
  // Create a test environment file
  const testEnv = `# Local Testing Environment
NODE_ENV=test
PORT=3003
HOST=localhost

# Database - Using SQLite for local testing
DB_TYPE=sqlite
DB_PATH=./test.db

# Redis - Disabled for local testing
REDIS_ENABLED=false

# JWT Secrets - Test values
JWT_SECRET=test_jwt_secret_32_characters_long
JWT_REFRESH_SECRET=test_refresh_secret_32_characters_long

# Other test settings
LOG_LEVEL=info
`;

  fs.writeFileSync('.env.test', testEnv);
  console.log('✅ Test environment file created');
}

// Install dependencies
function installDependencies() {
  console.log('📦 Installing dependencies...');
  
  try {
    const result = spawn.sync('npm', ['install'], { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    if (result.status === 0) {
      console.log('✅ Dependencies installed successfully');
    } else {
      console.log('❌ Failed to install dependencies');
      process.exit(1);
    }
  } catch (error) {
    console.log(`❌ Failed to install dependencies: ${error.message}`);
    process.exit(1);
  }
}

// Build the application
function buildApplication() {
  console.log('🔨 Building application...');
  
  try {
    const result = spawn.sync('npm', ['run', 'build'], { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    if (result.status === 0) {
      console.log('✅ Application built successfully');
    } else {
      console.log('❌ Failed to build application');
      process.exit(1);
    }
  } catch (error) {
    console.log(`❌ Failed to build application: ${error.message}`);
    process.exit(1);
  }
}

// Run basic health checks
function runHealthChecks() {
  console.log('🏥 Running basic health checks...');
  
  // Check if built files exist
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    console.log('✅ Build artifacts found');
  } else {
    console.log('❌ Build artifacts not found');
    return false;
  }
  
  // Check if package.json exists and has required scripts
  const packagePath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const requiredScripts = ['start', 'build', 'test'];
    
    const missingScripts = requiredScripts.filter(script => !pkg.scripts[script]);
    if (missingScripts.length === 0) {
      console.log('✅ Required scripts found in package.json');
    } else {
      console.log(`❌ Missing scripts: ${missingScripts.join(', ')}`);
      return false;
    }
  } else {
    console.log('❌ package.json not found');
    return false;
  }
  
  return true;
}

// Main execution
async function main() {
  try {
    checkRequirements();
    setupEnvironment();
    installDependencies();
    buildApplication();
    
    if (runHealthChecks()) {
      console.log('\n🎉 Local testing setup completed successfully!');
      console.log('\n📋 Next steps for Jules:');
      console.log('1. Run: npm start (to start the server)');
      console.log('2. Run: npm test (to run the test suite)');
      console.log('3. Test endpoints at: http://localhost:3003');
      console.log('4. Check health at: http://localhost:3003/api/health');
      console.log('\n💡 This setup avoids Docker Hub rate limiting issues');
    } else {
      console.log('\n❌ Setup completed with issues. Check the logs above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
main();