/**
 * Quick dependency installer
 */

const { execSync } = require('child_process');

console.log('🔧 Installing missing dependencies...');

try {
  // Install pino-pretty
  execSync('npm install pino-pretty@10.2.3 --save-dev', { stdio: 'inherit' });
  console.log('✅ pino-pretty installed');
  
  // Install fastify if missing
  execSync('npm install fastify@4.24.3 --save', { stdio: 'inherit' });
  console.log('✅ fastify installed');
  
  console.log('🎉 All dependencies installed!');
  console.log('🚀 You can now run: npm run dev');
  
} catch (error) {
  console.error('❌ Error installing dependencies:', error.message);
  console.log('💡 Try running manually:');
  console.log('   npm install pino-pretty@10.2.3 --save-dev');
  console.log('   npm install fastify@4.24.3 --save');
}



