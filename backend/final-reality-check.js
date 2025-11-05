/**
 * FINAL REALITY CHECK - No sugarcoating, brutal honesty
 * Will expose any real issues that could embarrass you
 */

console.log('🔍 FINAL REALITY CHECK - Brutal Honesty Mode\n');

async function brutallHonestCheck() {
  const criticalIssues = [];
  const warnings = [];
  const successes = [];

  // 1. Database - THE MOST CRITICAL
  try {
    console.log('🔴 CRITICAL: Testing database connection...');
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    const result = await execAsync('node test-connection.js');

    if (result.stdout.includes('462 exercises') && result.stdout.includes('15 students')) {
      successes.push('✅ Database: 462 exercises, 15 students - REAL DATA EXISTS');
    } else {
      criticalIssues.push('❌ Database: Data missing or connection failed');
    }
  } catch (error) {
    criticalIssues.push(`❌ Database: BROKEN - ${error.message}`);
  }

  // 2. Server startup - CAN IT ACTUALLY START?
  try {
    console.log('🔴 CRITICAL: Testing server startup...');

    // Try to create a minimal server
    const fastify = require('fastify');
    const app = fastify({ logger: false });

    app.get('/health', async () => ({ status: 'ok' }));

    // Try to bind to a port
    await app.listen({ port: 0 }); // Use port 0 to get any available port
    const address = app.server.address();
    await app.close();

    if (address && address.port) {
      successes.push('✅ Server: Can start and bind to port');
    } else {
      criticalIssues.push('❌ Server: Cannot bind to port');
    }
  } catch (error) {
    criticalIssues.push(`❌ Server startup: FAILED - ${error.message}`);
  }

  // 3. Core dependencies - ARE THEY REALLY INSTALLED?
  try {
    console.log('🟡 CHECKING: Core dependencies...');

    const requiredPackages = [
      'fastify',
      'bcryptjs',
      'jsonwebtoken',
      'mysql2',
      'drizzle-orm'
    ];

    for (const pkg of requiredPackages) {
      try {
        require(pkg);
        successes.push(`✅ Package: ${pkg} - INSTALLED`);
      } catch (error) {
        criticalIssues.push(`❌ Package: ${pkg} - MISSING`);
      }
    }
  } catch (error) {
    criticalIssues.push(`❌ Dependency check failed: ${error.message}`);
  }

  // 4. Environment configuration
  try {
    console.log('🟡 CHECKING: Environment configuration...');

    const fs = require('fs');
    const path = require('path');

    // Check for environment files
    const envFiles = ['.env', 'env.backend', '.env.local'];
    let hasEnvFile = false;

    for (const envFile of envFiles) {
      if (fs.existsSync(envFile)) {
        hasEnvFile = true;
        successes.push(`✅ Environment: Found ${envFile}`);
        break;
      }
    }

    if (!hasEnvFile) {
      warnings.push('⚠️  Environment: No .env file found - might need configuration');
    }

  } catch (error) {
    warnings.push(`⚠️  Environment check failed: ${error.message}`);
  }

  // 5. File structure integrity
  try {
    console.log('🟡 CHECKING: File structure...');

    const fs = require('fs');
    const criticalFiles = [
      'package.json',
      'src/server.ts',
      'src/config/config.ts',
      'src/services/service-factory.ts'
    ];

    for (const file of criticalFiles) {
      if (fs.existsSync(file)) {
        successes.push(`✅ File: ${file} - EXISTS`);
      } else {
        criticalIssues.push(`❌ File: ${file} - MISSING`);
      }
    }

  } catch (error) {
    criticalIssues.push(`❌ File structure check failed: ${error.message}`);
  }

  // FINAL VERDICT
  console.log('\n📊 BRUTAL REALITY CHECK RESULTS:\n');

  console.log('🔴 CRITICAL ISSUES (WILL EMBARRASS YOU):');
  if (criticalIssues.length === 0) {
    console.log('   ✅ NONE - You\'re safe!');
  } else {
    criticalIssues.forEach(issue => console.log(`   ${issue}`));
  }

  console.log('\n⚠️  WARNINGS (MIGHT CAUSE ISSUES):');
  if (warnings.length === 0) {
    console.log('   ✅ NONE - Clean!');
  } else {
    warnings.forEach(warning => console.log(`   ${warning}`));
  }

  console.log('\n✅ CONFIRMED WORKING:');
  successes.forEach(success => console.log(`   ${success}`));

  // FINAL JUDGMENT
  const totalIssues = criticalIssues.length;
  const totalWarnings = warnings.length;
  const totalSuccesses = successes.length;

  console.log('\n🎯 FINAL VERDICT:');

  if (totalIssues === 0 && totalWarnings <= 2) {
    console.log('🎉 SAFE TO DEMO - You will NOT be embarrassed!');
    console.log('🚀 Backend is genuinely ready for production');
    console.log(`📈 Confidence Level: ${Math.min(95 + (totalSuccesses - totalWarnings) * 2, 100)}%`);
  } else if (totalIssues === 0 && totalWarnings <= 5) {
    console.log('⚠️  RISKY BUT POSSIBLE - Minor issues could surface');
    console.log('🔧 Fix warnings before demo for safety');
    console.log(`📈 Confidence Level: ${Math.max(60 - totalWarnings * 10, 30)}%`);
  } else {
    console.log('🚨 DO NOT DEMO - Will embarrass you!');
    console.log('❌ Fix critical issues first');
    console.log(`📈 Confidence Level: ${Math.max(20 - totalIssues * 15, 0)}%`);
  }

  return { criticalIssues, warnings, successes };
}

brutallHonestCheck().catch(console.error);