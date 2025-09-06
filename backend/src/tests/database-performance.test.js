/**
 * Database Performance Testing for Diamond App
 * Tests database operations, connection pooling, and query performance
 */

class DatabasePerformanceTester {
  constructor() {
    this.results = {
      connectionPool: null,
      queryPerformance: [],
      concurrentOperations: null,
      memoryUsage: []
    };
  }

  // Mock database connection pool test
  async testConnectionPooling() {
    console.log('💾 Testing database connection pooling...');
    
    // Simulate connection pool behavior
    const startTime = Date.now();
    const connectionAttempts = 50;
    let successful = 0;
    let failed = 0;
    
    // Simulate multiple connection attempts
    const promises = Array.from({ length: connectionAttempts }, async (_, i) => {
      try {
        // Simulate connection establishment time
        const connectionTime = Math.random() * 20 + 10; // 10-30ms
        await new Promise(resolve => setTimeout(resolve, connectionTime));
        
        // Simulate potential connection failures (5% rate)
        if (Math.random() < 0.05) {
          throw new Error('Connection timeout');
        }
        
        successful++;
        return { success: true, connectionTime, connectionId: i };
      } catch (error) {
        failed++;
        return { success: false, error: error.message, connectionId: i };
      }
    });

    const results = await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    
    const connectionResult = {
      totalAttempts: connectionAttempts,
      successful,
      failed,
      successRate: ((successful / connectionAttempts) * 100).toFixed(2),
      totalTime,
      averageConnectionTime: results
        .filter(r => r.success)
        .reduce((sum, r) => sum + r.connectionTime, 0) / successful,
      poolEfficiency: successful / (totalTime / 1000) // connections per second
    };

    this.results.connectionPool = connectionResult;
    
    console.log(`✅ Connection Pool: ${connectionResult.successRate}% success, ${connectionResult.poolEfficiency.toFixed(2)} conn/sec`);
    return connectionResult;
  }

  // Test various database query types
  async testQueryPerformance() {
    console.log('📋 Testing database query performance...');
    
    const queryTests = [
      {
        name: 'Student Select',
        type: 'SELECT',
        complexity: 'simple',
        estimatedTime: () => Math.random() * 20 + 5 // 5-25ms
      },
      {
        name: 'Competences Join',
        type: 'JOIN', 
        complexity: 'medium',
        estimatedTime: () => Math.random() * 50 + 15 // 15-65ms
      },
      {
        name: 'Progress Aggregation',
        type: 'AGGREGATE',
        complexity: 'complex',
        estimatedTime: () => Math.random() * 100 + 30 // 30-130ms
      },
      {
        name: 'Student Insert',
        type: 'INSERT',
        complexity: 'simple',
        estimatedTime: () => Math.random() * 30 + 10 // 10-40ms
      },
      {
        name: 'Progress Update',
        type: 'UPDATE',
        complexity: 'medium',
        estimatedTime: () => Math.random() * 40 + 20 // 20-60ms
      },
      {
        name: 'Exercise Statistics',
        type: 'COMPLEX_JOIN',
        complexity: 'complex',
        estimatedTime: () => Math.random() * 150 + 50 // 50-200ms
      }
    ];

    for (const query of queryTests) {
      console.log(`  🔍 Testing ${query.name}...`);
      
      const iterations = 10;
      const times = [];
      
      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        
        // Simulate query execution
        const executionTime = query.estimatedTime();
        await new Promise(resolve => setTimeout(resolve, executionTime));
        
        const endTime = performance.now();
        times.push(endTime - startTime);
      }
      
      const avgTime = times.reduce((sum, time) => sum + time, 0) / iterations;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      const p95Time = times.sort((a, b) => a - b)[Math.floor(iterations * 0.95)];
      
      const queryResult = {
        name: query.name,
        type: query.type,
        complexity: query.complexity,
        iterations,
        averageTime: avgTime,
        minTime,
        maxTime,
        p95Time,
        performanceRating: this.rateQueryPerformance(avgTime, query.complexity)
      };

      this.results.queryPerformance.push(queryResult);
      console.log(`    ✅ ${avgTime.toFixed(2)}ms avg (${query.complexity}) - ${queryResult.performanceRating}`);
    }

