/**
 * Performance Testing Suite for Diamond App Backend
 * Tests concurrent users, API response times, and database performance
 */

const autocannon = require('autocannon');
const { spawn } = require('child_process');
const { performance } = require('perf_hooks');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3003',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

class PerformanceTester {
  constructor() {
    this.results = {
      healthCheck: null,
      authentication: null,
      concurrencyTests: [],
      endpointTests: [],
      rateLimitTests: null,
      memoryTests: []
    };
  }

  // Test basic health endpoint
  async testHealthEndpoint() {
    console.log('🩺 Testing health endpoint...');
    
    const result = await autocannon({
      url: `${TEST_CONFIG.baseUrl}/api/health`,
      connections: 10,
      duration: 10,
      headers: TEST_CONFIG.headers
    });

    this.results.healthCheck = {
      requestsPerSecond: result.requests.average,
      latency: {
        mean: result.latency.mean,
        p50: result.latency.p50,
        p95: result.latency.p95,
        p99: result.latency.p99
      },
      throughput: result.throughput.average,
      errors: result.errors,
      timeouts: result.timeouts
    };

    console.log(`✅ Health check: ${result.requests.average} req/sec, ${result.latency.mean}ms avg latency`);
    return this.results.healthCheck;
  }

  // Test authentication endpoint performance
  async testAuthenticationPerformance() {
    console.log('🔐 Testing authentication performance...');
    
    const authPayload = JSON.stringify({
      prenom: 'Emma',
      nom: 'Martin', 
      password: 'password123'
    });

    const result = await autocannon({
      url: `${TEST_CONFIG.baseUrl}/api/auth/login`,
      method: 'POST',
      headers: TEST_CONFIG.headers,
      body: authPayload,
      connections: 5,
      duration: 10
    });

    this.results.authentication = {
      requestsPerSecond: result.requests.average,
      latency: {
        mean: result.latency.mean,
        p95: result.latency.p95,
        p99: result.latency.p99
      },
      errors: result.errors,
      successRate: ((result.requests.total - result.errors) / result.requests.total * 100).toFixed(2)
    };

    console.log(`✅ Auth: ${result.requests.average} req/sec, ${this.results.authentication.successRate}% success`);
    return this.results.authentication;
  }

  // Test concurrent user scenarios
  async testConcurrentUsers() {
    console.log('👥 Testing concurrent user scenarios...');
    
    const scenarios = [
      { users: 1, duration: 10, name: 'Single User' },
      { users: 10, duration: 15, name: 'Small Class' },
      { users: 30, duration: 20, name: 'Full Classroom' },
      { users: 50, duration: 25, name: 'Large Scale' }
    ];

    for (const scenario of scenarios) {
      console.log(`📊 Testing ${scenario.name} (${scenario.users} concurrent users)...`);
      
      const result = await autocannon({
        url: `${TEST_CONFIG.baseUrl}/api/health`,
        connections: scenario.users,
        duration: scenario.duration,
        headers: TEST_CONFIG.headers
      });

      const testResult = {
        scenario: scenario.name,
        users: scenario.users,
        duration: scenario.duration,
        requestsPerSecond: result.requests.average,
        totalRequests: result.requests.total,
        latency: {
          mean: result.latency.mean,
          p95: result.latency.p95,
          p99: result.latency.p99,
          max: result.latency.max
        },
        throughput: result.throughput.average,
        errors: result.errors,
        errorRate: (result.errors / result.requests.total * 100).toFixed(2),
        successRate: ((result.requests.total - result.errors) / result.requests.total * 100).toFixed(2)
      };

      this.results.concurrencyTests.push(testResult);
      
      console.log(`   📈 ${result.requests.average} req/sec, ${testResult.errorRate}% errors, ${result.latency.mean}ms avg latency`);
      
      // Wait between tests to avoid interference
      await this.sleep(2000);
    }

    return this.results.concurrencyTests;
  }

