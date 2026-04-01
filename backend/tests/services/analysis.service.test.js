const flushAsync = async () => {
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
};

describe('analysis.service', () => {
  let analysisService;
  let aiOrchestrator;
  let metricsService;

  beforeEach(() => {
    jest.resetModules();

    jest.doMock('../../src/orchestrator/ai.orchestrator', () => ({
      runPipeline: jest.fn(),
    }));

    jest.doMock('../../src/services/metrics.service', () => ({
      recordQueued: jest.fn(),
      recordCacheHit: jest.fn(),
      recordCacheMiss: jest.fn(),
      recordCompleted: jest.fn(),
      recordFailed: jest.fn(),
      getSnapshot: jest.fn(() => ({ analyses: 0 })),
    }));

    aiOrchestrator = require('../../src/orchestrator/ai.orchestrator');
    metricsService = require('../../src/services/metrics.service');
    analysisService = require('../../src/services/analysis.service');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a pending job and later stores completed structured result', async () => {
    aiOrchestrator.runPipeline.mockResolvedValue({
      diagnosis: 'Possible glycemic dysregulation',
      confidence: 0.81,
      explanation: {
        observation: 'obs',
        pattern: 'pat',
        reasoning: 'reas',
        conclusion: 'conc',
      },
      structuredExplanation: {
        observation: 'Observed elevated glucose',
        pattern: 'Metabolic pattern',
        reasoning: [
          {
            stepNumber: 1,
            stage: 'observation',
            description: 'Detected abnormal glucose',
            evidence: ['Glucose 245 mg/dL'],
            confidence: 0.9,
          },
        ],
        diagnosis: 'Diabetes risk pattern',
        confidence: 0.81,
        confidenceExplanation: 'Good confidence with supportive biomarkers',
      },
      metadata: {
        modelUsed: 'vision-mock-text-v1 -> gemini-1.5-flash',
        visionModelUsed: 'vision-mock-text-v1',
        llmModelUsed: 'gemini-1.5-flash',
        processingStages: { total: 120 },
      },
      reasoningSteps: [],
      heatmap: null,
      language: 'en',
      audienceMode: 'patient',
      mockAccuracy: 0.8,
    });

    const created = await analysisService.createAnalysisJob('user-1', {
      textInput: 'glucose high',
      language: 'en',
      audienceMode: 'patient',
    });

    expect(created.status).toBe('pending');
    expect(created.analysisId).toBeTruthy();

    await flushAsync();

    const result = analysisService.getResult('user-1', created.analysisId);
    expect(result.status).toBe('completed');
    expect(result.structuredExplanation).toBeTruthy();
    expect(result.structuredExplanation.observation).toContain('Observed elevated glucose');
    expect(result.metadata.modelUsed).toContain('gemini');
    expect(metricsService.recordCompleted).toHaveBeenCalled();
  });

  it('serves repeated identical request from cache', async () => {
    aiOrchestrator.runPipeline.mockResolvedValue({
      diagnosis: 'Stable findings',
      confidence: 0.7,
      explanation: {
        observation: 'obs',
        pattern: 'pat',
        reasoning: 'reas',
        conclusion: 'conc',
      },
      structuredExplanation: {
        observation: 'Observation',
        pattern: 'Pattern',
        reasoning: [],
        diagnosis: 'Diagnosis',
        confidence: 0.7,
        confidenceExplanation: 'Moderate confidence',
      },
      metadata: {
        modelUsed: 'vision-mock-text-v1 -> gemini-1.5-flash',
        processingStages: { total: 90 },
      },
      reasoningSteps: [],
      heatmap: null,
      language: 'en',
      audienceMode: 'patient',
      mockAccuracy: 0.75,
    });

    const payload = {
      textInput: 'same payload',
      language: 'en',
      audienceMode: 'patient',
    };

    const first = await analysisService.createAnalysisJob('user-2', payload);
    await flushAsync();

    const second = await analysisService.createAnalysisJob('user-2', payload);

    expect(first.status).toBe('pending');
    expect(second.status).toBe('completed');
    expect(second.cached).toBe(true);
    expect(metricsService.recordCacheHit).toHaveBeenCalled();
  });

  it('marks job as failed when orchestrator throws', async () => {
    aiOrchestrator.runPipeline.mockRejectedValue(new Error('pipeline unavailable'));

    const created = await analysisService.createAnalysisJob('user-3', {
      textInput: 'will fail',
    });

    await flushAsync();

    const result = analysisService.getResult('user-3', created.analysisId);
    expect(result.status).toBe('failed');
    expect(result.error).toContain('pipeline unavailable');
    expect(metricsService.recordFailed).toHaveBeenCalled();
  });
});