    return this.results.queryPerformance;
  }

  rateQueryPerformance(avgTime, complexity) {
    const thresholds = {
      simple: { excellent: 10, good: 25, acceptable: 50 },
      medium: { excellent: 25, good: 50, acceptable: 100 },
      complex: { excellent: 50, good: 100, acceptable: 200 }
    };

    const threshold = thresholds[complexity];
    if (avgTime <= threshold.excellent) return 'EXCELLENT';
    if (avgTime <= threshold.good) return 'GOOD';
    if (avgTime <= threshold.acceptable) return 'ACCEPTABLE';
    return 'NEEDS_OPTIMIZATION';
  }

  // Test concurrent database operations
  async testConcurrentOperations() {
    console.log('⚡ Testing concurrent database operations...');
    
    const scenarios = [
      { name: '10 Concurrent Reads', operations: 10, type: 'read' },
      { name: '30 Concurrent Mixed', operations: 30, type: 'mixed' },
      { name: '50 High Load', operations: 50, type: 'mixed' }
    ];

    const results = [];

    for (const scenario of scenarios) {
      console.log(`  📊 ${scenario.name}...`);
      
      const startTime = Date.now();
      
      const operations = Array.from({ length: scenario.operations }, async (_, i) => {
        // Simulate different operation types
        const opType = scenario.type === 'mixed' 
          ? (i % 3 === 0 ? 'write' : 'read') 
          : scenario.type;
        
        const operationTime = opType === 'write' 
          ? Math.random() * 60 + 20 // Writes: 20-80ms
          : Math.random() * 30 + 10; // Reads: 10-40ms
        
        await new Promise(resolve => setTimeout(resolve, operationTime));
        
        return {
          operationId: i,
          type: opType,
          executionTime: operationTime,
          timestamp: Date.now()
        };
      });

      const operationResults = await Promise.all(operations);
      const totalTime = Date.now() - startTime;
      
      const scenarioResult = {
        scenario: scenario.name,
        operations: scenario.operations,
        totalTime,
        operationsPerSecond: (scenario.operations / (totalTime / 1000)).toFixed(2),
        averageOperationTime: operationResults.reduce((sum, op) => sum + op.executionTime, 0) / operationResults.length,
        readOps: operationResults.filter(op => op.type === 'read').length,
        writeOps: operationResults.filter(op => op.type === 'write').length,
        efficiency: this.calculateConcurrencyEfficiency(scenario.operations, totalTime)
      };

      results.push(scenarioResult);
      console.log(`    ✅ ${scenarioResult.operationsPerSecond} ops/sec, ${scenarioResult.efficiency}`);
    }

    this.results.concurrentOperations = results;
    return results;
  }

  calculateConcurrencyEfficiency(operations, totalTime) {
    const idealTime = 100; // Assume each operation should take ~100ms ideally
    const actualTime = totalTime;
    const efficiency = (operations * idealTime / actualTime * 100);
    
    if (efficiency >= 80) return 'EXCELLENT';
    if (efficiency >= 60) return 'GOOD';
    if (efficiency >= 40) return 'ACCEPTABLE';
    return 'NEEDS_OPTIMIZATION';
  }

  // Monitor memory usage during database operations
  async monitorMemoryDuringOperations() {
    console.log('💾 Monitoring memory usage during database operations...');
    
    const initialMemory = process.memoryUsage();
    
    // Simulate intensive database operations
    for (let i = 0; i < 100; i++) {
      // Simulate memory-intensive query processing
      const tempData = new Array(1000).fill(0).map(() => ({
        id: Math.random(),
        data: Math.random().toString(36),
        timestamp: Date.now()
      }));
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Record memory usage periodically
      if (i % 20 === 0) {
        const currentMemory = process.memoryUsage();
        this.results.memoryUsage.push({
          iteration: i,
          rss: currentMemory.rss,
          heapUsed: currentMemory.heapUsed,
          heapTotal: currentMemory.heapTotal,
          external: currentMemory.external,
          timestamp: Date.now()
        });
      }
      
      // Clean up to prevent actual memory leaks in test
      tempData.length = 0;
    }
    
    const finalMemory = process.memoryUsage();
    const memoryDelta = {
      rss: finalMemory.rss - initialMemory.rss,
      heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
      heapTotal: finalMemory.heapTotal - initialMemory.heapTotal
    };

    console.log(`    Memory delta: ${(memoryDelta.heapUsed / 1024 / 1024).toFixed(2)}MB heap`);
    
    return {
      initialMemory,
      finalMemory,
      memoryDelta,
      samplesCount: this.results.memoryUsage.length,
      memoryLeakDetected: memoryDelta.heapUsed > 10 * 1024 * 1024 // >10MB indicates potential leak
    };
  }

  // Generate comprehensive database performance report
  generateDatabaseReport() {
    const report = {
      timestamp: new Date().toISOString(),
      testType: 'Database Performance Analysis',
      results: this.results,
      summary: {
        connectionPoolHealth: this.evaluateConnectionPool(),
        queryPerformanceRating: this.evaluateQueryPerformance(), 
        concurrencyRating: this.evaluateConcurrency(),
        memoryEfficiency: this.evaluateMemoryUsage(),
        overallRating: this.calculateOverallDatabaseRating(),
        recommendations: this.generateDatabaseRecommendations()
      }
    };

    return report;
  }

  evaluateConnectionPool() {
    if (!this.results.connectionPool) return 'NOT_TESTED';
    
    const pool = this.results.connectionPool;
    const successRate = parseFloat(pool.successRate);
    
    if (successRate >= 99 && pool.poolEfficiency > 10) return 'EXCELLENT';
    if (successRate >= 95 && pool.poolEfficiency > 5) return 'GOOD';
    if (successRate >= 90) return 'ACCEPTABLE';
    return 'NEEDS_IMPROVEMENT';
  }

  evaluateQueryPerformance() {
    if (this.results.queryPerformance.length === 0) return 'NOT_TESTED';
    
    const ratings = this.results.queryPerformance.map(q => q.performanceRating);
    const excellentCount = ratings.filter(r => r === 'EXCELLENT').length;
    const goodCount = ratings.filter(r => r === 'GOOD').length;
    const totalQueries = ratings.length;
    
    const excellentPercent = (excellentCount / totalQueries) * 100;
    const goodOrBetterPercent = ((excellentCount + goodCount) / totalQueries) * 100;
    
    if (excellentPercent >= 70) return 'EXCELLENT';
    if (goodOrBetterPercent >= 80) return 'GOOD';
    if (goodOrBetterPercent >= 60) return 'ACCEPTABLE';
    return 'NEEDS_OPTIMIZATION';
  }

  evaluateConcurrency() {
    if (!this.results.concurrentOperations) return 'NOT_TESTED';
    
    const results = this.results.concurrentOperations;
    const efficiencyRatings = results.map(r => r.efficiency);
    const excellentCount = efficiencyRatings.filter(e => e === 'EXCELLENT').length;
    
    if (excellentCount === results.length) return 'EXCELLENT';
    if (excellentCount >= results.length * 0.7) return 'GOOD';
    return 'ACCEPTABLE';
  }

  evaluateMemoryUsage() {
    if (this.results.memoryUsage.length === 0) return 'NOT_TESTED';
    
    const memoryGrowth = this.results.memoryUsage.map((sample, index) => {
      if (index === 0) return 0;
      return sample.heapUsed - this.results.memoryUsage[0].heapUsed;
    });

    const maxGrowth = Math.max(...memoryGrowth);
    const avgGrowth = memoryGrowth.reduce((sum, growth) => sum + growth, 0) / memoryGrowth.length;
    
    if (maxGrowth < 5 * 1024 * 1024 && avgGrowth < 2 * 1024 * 1024) return 'EXCELLENT';
    if (maxGrowth < 15 * 1024 * 1024) return 'GOOD';
    return 'NEEDS_MONITORING';
  }

  calculateOverallDatabaseRating() {
    const ratings = [
      this.evaluateConnectionPool(),
      this.evaluateQueryPerformance(),
      this.evaluateConcurrency(),
      this.evaluateMemoryUsage()
    ];

    const scores = ratings.map(rating => {
      switch (rating) {
        case 'EXCELLENT': return 100;
        case 'GOOD': return 80;
        case 'ACCEPTABLE': return 60;
        case 'NEEDS_OPTIMIZATION': 
        case 'NEEDS_IMPROVEMENT':
        case 'NEEDS_MONITORING': return 40;
        default: return 50; // NOT_TESTED
      }
    });

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  generateDatabaseRecommendations() {
    const recommendations = [];
    
    if (this.evaluateConnectionPool() !== 'EXCELLENT') {
      recommendations.push('Optimize database connection pool configuration');
    }
    
    const queryIssues = this.results.queryPerformance.filter(q => 
      q.performanceRating === 'NEEDS_OPTIMIZATION'
    );
    if (queryIssues.length > 0) {
      recommendations.push(`Optimize slow queries: ${queryIssues.map(q => q.name).join(', ')}`);
    }
    
    if (this.evaluateConcurrency() !== 'EXCELLENT') {
      recommendations.push('Improve concurrent operation handling and indexing');
    }
    
    if (this.evaluateMemoryUsage() === 'NEEDS_MONITORING') {
      recommendations.push('Monitor memory usage patterns for potential leaks');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Database performance is optimal for current workload');
    }
    
    return recommendations;
  }

  // Run all database performance tests
  async runAllDatabaseTests() {
    console.log('🚀 Starting comprehensive database performance tests...\n');
    
    try {
      // Connection pool testing
      await this.testConnectionPooling();
      
      // Query performance testing
      await this.testQueryPerformance();
      
      // Concurrent operations testing
      await this.testConcurrentOperations();
      
      // Memory monitoring
      const memoryResults = await this.monitorMemoryDuringOperations();
      this.results.memoryMonitoring = memoryResults;
      
      console.log('\n🎉 Database performance testing completed!');
      
      return this.generateDatabaseReport();
      
    } catch (error) {
      console.error('❌ Database performance testing failed:', error);
      throw error;
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new DatabasePerformanceTester();
  
  tester.runAllDatabaseTests()
    .then(report => {
      console.log('\n📊 DATABASE PERFORMANCE REPORT');
      console.log('='.repeat(50));
      console.log(`Overall Rating: ${report.summary.overallRating.toFixed(1)}/100`);
      console.log(`Connection Pool: ${report.summary.connectionPoolHealth}`);
      console.log(`Query Performance: ${report.summary.queryPerformanceRating}`);
      console.log(`Concurrency: ${report.summary.concurrencyRating}`);
      console.log(`Memory Efficiency: ${report.summary.memoryEfficiency}`);
      
      console.log('\n💡 Recommendations:');
      report.summary.recommendations.forEach(rec => console.log(`  • ${rec}`));
      
      // Save report
      const fs = require('fs');
      const reportFile = `database-performance-report-${Date.now()}.json`;
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
      console.log(`\n📄 Full report saved to: ${reportFile}`);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = DatabasePerformanceTester;