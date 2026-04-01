/**
 * Load Testing for MedXplain Analysis Endpoints
 * Simulates concurrent user loads to test performance and stability
 */

interface LoadTestConfig {
  baseUrl: string;
  token: string;
  concurrentUsers: number;
  requestsPerUser: number;
  testDuration: number; // seconds
  rampUpTime: number; // seconds
}

interface LoadTestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
}

const mockAnalysisPayload = {
  inputType: 'text',
  textInput: 'Patient with elevated glucose 245 mg/dL, HbA1c 8.2%, cholesterol 220 mg/dL',
  parameters: [
    { name: 'Glucose', value: '245', unit: 'mg/dL', status: 'high' },
    { name: 'HbA1c', value: '8.2', unit: '%', status: 'high' },
    { name: 'Cholesterol', value: '220', unit: 'mg/dL', status: 'high' },
  ],
  audienceMode: 'patient',
};

class LoadTester {
  private config: LoadTestConfig;
  private metrics: {
    responseTimes: number[];
    errors: string[];
    startTime: number;
    endTime: number;
  } = {
    responseTimes: [],
    errors: [],
    startTime: 0,
    endTime: 0,
  };

  constructor(config: LoadTestConfig) {
    this.config = config;
  }

  async runLoadTest(): Promise<LoadTestMetrics> {
    console.log(`\n🚀 Starting Load Test`);
    console.log(`📊 Configuration:`);
    console.log(`   - Base URL: ${this.config.baseUrl}`);
    console.log(`   - Concurrent Users: ${this.config.concurrentUsers}`);
    console.log(`   - Requests per User: ${this.config.requestsPerUser}`);
    console.log(`   - Total Expected Requests: ${this.config.concurrentUsers * this.config.requestsPerUser}`);
    console.log(`   - Ramp-up Time: ${this.config.rampUpTime}s\n`);

    this.metrics.startTime = Date.now();

    // Ramp up users gradually
    const rampUpInterval = this.config.rampUpTime / this.config.concurrentUsers;
    const userPromises: Promise<void>[] = [];

    for (let i = 0; i < this.config.concurrentUsers; i++) {
      setTimeout(() => {
        userPromises.push(this.simulateUser(i));
      }, i * rampUpInterval * 1000);
    }

    await Promise.all(userPromises);

    this.metrics.endTime = Date.now();

    return this.calculateMetrics();
  }

