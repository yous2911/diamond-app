const { build } = require('./dist/app-test');

async function debugAuth() {
  console.log('🔍 Debugging auth endpoint...');

  const app = await build();
  await app.ready();

  // Test 1: Name-based login
  console.log('\n🧪 Test 1: Name-based login');
  const response1 = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      prenom: 'Alice',
      nom: 'Dupont',
      password: 'CHANGE_ME_PASSWORD'
    }
  });

  console.log('Status:', response1.statusCode);
  console.log('Body:', response1.body);

  // Test 2: Check what's in the request body
  console.log('\n🧪 Test 2: Check request body parsing');
  const response2 = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      prenom: 'Test',
      nom: 'User',
      password: 'CHANGE_ME_PASSWORD'
    }
  });

  console.log('Status:', response2.statusCode);
  console.log('Body:', response2.body);

  await app.close();
}

debugAuth().catch(console.error);
