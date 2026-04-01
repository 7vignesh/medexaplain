/**
 * Model Comparison Service (TypeScript)
 * Enables analysis by multiple AI models and comparison of outcomes
 * Useful for validation, consensus building, and explanation confidence
 */

type ModelProvider = 'openai' | 'gemini' | 'openrouter' | 'anthropic';

interface ModelConfig {
  name: string;
  provider: ModelProvider;
  model: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  costPer1kInputTokens: number;
  costPer1kOutputTokens: number;
}

interface ModelAnalysisResult {
  modelName: string;
  provider: ModelProvider;
  diagnosis: string;
  confidence: number;
  confidenceFactors: {
    dataQuality: number;
    modelAgreement: number;
    evidenceStrength: number;
    contextRelevance: number;
  };
  reasoningSteps: string[];
  recommendations: string[];
  processingTimeMs: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  metadata: Record<string, any>;
}

interface ComparisonResult {
  modelResults: ModelAnalysisResult[];
  consensusDiagnosis: string;
  confidenceUnderConsensus: number;
  disagreementRegions: string[];
  recommendedModel: string;
  consistencyScore: number;
  analysisMetrics: {
    totalProcessingTime: number;
    totalCost: number;
    averageConfidence: number;
    modelAgreementPercentage: number;
    unanimousAgreement: boolean;
  };
}

interface ModelPerformanceMetrics {
  modelName: string;
  averageConfidence: number;
  averageProcessingTime: number;
  totalAnalyses: number;
  successRate: number;
  averageCost: number;
  consistencyScore: number;
  recommendationFrequency: number;
}

const defaultModels: ModelConfig[] = [
  {
    name: 'GPT-4 Vision',
    provider: 'openai',
    model: 'gpt-4-vision-preview',
    temperature: 0.3,
    topP: 0.9,
    maxTokens: 2000,
    costPer1kInputTokens: 0.01,
    costPer1kOutputTokens: 0.03,
  },
  {
    name: 'Gemini Pro Vision',
    provider: 'gemini',
    model: 'gemini-pro-vision',
    temperature: 0.2,
    topP: 0.95,
    maxTokens: 2048,
    costPer1kInputTokens: 0.005,
    costPer1kOutputTokens: 0.015,
  },
  {
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
    temperature: 0.2,
    topP: 0.9,
    maxTokens: 2000,
    costPer1kInputTokens: 0.015,
    costPer1kOutputTokens: 0.075,
  },
];

class ModelComparisonService {
  private modelConfigs: ModelConfig[] = [...defaultModels];
  private performanceMetrics: Map<string, ModelPerformanceMetrics> = new Map();
  private comparisonHistory: ComparisonResult[] = [];

  /**
   * Analyzes medical report with multiple AI models
   */
  async analyzeWithMultipleModels(
    reportData: {
      textInput?: string;
      imageData?: string;
      parameters: Record<string, number>;
      patientHistory?: string;
    },
    selectedModels?: string[]
  ): Promise<ComparisonResult> {
    const modelsToUse =
      selectedModels && selectedModels.length > 0
        ? this.modelConfigs.filter((m) => selectedModels.includes(m.name))
        : this.modelConfigs;

    const results: ModelAnalysisResult[] = [];

    // Mock parallel analysis (in production, would call actual APIs)
    for (const model of modelsToUse) {
      const result = await this._analyzeWithModel(model, reportData);
      results.push(result);
    }

    // Compile comparison
    const comparison = this._compileComparison(results);
    this.comparisonHistory.push(comparison);

    return comparison;
  }