  private async simulateUser(userId: number): Promise<void> {
    for (let i = 0; i < this.config.requestsPerUser; i++) {
      try {
        const startTime = Date.now();

        const response = await fetch(`${this.config.baseUrl}/api/v2/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.token}`,
          },
          body: JSON.stringify(mockAnalysisPayload),
        });

        const responseTime = Date.now() - startTime;
        this.metrics.responseTimes.push(responseTime);

        if (!response.ok) {
          this.metrics.errors.push(
            `User ${userId} Request ${i}: HTTP ${response.status}`
          );
        }

        // Log progress
        if (i % 5 === 0) {
          console.log(
            `👤 User ${userId}: ${i + 1}/${this.config.requestsPerUser} requests (${responseTime}ms)`
          );
        }
      } catch (error) {
        this.metrics.errors.push(
          `User ${userId} Request ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  }

  private calculateMetrics(): LoadTestMetrics {
    const totalRequests = this.metrics.responseTimes.length + this.metrics.errors.length;
    const successfulRequests = this.metrics.responseTimes.length;
    const failedRequests = this.metrics.errors.length;

    // Sort response times for percentile calculation
    const sorted = [...this.metrics.responseTimes].sort((a, b) => a - b);

    const metrics: LoadTestMetrics = {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime: sorted.length > 0 ? sorted.reduce((a, b) => a + b) / sorted.length : 0,
      minResponseTime: sorted.length > 0 ? sorted[0] : 0,
      maxResponseTime: sorted.length > 0 ? sorted[sorted.length - 1] : 0,
      p95ResponseTime: sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.95)] : 0,
      p99ResponseTime: sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.99)] : 0,
      requestsPerSecond: totalRequests / ((this.metrics.endTime - this.metrics.startTime) / 1000),
      errorRate: (failedRequests / totalRequests) * 100,
    };

    return metrics;
  }

  printResults(metrics: LoadTestMetrics): void {
    console.log(`\n📈 Load Test Results\n`);
    console.log(`✅ Successful Requests: ${metrics.successfulRequests}/${metrics.totalRequests}`);
    console.log(`❌ Failed Requests: ${metrics.failedRequests}`);
    console.log(`⏱️  Error Rate: ${metrics.errorRate.toFixed(2)}%\n`);

    console.log(`⚡ Performance Metrics:`);
    console.log(`   - Avg Response Time: ${metrics.averageResponseTime.toFixed(0)}ms`);
    console.log(`   - Min Response Time: ${metrics.minResponseTime}ms`);
    console.log(`   - Max Response Time: ${metrics.maxResponseTime}ms`);
    console.log(`   - P95 Response Time: ${metrics.p95ResponseTime.toFixed(0)}ms`);
    console.log(`   - P99 Response Time: ${metrics.p99ResponseTime.toFixed(0)}ms`);
    console.log(`   - Requests/Second: ${metrics.requestsPerSecond.toFixed(2)}\n`);

    // Performance assessment
    this.assessPerformance(metrics);
  }

  private assessPerformance(metrics: LoadTestMetrics): void {
    console.log(`📊 Performance Assessment:\n`);

    const assessments = [];

    if (metrics.errorRate > 5) {
      assessments.push(`⚠️  High error rate (${metrics.errorRate.toFixed(2)}%)`);
    } else if (metrics.errorRate === 0) {
      assessments.push(`✅ Perfect reliability (0% errors)`);
    }

    if (metrics.averageResponseTime > 3000) {
      assessments.push(
        `⚠️  Slow average response (${metrics.averageResponseTime.toFixed(0)}ms)`
      );
    } else if (metrics.averageResponseTime < 1000) {
      assessments.push(
        `✅ Excellent average response (${metrics.averageResponseTime.toFixed(0)}ms)`
      );
    }

    if (metrics.p99ResponseTime > 5000) {
      assessments.push(`⚠️  High P99 latency (${metrics.p99ResponseTime.toFixed(0)}ms)`);
    } else {
      assessments.push(`✅ Good P99 latency (${metrics.p99ResponseTime.toFixed(0)}ms)`);
    }

    if (metrics.requestsPerSecond < 10) {
      assessments.push(
        `⚠️  Low throughput (${metrics.requestsPerSecond.toFixed(2)} req/s)`
      );
    } else {
      assessments.push(
        `✅ Good throughput (${metrics.requestsPerSecond.toFixed(2)} req/s)`
      );
    }

    assessments.forEach((assessment) => console.log(`   ${assessment}`));

    console.log(`\n🎯 Recommendation:`);
    if (metrics.errorRate === 0 && metrics.averageResponseTime < 2000) {
      console.log(`   ✅ System is production-ready!`);
    } else if (metrics.errorRate < 2 && metrics.averageResponseTime < 3000) {
      console.log(`   ✅ System is acceptable for production with monitoring.`);
    } else {
      console.log(`   ❌ System needs optimization before production deployment.`);
    }
  }
}

// Standard test scenarios
export const standardLoadTests = {
  light: {
    baseUrl: 'http://localhost:5000',
    token: process.env.API_TOKEN || 'test-token',
    concurrentUsers: 5,
    requestsPerUser: 10,
    testDuration: 60,
    rampUpTime: 10,
  } as LoadTestConfig,

  medium: {
    baseUrl: 'http://localhost:5000',
    token: process.env.API_TOKEN || 'test-token',
    concurrentUsers: 25,
    requestsPerUser: 20,
    testDuration: 120,
    rampUpTime: 20,
  } as LoadTestConfig,

  heavy: {
    baseUrl: 'http://localhost:5000',
    token: process.env.API_TOKEN || 'test-token',
    concurrentUsers: 100,
    requestsPerUser: 50,
    testDuration: 300,
    rampUpTime: 30,
  } as LoadTestConfig,

  stress: {
    baseUrl: 'http://localhost:5000',
    token: process.env.API_TOKEN || 'test-token',
    concurrentUsers: 500,
    requestsPerUser: 100,
    testDuration: 600,
    rampUpTime: 60,
  } as LoadTestConfig,
};

// Run tests
async function main() {
  const scenario = process.argv[2] || 'light';
  const config = standardLoadTests[scenario as keyof typeof standardLoadTests];

  if (!config) {
    console.error(`Unknown scenario: ${scenario}`);
    console.log(`Available scenarios: light, medium, heavy, stress`);
    process.exit(1);
  }

  const tester = new LoadTester(config);
  const metrics = await tester.runLoadTest();
  tester.printResults(metrics);

  // Return exit code based on results
  process.exit(metrics.errorRate > 5 ? 1 : 0);
}

// Export for testing
if (require.main === module) {
  main();
}

export { LoadTester, LoadTestMetrics };
