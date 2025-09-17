/**
 * Quick Performance Test for Diamond App Backend
 * Shorter duration tests for rapid validation
 */

const autocannon = require('autocannon');

const TEST_CONFIG = {
  baseUrl: 'http://localhost:3003',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

class QuickPerformanceTester {
  constructor() {
    this.results = {};
  }

  async testHealthEndpoint() {
    console.log('🩺 Testing health endpoint (quick)...');
    
    const result = await autocannon({
      url: `${TEST_CONFIG.baseUrl}/api/health`,
      connections: 10,
      duration: 5, // Reduced duration
      headers: TEST_CONFIG.headers
    });

    return {
      requestsPerSecond: result.requests.average,
      latencyMean: result.latency.mean,
      latencyP95: result.latency.p95,
      errors: result.errors,
      totalRequests: result.requests.total
    };
  }

  async testConcurrentUsers() {
    console.log('👥 Testing concurrent user scenarios (quick)...');
    
    const scenarios = [
      { users: 1, duration: 3, name: 'Single User' },
      { users: 10, duration: 4, name: 'Small Class' },
      { users: 30, duration: 5, name: 'Full Classroom' },
      { users: 50, duration: 6, name: 'Large Scale' }
    ];

    const results = [];

    for (const scenario of scenarios) {
      console.log(`📊 Testing ${scenario.name} (${scenario.users} users)...`);
      
      const result = await autocannon({
        url: `${TEST_CONFIG.baseUrl}/api/health`,
        connections: scenario.users,
        duration: scenario.duration,
        headers: TEST_CONFIG.headers
      });

      const testResult = {
        scenario: scenario.name,
        users: scenario.users,
        requestsPerSecond: result.requests.average,
        latencyMean: result.latency.mean,
        latencyP95: result.latency.p95,
        errors: result.errors,
        errorRate: (result.errors / result.requests.total * 100).toFixed(2),
        totalRequests: result.requests.total
      };

      results.push(testResult);
      console.log(`   📈 ${result.requests.average} req/sec, ${testResult.errorRate}% errors, ${result.latency.mean}ms avg`);
      
      // Short pause between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  }

  async testAPIEndpoints() {
    console.log('🛠️ Testing key API endpoints (quick)...');
    
    const endpoints = [
      { path: '/api/health', name: 'Health Check' },
      { path: '/', name: 'Root Endpoint' },
      { path: '/api/competences', name: 'Competences' }
    ];

    const results = [];

    for (const endpoint of endpoints) {
      console.log(`🎯 Testing ${endpoint.name}...`);
      
      try {
        const result = await autocannon({
          url: `${TEST_CONFIG.baseUrl}${endpoint.path}`,
          connections: 5,
          duration: 3,
          headers: TEST_CONFIG.headers
        });

        const testResult = {
          endpoint: endpoint.name,
          path: endpoint.path,
          requestsPerSecond: result.requests.average,
          latencyMean: result.latency.mean,
          latencyP95: result.latency.p95,
          errors: result.errors,
          successRate: ((result.requests.total - result.errors) / result.requests.total * 100).toFixed(2)
        };

        results.push(testResult);
        console.log(`   ✅ ${result.requests.average} req/sec, ${testResult.successRate}% success, ${result.latency.mean}ms`);
        
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
        results.push({
          endpoint: endpoint.name,
          path: endpoint.path,
          error: error.message
        });
      }
    }

    return results;
  }

  async testAuthEndpoint() {
    console.log('🔐 Testing authentication endpoint (quick)...');
    
    const authPayload = JSON.stringify({
      prenom: 'Emma',
      nom: 'Martin', 
      password: 'password123'
    });

    try {
      const result = await autocannon({
        url: `${TEST_CONFIG.baseUrl}/api/auth/login`,
        method: 'POST',
        headers: TEST_CONFIG.headers,
        body: authPayload,
        connections: 3,
        duration: 3
      });

      return {
        requestsPerSecond: result.requests.average,
        latencyMean: result.latency.mean,
        latencyP95: result.latency.p95,
        errors: result.errors,
        successRate: ((result.requests.total - result.errors) / result.requests.total * 100).toFixed(2),
        totalRequests: result.requests.total
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async testExerciseSubmission() {
    console.log('📝 Testing exercise submission (quick)...');
    
    const exercisePayload = JSON.stringify({
      exerciseId: '1',
      score: '85',
      completed: 'true',
      timeSpent: '45',
      answers: 'A'
    });

    try {
      const result = await autocannon({
        url: `${TEST_CONFIG.baseUrl}/api/exercises/attempt`,
        method: 'POST',
        headers: TEST_CONFIG.headers,
        body: exercisePayload,
        connections: 5,
        duration: 4
      });

      return {
        requestsPerSecond: result.requests.average,
        latencyMean: result.latency.mean,
        latencyP95: result.latency.p95,
        errors: result.errors,
        successRate: ((result.requests.total - result.errors) / result.requests.total * 100).toFixed(2),
        totalRequests: result.requests.total
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  generateQuickReport() {
    const report = {
      timestamp: new Date().toISOString(),
      testType: 'Quick Performance Test',
      results: this.results,
      summary: {
        healthStatus: this.results.health ? 'PASS' : 'FAIL',
        classroomReady: this.evaluateClassroomReadiness(),
        performanceScore: this.calculateQuickScore(),
        keyMetrics: this.extractKeyMetrics()
      }
    };

    return report;
  }

  evaluateClassroomReadiness() {
    const classroomTest = this.results.concurrency?.find(t => t.users === 30);
    if (!classroomTest) return 'UNKNOWN';
    
    return classroomTest.latencyMean < 100 && 
           parseFloat(classroomTest.errorRate) < 1 && 
           classroomTest.requestsPerSecond > 100 ? 'READY' : 'NEEDS_OPTIMIZATION';
  }

  calculateQuickScore() {
    let score = 100;
    
    if (this.results.health?.latencyMean > 50) score -= 10;
    if (this.results.health?.requestsPerSecond < 500) score -= 10;
    
    const classroomTest = this.results.concurrency?.find(t => t.users === 30);
    if (classroomTest) {
      if (classroomTest.latencyMean > 100) score -= 20;
      if (parseFloat(classroomTest.errorRate) > 0) score -= 15;
    }
    
    return Math.max(0, score);
  }

  extractKeyMetrics() {
    const classroomTest = this.results.concurrency?.find(t => t.users === 30);
    return {
      healthCheckLatency: this.results.health?.latencyMean || 'N/A',
      classroomPerformance: classroomTest ? {
        latency: classroomTest.latencyMean,
        throughput: classroomTest.requestsPerSecond,
        errorRate: classroomTest.errorRate
      } : 'N/A',
      authPerformance: this.results.auth ? {
        latency: this.results.auth.latencyMean,
        successRate: this.results.auth.successRate
      } : 'N/A'
    };
  }

  async runQuickTests() {
    console.log('🚀 Starting quick performance validation...\n');
    
    try {
      // Health check
      this.results.health = await this.testHealthEndpoint();
      
      // API endpoints
      this.results.endpoints = await this.testAPIEndpoints();
      
      // Concurrency tests
      this.results.concurrency = await this.testConcurrentUsers();
      
      // Authentication
      console.log('🔐 Testing authentication...');
      this.results.auth = await this.testAuthEndpoint();
      if (this.results.auth.error) {
        console.log('⚠️ Auth test failed:', this.results.auth.error);
      } else {
        console.log(`✅ Auth: ${this.results.auth.requestsPerSecond} req/sec, ${this.results.auth.successRate}% success`);
      }
      
      // Exercise submission
      console.log('📝 Testing exercise submission...');
      this.results.exercise = await this.testExerciseSubmission();
      if (this.results.exercise.error) {
        console.log('⚠️ Exercise test failed:', this.results.exercise.error);
      } else {
        console.log(`✅ Exercise: ${this.results.exercise.requestsPerSecond} req/sec, ${this.results.exercise.successRate}% success`);
      }
      
      console.log('\n🎉 Quick performance tests completed!');
      
      return this.generateQuickReport();
      
    } catch (error) {
      console.error('❌ Quick performance testing failed:', error);
      throw error;
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new QuickPerformanceTester();
  
  tester.runQuickTests()
    .then(report => {
      console.log('\n📊 QUICK PERFORMANCE REPORT');
      console.log('='.repeat(40));
      console.log(`Performance Score: ${report.summary.performanceScore}/100`);
      console.log(`Health Status: ${report.summary.healthStatus}`);
      console.log(`Classroom Ready: ${report.summary.classroomReady}`);
      
      console.log('\n🎯 Key Metrics:');
      console.log(`Health Check Latency: ${report.summary.keyMetrics.healthCheckLatency}ms`);
      
      if (report.summary.keyMetrics.classroomPerformance !== 'N/A') {
        const cp = report.summary.keyMetrics.classroomPerformance;
        console.log(`Classroom (30 users): ${cp.latency}ms latency, ${cp.throughput} req/sec, ${cp.errorRate}% errors`);
      }
      
      console.log('\n💡 Recommendations:');
      if (report.summary.performanceScore >= 90) {
        console.log('  ✅ Excellent performance - ready for production deployment');
      } else if (report.summary.performanceScore >= 75) {
        console.log('  ⚡ Good performance - minor optimizations recommended');
      } else {
        console.log('  ⚠️ Performance issues detected - optimization needed before production');
      }
      
      // Save report
      const fs = require('fs');
      const reportFile = `quick-performance-report-${Date.now()}.json`;
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
      console.log(`\n📄 Full report saved to: ${reportFile}`);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = QuickPerformanceTester;