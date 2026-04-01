class MetricsService {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      startedAt: new Date().toISOString(),
      analysesTotal: 0,
      completedTotal: 0,
      failedTotal: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalLatencyMs: 0,
      totalConfidence: 0,
      totalMockAccuracy: 0,
      latencies: [],
      modelUsage: {},
    };
  }

  recordQueued() {
    this.state.analysesTotal += 1;
  }

  recordCacheHit() {
    this.state.cacheHits += 1;
  }

  recordCacheMiss() {
    this.state.cacheMisses += 1;
  }

  recordCompleted({ latencyMs, confidence, modelUsed, mockAccuracy }) {
    this.state.completedTotal += 1;
    this.state.totalLatencyMs += latencyMs;
    this.state.totalConfidence += confidence;
    this.state.totalMockAccuracy += mockAccuracy || 0;
    this.state.latencies.push(latencyMs);

    if (this.state.latencies.length > 500) {
      this.state.latencies.shift();
    }

    if (!this.state.modelUsage[modelUsed]) {
      this.state.modelUsage[modelUsed] = 0;
    }
    this.state.modelUsage[modelUsed] += 1;
  }

  recordFailed() {
    this.state.failedTotal += 1;
  }

  percentile(input, p) {
    if (!input.length) return 0;
    const sorted = [...input].sort((a, b) => a - b);
    const index = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
    return sorted[index];
  }

  getSnapshot() {
    const completed = this.state.completedTotal || 1;
    const analyses = this.state.analysesTotal || 1;

    return {
      startedAt: this.state.startedAt,
      analyses: this.state.analysesTotal,
      completed: this.state.completedTotal,
      failed: this.state.failedTotal,
      cache: {
        hits: this.state.cacheHits,
        misses: this.state.cacheMisses,
        hitRate: Number((this.state.cacheHits / Math.max(1, this.state.cacheHits + this.state.cacheMisses)).toFixed(3)),
      },
      responseTime: {
        averageMs: Number((this.state.totalLatencyMs / completed).toFixed(2)),
        p50Ms: this.percentile(this.state.latencies, 50),
        p95Ms: this.percentile(this.state.latencies, 95),
      },
      confidence: {
        average: Number((this.state.totalConfidence / completed).toFixed(3)),
      },
      mockAccuracy: Number((this.state.totalMockAccuracy / completed).toFixed(3)),
      reliability: {
        successRate: Number((this.state.completedTotal / analyses).toFixed(3)),
        failureRate: Number((this.state.failedTotal / analyses).toFixed(3)),
      },
      modelUsage: this.state.modelUsage,
    };
  }
}

module.exports = new MetricsService();