  /**
   * Mock model analysis
   */
  private async _analyzeWithModel(
    model: ModelConfig,
    reportData: any
  ): Promise<ModelAnalysisResult> {
    const startTime = Date.now();

    // Mock analysis with model-specific variations
    const baseConfidence = 0.65 + Math.random() * 0.3;
    const inputTokens = 1200 + Math.random() * 400;
    const outputTokens = 800 + Math.random() * 300;

    // Model-specific adjustments
    let confidenceAdjustment = 0;
    if (model.provider === 'openai') confidenceAdjustment = 0.05;
    else if (model.provider === 'gemini') confidenceAdjustment = -0.02;
    else if (model.provider === 'anthropic') confidenceAdjustment = 0.08;

    const finalConfidence = Math.min(1, Math.max(0, baseConfidence + confidenceAdjustment));

    const cost =
      (inputTokens * model.costPer1kInputTokens) / 1000 +
      (outputTokens * model.costPer1kOutputTokens) / 1000;

    const processingTime = 1200 + Math.random() * 800;

    return {
      modelName: model.name,
      provider: model.provider,
      diagnosis: this._generateMockDiagnosis(reportData, model.provider),
      confidence: finalConfidence,
      confidenceFactors: {
        dataQuality: 0.7 + Math.random() * 0.25,
        modelAgreement: 0.65 + Math.random() * 0.3,
        evidenceStrength: 0.68 + Math.random() * 0.28,
        contextRelevance: 0.72 + Math.random() * 0.25,
      },
      reasoningSteps: [
        `Examined parameters: ${Object.keys(reportData.parameters).join(', ')}`,
        'Analyzed relationship between abnormal parameters',
        'Considered clinical context and patient history',
        'Cross-referenced with diagnostic guidelines',
        'Generated differential diagnoses',
        'Ranked by confidence and evidence',
      ],
      recommendations: [
        `Recommend ${model.provider} for detailed analysis`,
        'Suggest additional testing if available',
        'Monitor trends over time',
        'Follow-up appointment recommended',
      ],
      processingTimeMs: processingTime,
      inputTokens: Math.round(inputTokens),
      outputTokens: Math.round(outputTokens),
      cost: cost,
      metadata: {
        temperature: model.temperature,
        topP: model.topP,
        version: model.model,
        timestamp: new Date(),
      },
    };
  }

  /**
   * Generates mock diagnosis based on parameters
   */
  private _generateMockDiagnosis(reportData: any, provider: string): string {
    const diagnoses = {
      openai: 'Elevated glucose levels indicate possible pre-diabetic state with recommendation for monitoring and lifestyle changes.',
      gemini: 'Blood glucose elevation detected. Consider screening for diabetes mellitus type II. Monitor HbA1c levels.',
      anthropic: 'Clinical findings suggest metabolic disorder. Recommend endocrinology consultation and glucose tolerance test.',
    };

    return (
      (diagnoses[provider as keyof typeof diagnoses] || diagnoses.openai) +
      ` Analysis based on ${Object.keys(reportData.parameters).length} parameters.`
    );
  }

  /**
   * Compiles comparison from multiple model results
   */
  private _compileComparison(results: ModelAnalysisResult[]): ComparisonResult {
    const confidences = results.map((r) => r.confidence);
    const avgConfidence = confidences.reduce((a, b) => a + b) / confidences.length;

    // Check for consensus
    const consensusConfidence = Math.max(...confidences);
    const topModel = results.find((r) => r.confidence === consensusConfidence);
    const consensusDiagnosis = topModel?.diagnosis || 'Unable to determine consensus';

    // Calculate disagrement
    const disagreements = this._identifyDisagreements(results);

    // Model agreement percentage
    const modelAgreementPercentage = this._calculateModelAgreement(results);

    // consistency score
    const consistencyScore = this._calculateConsistencyScore(results);

    // Recommend best model
    const recommendedModel = results.reduce((prev, current) =>
      current.confidence > prev.confidence ? current : prev
    ).modelName;

    // Update performance metrics
    this._updatePerformanceMetrics(results);

    return {
      modelResults: results,
      consensusDiagnosis,
      confidenceUnderConsensus: consensusConfidence,
      disagreementRegions: disagreements,
      recommendedModel,
      consistencyScore,
      analysisMetrics: {
        totalProcessingTime: results.reduce((sum, r) => sum + r.processingTimeMs, 0),
        totalCost: results.reduce((sum, r) => sum + r.cost, 0),
        averageConfidence: avgConfidence,
        modelAgreementPercentage,
        unanimousAgreement: this._checkUnanimousAgreement(results),
      },
    };
  }

