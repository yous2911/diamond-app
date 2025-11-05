const bcrypt = require('bcrypt');

async function generateHash() {
  const password = 'password123456';
  const hash = await bcrypt.hash(password, 12);
  
  console.log('Password:', password);
  console.log('Hash:', hash);
  
  // Verify the hash works
  const isValid = await bcrypt.compare(password, hash);
  console.log('Hash verification:', isValid ? '✅ Valid' : '❌ Invalid');
}

generateHash();