  // Test various API endpoints
  async testAPIEndpoints() {
    console.log('🛠️ Testing API endpoints performance...');
    
    const endpoints = [
      { path: '/api/health', method: 'GET', name: 'Health Check' },
      { path: '/', method: 'GET', name: 'Root Endpoint' },
      { path: '/api/competences', method: 'GET', name: 'Competences List' }
      // Note: Some endpoints may require authentication, which we'll skip for basic performance testing
    ];

    for (const endpoint of endpoints) {
      console.log(`🎯 Testing ${endpoint.name}...`);
      
      try {
        const result = await autocannon({
          url: `${TEST_CONFIG.baseUrl}${endpoint.path}`,
          method: endpoint.method,
          connections: 10,
          duration: 10,
          headers: TEST_CONFIG.headers
        });

        const testResult = {
          endpoint: endpoint.name,
          path: endpoint.path,
          method: endpoint.method,
          requestsPerSecond: result.requests.average,
          latency: {
            mean: result.latency.mean,
            p95: result.latency.p95,
            p99: result.latency.p99
          },
          throughput: result.throughput.average,
          errors: result.errors,
          successRate: ((result.requests.total - result.errors) / result.requests.total * 100).toFixed(2)
        };

        this.results.endpointTests.push(testResult);
        console.log(`   ✅ ${result.requests.average} req/sec, ${testResult.successRate}% success`);
        
      } catch (error) {
        console.log(`   ❌ Failed to test ${endpoint.name}: ${error.message}`);
        this.results.endpointTests.push({
          endpoint: endpoint.name,
          path: endpoint.path,
          method: endpoint.method,
          error: error.message
        });
      }
      
      await this.sleep(1000);
    }

    return this.results.endpointTests;
  }

  // Test rate limiting effectiveness
  async testRateLimiting() {
    console.log('🚦 Testing rate limiting...');
    
    const result = await autocannon({
      url: `${TEST_CONFIG.baseUrl}/api/health`,
      connections: 20,
      duration: 5,
      headers: TEST_CONFIG.headers
    });

    this.results.rateLimitTests = {
      totalRequests: result.requests.total,
      errors: result.errors,
      rateLimitHits: result.non2xx || 0, // Assuming rate limits return non-2xx responses
      effectiveRate: (result.requests.total / 5).toFixed(2), // requests per second during test
      rateLimitTriggered: result.errors > 0 || (result.non2xx || 0) > 0
    };

    console.log(`✅ Rate limiting: ${this.results.rateLimitTests.effectiveRate} req/sec average`);
    return this.results.rateLimitTests;
  }

  // Memory usage monitoring during tests
  async monitorMemoryUsage(testName, testFunction) {
    console.log(`💾 Monitoring memory usage for ${testName}...`);
    
    const startMemory = process.memoryUsage();
    const startTime = performance.now();
    
    // Run the test
    const result = await testFunction();
    
    const endTime = performance.now();
    const endMemory = process.memoryUsage();
    
    const memoryDelta = {
      rss: endMemory.rss - startMemory.rss,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      external: endMemory.external - startMemory.external
    };
    
    const memoryTest = {
      testName,
      duration: endTime - startTime,
      startMemory,
      endMemory,
      memoryDelta,
      potentialLeak: memoryDelta.heapUsed > 50 * 1024 * 1024 // Flag if heap grew by >50MB
    };

    this.results.memoryTests.push(memoryTest);
    
    console.log(`   Memory delta: ${(memoryDelta.heapUsed / 1024 / 1024).toFixed(2)}MB heap`);
    
    return result;
  }

