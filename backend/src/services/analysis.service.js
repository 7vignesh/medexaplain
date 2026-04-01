const crypto = require('crypto');
const aiOrchestrator = require('../orchestrator/ai.orchestrator');
const metricsService = require('./metrics.service');

class AnalysisService {
  constructor() {
    this.jobs = new Map();
    this.cache = new Map();
    this.historyByUser = new Map();
    this.cacheTtlMs = Number(process.env.ANALYSIS_CACHE_TTL_MS || 15 * 60 * 1000);
  }

  async createAnalysisJob(userId, payload = {}) {
    const normalizedPayload = this.normalizePayload(payload);
    const contextResult = this.resolveContext(userId, normalizedPayload.contextResultId);
    const cacheKey = this.buildCacheKey(normalizedPayload, contextResult);

    metricsService.recordQueued();

    const cachedResult = this.readFromCache(cacheKey);
    const analysisId = crypto.randomUUID();

    if (cachedResult) {
      metricsService.recordCacheHit();
      const cachedJob = {
        id: analysisId,
        userId,
        status: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        payload: normalizedPayload,
        result: {
          ...cachedResult,
          metadata: {
            ...cachedResult.metadata,
            latency: cachedResult.metadata?.latency || 0,
            cacheHit: true,
          },
        },
        error: null,
      };

      this.jobs.set(analysisId, cachedJob);
      this.pushHistory(userId, analysisId);

      return {
        analysisId,
        status: 'completed',
        cached: true,
      };
    }

    metricsService.recordCacheMiss();

    const job = {
      id: analysisId,
      userId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payload: normalizedPayload,
      contextResultId: normalizedPayload.contextResultId || null,
      result: null,
      error: null,
      cacheKey,
    };

    this.jobs.set(analysisId, job);
    this.pushHistory(userId, analysisId);

    setImmediate(() => {
      this.processJob(analysisId, contextResult).catch((error) => {
        // processJob already stores the error state
        console.error('Analysis worker failure:', error);
      });
    });

    return {
      analysisId,
      status: 'pending',
      cached: false,
    };
  }

  async processJob(jobId, contextResult) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'processing';
    job.updatedAt = new Date().toISOString();
    job.startedAt = Date.now();

    try {
      const pipelineResult = await aiOrchestrator.runPipeline({
        payload: job.payload,
        contextResult,
      });

      const latency = Math.max(1, Date.now() - job.startedAt);

      const result = {
        diagnosis: pipelineResult.diagnosis,
        confidence: pipelineResult.confidence,
        explanation: pipelineResult.explanation,
        structuredExplanation: pipelineResult.structuredExplanation || null,
        metadata: {
          latency,
          modelUsed: pipelineResult.metadata.modelUsed,
          visionModelUsed: pipelineResult.metadata.visionModelUsed,
          llmModelUsed: pipelineResult.metadata.llmModelUsed,
          cacheHit: false,
          processingStages: pipelineResult.metadata.processingStages || {
            total: latency,
          },
        },
        reasoningSteps: pipelineResult.reasoningSteps,
        heatmap: pipelineResult.heatmap,
        riskAssessment: pipelineResult.riskAssessment || null,
        language: pipelineResult.language,
        audienceMode: pipelineResult.audienceMode,
      };

      job.status = 'completed';
      job.result = result;
      job.updatedAt = new Date().toISOString();
      job.completedAt = new Date().toISOString();

      this.writeToCache(job.cacheKey, result);

      metricsService.recordCompleted({
        latencyMs: latency,
        confidence: result.confidence,
        modelUsed: result.metadata.modelUsed,
        mockAccuracy: pipelineResult.mockAccuracy,
      });
    } catch (error) {
      job.status = 'failed';
      job.error = error.message || 'Unknown analysis error';
      job.updatedAt = new Date().toISOString();
      job.completedAt = new Date().toISOString();
      metricsService.recordFailed();
    }
  }

  getResult(userId, analysisId) {
    const job = this.jobs.get(analysisId);

    if (!job || job.userId !== userId) {
      throw new Error('Analysis result not found');
    }

    if (job.status === 'failed') {
      return {
        analysisId,
        status: 'failed',
        error: job.error,
      };
    }

    if (job.status !== 'completed') {
      return {
        analysisId,
        status: job.status,
      };
    }

    return {
      analysisId,
      status: 'completed',
      ...job.result,
    };
  }

  getHistory(userId, limit = 10) {
    const ids = this.historyByUser.get(userId) || [];

    return ids
      .slice(0, Number(limit) || 10)
      .map((id) => this.jobs.get(id))
      .filter(Boolean)
      .map((job) => ({
        analysisId: job.id,
        status: job.status,
        createdAt: job.createdAt,
        diagnosis: job.result?.diagnosis || null,
        confidence: job.result?.confidence || null,
        language: job.result?.language || job.payload.language,
        audienceMode: job.result?.audienceMode || job.payload.audienceMode,
      }));
  }

  getMetrics() {
    return metricsService.getSnapshot();
  }

  normalizePayload(payload) {
    const safePayload = payload && typeof payload === 'object' ? payload : {};

    return {
      inputType: safePayload.inputType === 'image' ? 'image' : 'text',
      textInput: String(safePayload.textInput || '').trim(),
      reportSummary: String(safePayload.reportSummary || '').trim(),
      parameters: Array.isArray(safePayload.parameters) ? safePayload.parameters : [],
      imageMeta: safePayload.imageMeta || {},
      followUpQuestion: String(safePayload.followUpQuestion || '').trim(),
      contextResultId: safePayload.contextResultId ? String(safePayload.contextResultId) : null,
      language: String(safePayload.language || 'en').toLowerCase(),
      audienceMode: safePayload.audienceMode === 'doctor' ? 'doctor' : 'patient',
    };
  }

  resolveContext(userId, contextResultId) {
    if (!contextResultId) {
      return null;
    }

    const job = this.jobs.get(contextResultId);
    if (!job || job.userId !== userId || job.status !== 'completed') {
      return null;
    }

    return job.result;
  }

  buildCacheKey(payload, contextResult) {
    const fingerprint = {
      inputType: payload.inputType,
      textInput: payload.textInput.slice(0, 500),
      reportSummary: payload.reportSummary.slice(0, 500),
      parameters: payload.parameters.slice(0, 15),
      followUpQuestion: payload.followUpQuestion,
      language: payload.language,
      audienceMode: payload.audienceMode,
      contextDiagnosis: contextResult ? contextResult.diagnosis : null,
    };

    return crypto.createHash('sha256').update(JSON.stringify(fingerprint)).digest('hex');
  }

  readFromCache(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;

    if (cached.expiresAt <= Date.now()) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached.value;
  }

  writeToCache(cacheKey, value) {
    this.cache.set(cacheKey, {
      value,
      expiresAt: Date.now() + this.cacheTtlMs,
    });
  }

  pushHistory(userId, analysisId) {
    const history = this.historyByUser.get(userId) || [];
    history.unshift(analysisId);

    if (history.length > 40) {
      history.length = 40;
    }

    this.historyByUser.set(userId, history);
  }
}

module.exports = new AnalysisService();