  /**
   * Identifies disagreement regions between models
   */
  private _identifyDisagreements(results: ModelAnalysisResult[]): string[] {
    const disagreements: string[] = [];

    // Check confidence spread
    const confScores = results.map((r) => r.confidence);
    const confSpread = Math.max(...confScores) - Math.min(...confScores);
    if (confSpread > 0.2) {
      disagreements.push(
        `Significant confidence variation: ${(confSpread * 100).toFixed(1)}% difference`
      );
    }

    // Check diagnosis text similarity
    const diagnoses = results.map((r) => r.diagnosis);
    const uniqueDiagnoses = new Set(diagnoses);
    if (uniqueDiagnoses.size > 1) {
      disagreements.push(`${uniqueDiagnoses.size} different diagnoses provided`);
    }

    // Check confidence factor agreement
    const avgDataQuality =
      results.reduce((sum, r) => sum + r.confidenceFactors.dataQuality, 0) / results.length;
    const dataQualityVariance = results
      .map((r) => Math.pow(r.confidenceFactors.dataQuality - avgDataQuality, 2))
      .reduce((a, b) => a + b) / results.length;
    if (Math.sqrt(dataQualityVariance) > 0.15) {
      disagreements.push('Data quality assessment varies across models');
    }

    return disagreements;
  }

  /**
   * Calculates model agreement percentage
   */
  private _calculateModelAgreement(results: ModelAnalysisResult[]): number {
    if (results.length < 2) return 100;

    // Check if all models within 10% confidence
    const confScores = results.map((r) => r.confidence);
    const maxConf = Math.max(...confScores);
    const minConf = Math.min(...confScores);
    const spread = maxConf - minConf;

    // Agreement: 100% if spread < 5%, decreases as spread increases
    return Math.max(0, 100 - spread * 500);
  }

  /**
   * Calculates consistency score across models
   */
  private _calculateConsistencyScore(results: ModelAnalysisResult[]): number {
    if (results.length < 2) return 1;

    let score = 0;

    // Confidence consistency (40%)
    const confScores = results.map((r) => r.confidence);
    const avgConf = confScores.reduce((a, b) => a + b) / confScores.length;
    const confVariance = confScores
      .map((c) => Math.pow(c - avgConf, 2))
      .reduce((a, b) => a + b) / confScores.length;
    const confConsistency = Math.max(0, 1 - confVariance * 2);
    score += confConsistency * 0.4;

    // Factor consistency (30%)
    const factors = ['dataQuality', 'modelAgreement', 'evidenceStrength', 'contextRelevance'] as const;
    let factorConsistency = 0;
    factors.forEach((factor) => {
      const factorScores = results.map((r) => r.confidenceFactors[factor]);
      const avgFactor = factorScores.reduce((a, b) => a + b) / factorScores.length;
      const variance = factorScores
        .map((f) => Math.pow(f - avgFactor, 2))
        .reduce((a, b) => a + b) / factorScores.length;
      factorConsistency += Math.max(0, 1 - variance);
    });
    score += (factorConsistency / factors.length) * 0.3;

    // Diagnosis similarity (20%)
    const diagnoses = results.map((r) => r.diagnosis);
    const uniqueDiagnoses = new Set(diagnoses);
    const diagConsistency = 1 - (uniqueDiagnoses.size - 1) / results.length;
    score += diagConsistency * 0.2;

    // Processing consistency (10%)
    const times = results.map((r) => r.processingTimeMs);
    const avgTime = times.reduce((a, b) => a + b) / times.length;
    const timeVariance = times
      .map((t) => Math.pow(t - avgTime, 2))
      .reduce((a, b) => a + b) / times.length;
    const timeConsistency = Math.max(0, 1 - timeVariance / (avgTime * avgTime));
    score += timeConsistency * 0.1;

    return Math.min(1, Math.max(0, score));
  }

  /**
   * Checks if all models agree on key metrics
   */
  private _checkUnanimousAgreement(results: ModelAnalysisResult[]): boolean {
    if (results.length < 2) return true;

    const confScores = results.map((r) => r.confidence);
    const maxConf = Math.max(...confScores);
    const minConf = Math.min(...confScores);

    return maxConf - minConf < 0.05; // within 5%
  }

  /**
   * Updates performance metrics for each model
   */
  private _updatePerformanceMetrics(results: ModelAnalysisResult[]): void {
    results.forEach((result) => {
      const existing = this.performanceMetrics.get(result.modelName) || {
        modelName: result.modelName,
        averageConfidence: 0,
        averageProcessingTime: 0,
        totalAnalyses: 0,
        successRate: 100,
        averageCost: 0,
        consistencyScore: 0,
        recommendationFrequency: 0,
      };

      existing.totalAnalyses += 1;
      existing.averageConfidence =
        (existing.averageConfidence * (existing.totalAnalyses - 1) + result.confidence) /
        existing.totalAnalyses;
      existing.averageProcessingTime =
        (existing.averageProcessingTime * (existing.totalAnalyses - 1) + result.processingTimeMs) /
        existing.totalAnalyses;
      existing.averageCost =
        (existing.averageCost * (existing.totalAnalyses - 1) + result.cost) /
        existing.totalAnalyses;

      this.performanceMetrics.set(result.modelName, existing);
    });
  }

