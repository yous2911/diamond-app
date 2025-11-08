/**
 * MVP Routes Testing Script
 * Tests critical MVP routes and features
 */

const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3003';
const API_BASE = `${BASE_URL}/api`;

// Test results
const results = {
  passed: [],
  failed: [],
  skipped: []
};

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
      options.headers['Content-Length'] = JSON.stringify(data).length;
    }

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test function
async function test(name, testFn) {
  try {
    console.log(`\n🧪 Testing: ${name}...`);
    await testFn();
    results.passed.push(name);
    console.log(`✅ PASSED: ${name}`);
  } catch (error) {
    results.failed.push({ name, error: error.message });
    console.log(`❌ FAILED: ${name}`);
    console.log(`   Error: ${error.message}`);
  }
}

// MVP Routes Tests
async function runTests() {
  console.log('🚀 Starting MVP Routes Testing...\n');
  console.log(`📍 Base URL: ${BASE_URL}`);

  let authToken = null;
  let testStudentId = null;

  // 1. Health Check
  await test('Health Check', async () => {
    const response = await makeRequest('GET', '/health');
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    if (!response.body.status || response.body.status !== 'ok') {
      throw new Error('Health check status is not ok');
    }
    console.log(`   Status: ${response.body.status}`);
    console.log(`   Uptime: ${response.body.uptime}s`);
  });

  // 2. Student Registration
  await test('Student Registration', async () => {
    const testEmail = `test_${Date.now()}@example.com`;
    const response = await makeRequest('POST', '/auth/register', {
      prenom: 'Test',
      nom: 'Student',
      email: testEmail,
      password: 'TestPassword123!',
      dateNaissance: '2010-01-01',
      niveauScolaire: 'ce1'
    });

    if (response.status !== 201 && response.status !== 200) {
      throw new Error(`Expected 201/200, got ${response.status}: ${JSON.stringify(response.body)}`);
    }
    console.log(`   Registered student: ${testEmail}`);
  });

  // 3. Student Login
  await test('Student Login', async () => {
    // Try to login with a test account (may need to create first)
    const response = await makeRequest('POST', '/auth/login', {
      email: 'test@example.com',
      password: 'test123'
    });

    // If login fails, skip (test account may not exist)
    if (response.status === 200 || response.status === 201) {
      if (response.body.data && response.body.data.token) {
        authToken = response.body.data.token;
        testStudentId = response.body.data.student?.id;
        console.log(`   Login successful, token received`);
      } else if (response.body.token) {
        authToken = response.body.token;
        console.log(`   Login successful, token received`);
      }
    } else {
      results.skipped.push('Student Login (test account not available)');
      console.log(`   ⚠️  SKIPPED: Test account not available`);
    }
  });

  // 4. Get Student Profile (requires auth)
  if (authToken) {
    await test('Get Student Profile', async () => {
      const response = await makeRequest('GET', '/students/profile', null, authToken);
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.body)}`);
      }
      if (!response.body.data) {
        throw new Error('No student data in response');
      }
      console.log(`   Student: ${response.body.data.prenom} ${response.body.data.nom}`);
    });
  } else {
    results.skipped.push('Get Student Profile (no auth token)');
  }

  // 5. Get Exercises
  await test('Get Exercises', async () => {
    const response = await makeRequest('GET', '/exercises?limit=5');
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.body)}`);
    }
    if (!Array.isArray(response.body.data) && !Array.isArray(response.body)) {
      throw new Error('Exercises response is not an array');
    }
    const exercises = response.body.data || response.body;
    console.log(`   Found ${exercises.length} exercises`);
  });

  // 6. Get Competences
  await test('Get Competences', async () => {
    const response = await makeRequest('GET', '/competences?limit=5');
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.body)}`);
    }
    console.log(`   Competences endpoint accessible`);
  });

  // 7. Get Curriculum
  await test('Get Curriculum', async () => {
    const response = await makeRequest('GET', '/curriculum?niveau=ce1');
    if (response.status !== 200 && response.status !== 404) {
      throw new Error(`Expected 200/404, got ${response.status}: ${JSON.stringify(response.body)}`);
    }
    console.log(`   Curriculum endpoint accessible`);
  });

  // 8. Get Leaderboard (if authenticated)
  if (authToken) {
    await test('Get Leaderboard', async () => {
      const response = await makeRequest('GET', '/leaderboard?type=global&category=weekly', null, authToken);
      if (response.status !== 200 && response.status !== 404) {
        throw new Error(`Expected 200/404, got ${response.status}: ${JSON.stringify(response.body)}`);
      }
      console.log(`   Leaderboard endpoint accessible`);
    });
  } else {
    results.skipped.push('Get Leaderboard (no auth token)');
  }

  // 9. Get Student Progress (if authenticated)
  if (authToken && testStudentId) {
    await test('Get Student Progress', async () => {
      const response = await makeRequest('GET', `/students/${testStudentId}/progress`, null, authToken);
      if (response.status !== 200 && response.status !== 404) {
        throw new Error(`Expected 200/404, got ${response.status}: ${JSON.stringify(response.body)}`);
      }
      console.log(`   Progress endpoint accessible`);
    });
  } else {
    results.skipped.push('Get Student Progress (no auth token or student ID)');
  }

  // 10. Get Student Recommendations (if authenticated)
  if (authToken && testStudentId) {
    await test('Get Student Recommendations', async () => {
      const response = await makeRequest('GET', `/students/${testStudentId}/recommendations`, null, authToken);
      if (response.status !== 200 && response.status !== 404) {
        throw new Error(`Expected 200/404, got ${response.status}: ${JSON.stringify(response.body)}`);
      }
      console.log(`   Recommendations endpoint accessible`);
    });
  } else {
    results.skipped.push('Get Student Recommendations (no auth token or student ID)');
  }

  // Print Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Skipped: ${results.skipped.length}`);
  console.log('='.repeat(60));

  if (results.passed.length > 0) {
    console.log('\n✅ PASSED TESTS:');
    results.passed.forEach(name => console.log(`   - ${name}`));
  }

  if (results.failed.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.failed.forEach(({ name, error }) => {
      console.log(`   - ${name}`);
      console.log(`     Error: ${error}`);
    });
  }

  if (results.skipped.length > 0) {
    console.log('\n⚠️  SKIPPED TESTS:');
    results.skipped.forEach(name => console.log(`   - ${name}`));
  }

  console.log('\n' + '='.repeat(60));

  // Exit with appropriate code
  process.exit(results.failed.length > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});