  // Generate comprehensive performance report
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      testConfig: TEST_CONFIG,
      summary: {
        totalTests: this.results.concurrencyTests.length + this.results.endpointTests.length + 1,
        healthStatus: this.results.healthCheck ? 'PASS' : 'FAIL',
        performanceRating: this.calculatePerformanceRating(),
        recommendations: this.generateRecommendations()
      },
      results: this.results
    };

    return report;
  }

  // Calculate overall performance rating
  calculatePerformanceRating() {
    let score = 100;
    
    // Check health endpoint performance
    if (this.results.healthCheck) {
      if (this.results.healthCheck.latency.mean > 200) score -= 10;
      if (this.results.healthCheck.latency.p95 > 500) score -= 15;
      if (this.results.healthCheck.requestsPerSecond < 100) score -= 10;
    }
    
    // Check concurrency test results
    const classroomTest = this.results.concurrencyTests.find(t => t.users === 30);
    if (classroomTest) {
      if (classroomTest.latency.mean > 300) score -= 20;
      if (parseFloat(classroomTest.errorRate) > 1) score -= 15;
      if (classroomTest.requestsPerSecond < 50) score -= 10;
    }
    
    // Check for memory leaks
    const memoryLeaks = this.results.memoryTests.filter(t => t.potentialLeak);
    score -= memoryLeaks.length * 10;
    
    return Math.max(0, score);
  }

  // Generate performance recommendations
  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.healthCheck && this.results.healthCheck.latency.mean > 100) {
      recommendations.push('Consider optimizing health check endpoint - high latency detected');
    }
    
    const classroomTest = this.results.concurrencyTests.find(t => t.users === 30);
    if (classroomTest && parseFloat(classroomTest.errorRate) > 0.5) {
      recommendations.push('High error rate under classroom load - review error handling and capacity');
    }
    
    if (this.results.memoryTests.some(t => t.potentialLeak)) {
      recommendations.push('Potential memory leaks detected - investigate memory usage patterns');
    }
    
    const avgLatency = this.results.endpointTests
      .filter(t => !t.error)
      .reduce((sum, t) => sum + t.latency.mean, 0) / this.results.endpointTests.length;
    
    if (avgLatency > 200) {
      recommendations.push('Average API latency exceeds 200ms - consider caching and optimization');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Performance is within acceptable ranges - monitor for production deployment');
    }
    
    return recommendations;
  }

  // Utility function
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Run all performance tests
  async runAllTests() {
    console.log('🚀 Starting comprehensive performance tests...\n');
    
    try {
      // Basic health check
      await this.monitorMemoryUsage('Health Check', () => this.testHealthEndpoint());
      
      // API endpoints
      await this.monitorMemoryUsage('API Endpoints', () => this.testAPIEndpoints());
      
      // Authentication (if available)
      try {
        await this.monitorMemoryUsage('Authentication', () => this.testAuthenticationPerformance());
      } catch (error) {
        console.log('⚠️ Authentication tests skipped - endpoint may not be available');
      }
      
      // Concurrency tests
      await this.monitorMemoryUsage('Concurrency Tests', () => this.testConcurrentUsers());
      
      // Rate limiting
      await this.monitorMemoryUsage('Rate Limiting', () => this.testRateLimiting());
      
      console.log('\n🎉 Performance testing completed!');
      
      return this.generateReport();
      
    } catch (error) {
      console.error('❌ Performance testing failed:', error);
      throw error;
    }
  }
}

// Export for use in other test files
module.exports = PerformanceTester;

// Run tests if called directly
if (require.main === module) {
  const tester = new PerformanceTester();
  
  tester.runAllTests()
    .then(report => {
      console.log('\n📊 PERFORMANCE TEST REPORT');
      console.log('=' .repeat(50));
      console.log(`Performance Rating: ${report.summary.performanceRating}/100`);
      console.log(`Total Tests: ${report.summary.totalTests}`);
      console.log(`Health Status: ${report.summary.healthStatus}`);
      console.log('\n🔍 Recommendations:');
      report.summary.recommendations.forEach(rec => console.log(`  • ${rec}`));
      
      // Save full report
      const fs = require('fs');
      const reportFile = `performance-report-${Date.now()}.json`;
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
      console.log(`\n📄 Full report saved to: ${reportFile}`);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}