  /**
   * Gets performance comparison across all models
   */
  getPerformanceComparison(): ModelPerformanceMetrics[] {
    return Array.from(this.performanceMetrics.values()).sort(
      (a, b) => b.averageConfidence - a.averageConfidence
    );
  }

  /**
   * Gets comparison history for historical analysis
   */
  getComparisonHistory(limit: number = 10): ComparisonResult[] {
    return this.comparisonHistory.slice(-limit).reverse();
  }

  /**
   * Recommends optimal model based on use case
   */
  recommendModel(useCase: 'speed' | 'accuracy' | 'cost' | 'balanced'): string {
    const metrics = this.getPerformanceComparison();

    if (metrics.length === 0) return this.modelConfigs[0].name;

    switch (useCase) {
      case 'speed':
        return metrics.reduce((prev, current) =>
          current.averageProcessingTime < prev.averageProcessingTime ? current : prev
        ).modelName;

      case 'accuracy':
        return metrics.reduce((prev, current) =>
          current.averageConfidence > prev.averageConfidence ? current : prev
        ).modelName;

      case 'cost':
        return metrics.reduce((prev, current) =>
          current.averageCost < prev.averageCost ? current : prev
        ).modelName;

      case 'balanced':
      default:
        // Score: 40% accuracy, 30% cost, 30% speed
        const scored = metrics.map((m) => ({
          name: m.modelName,
          score:
            m.averageConfidence * 0.4 -
            (m.averageCost / Math.max(...metrics.map((x) => x.averageCost))) * 0.3 -
            (m.averageProcessingTime /
              Math.max(...metrics.map((x) => x.averageProcessingTime))) *
              0.3,
        }));
        return scored.sort((a, b) => b.score - a.score)[0].name;
    }
  }

  /**
   * Gets available models
   */
  getAvailableModels(): ModelConfig[] {
    return this.modelConfigs;
  }

  /**
   * Adds custom model configuration
   */
  addModelConfig(config: ModelConfig): void {
    this.modelConfigs.push(config);
  }

  /**
   * Exports comparison as report
   */
  exportComparisonReport(comparison: ComparisonResult): string {
    let report = '';
    report += `=== MODEL COMPARISON REPORT ===\n\n`;

    report += `CONSENSUS DIAGNOSIS:\n${comparison.consensusDiagnosis}\n`;
    report += `Consensus Confidence: ${(comparison.confidenceUnderConsensus * 100).toFixed(1)}%\n`;
    report += `Recommended Model: ${comparison.recommendedModel}\n\n`;

    report += `MODEL RESULTS:\n`;
    comparison.modelResults.forEach((result) => {
      report += `\n${result.modelName} (${result.provider})\n`;
      report += `  Confidence: ${(result.confidence * 100).toFixed(1)}%\n`;
      report += `  Processing Time: ${result.processingTimeMs.toFixed(0)}ms\n`;
      report += `  Cost: $${result.cost.toFixed(4)}\n`;
      report += `  Diagnosis: ${result.diagnosis}\n`;
    });

    if (comparison.disagreementRegions.length > 0) {
      report += `\nDISAGREEMENTS:\n`;
      comparison.disagreementRegions.forEach((d) => {
        report += `  - ${d}\n`;
      });
    }

    report += `\nMETRICS:\n`;
    report += `  Total Processing Time: ${comparison.analysisMetrics.totalProcessingTime.toFixed(0)}ms\n`;
    report += `  Total Cost: $${comparison.analysisMetrics.totalCost.toFixed(4)}\n`;
    report += `  Average Confidence: ${(comparison.analysisMetrics.averageConfidence * 100).toFixed(1)}%\n`;
    report += `  Model Agreement: ${comparison.analysisMetrics.modelAgreementPercentage.toFixed(1)}%\n`;
    report += `  Unanimous Agreement: ${comparison.analysisMetrics.unanimousAgreement ? 'Yes' : 'No'}\n`;

    return report;
  }
}

export default new ModelComparisonService();
