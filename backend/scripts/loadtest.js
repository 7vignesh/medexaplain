#!/usr/bin/env node

const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
const endpoint = process.env.LOAD_ENDPOINT || '/health';
const concurrency = Number(process.env.LOAD_CONCURRENCY || 20);
const requests = Number(process.env.LOAD_REQUESTS || 200);

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
  return sorted[idx];
}

async function singleRequest() {
  const start = Date.now();
  const response = await fetch(`${baseUrl}${endpoint}`);
  const latency = Date.now() - start;
  return { ok: response.ok, latency, status: response.status };
}

async function run() {
  console.log('Load test started');
  console.log(`Target: ${baseUrl}${endpoint}`);
  console.log(`Concurrency: ${concurrency}`);
  console.log(`Total requests: ${requests}`);

  const latencies = [];
  let passed = 0;
  let failed = 0;
  const startedAt = Date.now();

  let sent = 0;
  while (sent < requests) {
    const batchSize = Math.min(concurrency, requests - sent);
    const batch = Array.from({ length: batchSize }, () => singleRequest());
    const results = await Promise.allSettled(batch);

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        latencies.push(result.value.latency);
        if (result.value.ok) {
          passed += 1;
        } else {
          failed += 1;
        }
      } else {
        failed += 1;
      }
    });

    sent += batchSize;
  }

  const totalTimeMs = Date.now() - startedAt;
  const sorted = [...latencies].sort((a, b) => a - b);
  const avg = sorted.length ? sorted.reduce((a, b) => a + b, 0) / sorted.length : 0;
  const rps = requests / Math.max(1, totalTimeMs / 1000);

  console.log('Load test completed');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Avg latency: ${avg.toFixed(1)}ms`);
  console.log(`P50 latency: ${percentile(sorted, 0.5)}ms`);
  console.log(`P95 latency: ${percentile(sorted, 0.95)}ms`);
  console.log(`P99 latency: ${percentile(sorted, 0.99)}ms`);
  console.log(`Throughput: ${rps.toFixed(2)} req/s`);

  process.exit(failed > 0 ? 1 : 0);
}

run().catch((error) => {
  console.error('Load test crashed:', error.message || error);
  process.exit(1);
});
