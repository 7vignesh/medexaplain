const visionService = require('../services/vision.service');
const llmService = require('../services/llm.service');
const explanationService = require('../services/explanation.service');
const explanationGenerator = require('../services/explanationGenerator.service');
const confidenceScorer = require('../services/confidenceScorer.service');
const { withRetry } = require('../utils/retry');

/**
 * Orchestrator Pipeline (v2 - Enhanced)
 * Input -> Preprocessing -> Vision Model -> LLM -> Structured Explanation -> Post-processing
 * 
 * KEY IMPROVEMENTS:
 * - Structured explainability with observation → pattern → reasoning → diagnosis → confidence
 * - Confidence scoring with interpretable factors
 * - Standardized response format across all endpoints
 */
class AiOrchestrator {
  async runPipeline({ payload, contextResult = null }) {
    const startTime = Date.now();
    const preprocessedInput = this.preprocess(payload);

    // Stage 1: Vision Analysis
    const vision = await withRetry(
      async () => visionService.analyze({
        inputType: preprocessedInput.inputType,
        textInput: preprocessedInput.textBlob,
        imageMeta: preprocessedInput.imageMeta,
      }),
      {
        attempts: 3,
        baseDelayMs: 120,
      }
    );

    // Stage 2: LLM Inference
    const llmOutput = await withRetry(
      async () => llmService.infer({
        preprocessedInput,
        visualFindings: vision.visualFindings,
        audienceMode: preprocessedInput.audienceMode,
        contextResult,
        followUpQuestion: preprocessedInput.followUpQuestion,
      }),
      {
        attempts: 3,
        baseDelayMs: 180,
      }
    );

    // Stage 3: Legacy explanation service (maintained for compatibility)
    const legacyExplanation = await withRetry(
      async () => explanationService.buildExplanation({
        llmOutput,
        visualFindings: vision.visualFindings,
        preprocessedInput,
        language: preprocessedInput.language,
        audienceMode: preprocessedInput.audienceMode,
      }),
      {
        attempts: 2,
        baseDelayMs: 90,
      }
    );

    // Stage 4: NEW - Structured Explainability Generation
    const structuredExplanation = await explanationGenerator.generateStructuredExplanation({
      visualFindings: vision.visualFindings || [],
      parameterAnalysis: this._analyzeParameters(preprocessedInput.parameters),
      llmDiagnosis: llmOutput.diagnosis,
      reasoningSteps: llmOutput.reasoningSteps || [],
      parameters: preprocessedInput.parameters || [],
      riskAssessment: llmOutput.riskAssessment || {},
      audienceMode: preprocessedInput.audienceMode,
    });

    // Stage 5: Calculate latency and compile response
    const endTime = Date.now();
    const totalLatency = endTime - startTime;

    return {
      // Original response shape (for backward compatibility)
      diagnosis: llmOutput.diagnosis,
      confidence: structuredExplanation.confidence,
      explanation: legacyExplanation,
      metadata: {
        latency: totalLatency,
        modelUsed: `${vision.modelUsed} -> ${llmOutput.modelUsed}`,
        visionModelUsed: vision.modelUsed,
        llmModelUsed: llmOutput.modelUsed,
        cacheHit: llmOutput.cacheHit || false,
        processingStages: {
          vision: llmOutput.visionLatency || 0,
          llm: llmOutput.llmLatency || 0,
          explanation: 0,
          total: totalLatency,
        },
      },
      reasoningSteps: llmOutput.reasoningSteps,
      heatmap: vision.heatmap,
      language: preprocessedInput.language,
      audienceMode: preprocessedInput.audienceMode,
      mockAccuracy: llmOutput.mockAccuracy,

      // NEW - Structured Explainability (Primary response format)
      structuredExplanation: {
        observation: structuredExplanation.observation,
        pattern: structuredExplanation.pattern,
        reasoning: structuredExplanation.reasoning,
        diagnosis: structuredExplanation.diagnosis,
        confidence: structuredExplanation.confidence,
        confidenceExplanation: structuredExplanation.confidenceExplanation,
        patientFriendlyExplanation: structuredExplanation.patientFriendlyExplanation,
        medicalExplanation: structuredExplanation.medicalExplanation,
      },

      // Risk assessment (from LLM)
      riskAssessment: llmOutput.riskAssessment,
    };
  }

  /**
   * Analyzes parameters for explainability context
   */
  _analyzeParameters(parameters = []) {
    const abnormalParams = parameters.filter((p) =>
      ['high', 'low', 'critical'].includes(p.status)
    );

    return {
      total: parameters.length,
      abnormal: abnormalParams.length,
      critical: parameters.filter((p) => p.status === 'critical').length,
      list: abnormalParams.slice(0, 5),
    };
  }

  preprocess(payload) {
    const parameters = Array.isArray(payload.parameters) ? payload.parameters.slice(0, 25) : [];
    const textInput = String(payload.textInput || '').trim();
    const reportSummary = String(payload.reportSummary || '').trim();

    const parameterSignals = parameters.map((parameter) => {
      const name = parameter.name || 'unknown';
      const value = parameter.value || 'N/A';
      const status = parameter.status || 'normal';
      return `${name}: ${value} (${status})`;
    });

    const keySignals = parameters
      .filter((parameter) => parameter.status && parameter.status !== 'normal')
      .map((parameter) => `${parameter.name} is ${parameter.status}`);

    const abnormalCount = parameters.filter((parameter) => parameter.status && parameter.status !== 'normal').length;
    const criticalCount = parameters.filter((parameter) => parameter.status === 'critical').length;

    const textBlob = [textInput, reportSummary, ...parameterSignals].filter(Boolean).join(' | ').slice(0, 6000);

    return {
      inputType: payload.inputType === 'image' ? 'image' : 'text',
      audienceMode: payload.audienceMode === 'doctor' ? 'doctor' : 'patient',
      language: String(payload.language || 'en').toLowerCase(),
      followUpQuestion: String(payload.followUpQuestion || '').trim(),
      imageMeta: payload.imageMeta || {},
      parameters,
      keySignals,
      abnormalCount,
      criticalCount,
      textBlob,
    };
  }
}

module.exports = new AiOrchestrator();
