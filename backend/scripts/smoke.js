#!/usr/bin/env node

const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';

async function run() {
  const startedAt = Date.now();

  try {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();

    if (!response.ok) {
      console.error('Smoke test failed:', response.status, body);
      process.exit(1);
    }

    const latency = Date.now() - startedAt;
    console.log('Smoke test passed');
    console.log(`Status: ${response.status}`);
    console.log(`Latency: ${latency}ms`);
    console.log(`Message: ${body.message || 'n/a'}`);
    process.exit(0);
  } catch (error) {
    console.error('Smoke test failed:', error.message || error);
    process.exit(1);
  }
}

run();
