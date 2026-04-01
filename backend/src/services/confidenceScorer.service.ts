/**
 * Confidence Scoring Service (TypeScript)
 * Calculates confidence scores based on multiple factors with full type safety
 */

import type { ConfidenceFactors } from '../types/explainability.types';

class ConfidenceScorer {
  /**
   * Calculates overall confidence (0-1) based on multiple factors
   * Weighting approach ensures interpretability
   *
   * @param factors - Individual confidence factors
   * @returns Weighted confidence score (0-1)
   */
  calculateConfidence(factors: Partial<ConfidenceFactors> = {}): number {
    const {
      dataQuality = 0.7,
      modelAgreement = 0.75,
      evidenceStrength = 0.8,
      contextRelevance = 0.7,
      weights = {
        dataQuality: 0.25,
        modelAgreement: 0.25,
        evidenceStrength: 0.35,
        contextRelevance: 0.15,
      },
    } = factors;

    // Ensure weights sum to 1.0
    const totalWeight =
      weights.dataQuality +
      weights.modelAgreement +
      weights.evidenceStrength +
      weights.contextRelevance;

    const normalizedWeights = {
      dataQuality: weights.dataQuality / totalWeight,
      modelAgreement: weights.modelAgreement / totalWeight,
      evidenceStrength: weights.evidenceStrength / totalWeight,
      contextRelevance: weights.contextRelevance / totalWeight,
    };

    // Weighted sum
    const confidence =
      dataQuality * normalizedWeights.dataQuality +
      modelAgreement * normalizedWeights.modelAgreement +
      evidenceStrength * normalizedWeights.evidenceStrength +
      contextRelevance * normalizedWeights.contextRelevance;

    // Clamp to [0, 1]
    return Math.min(1.0, Math.max(0.0, confidence));
  }

  /**
   * Assesses data quality based on input completeness and clarity
   * @param input - Analyzed input
   * @returns Quality score (0-1)
   */
  assessDataQuality(input: {
    text?: string;
    parameters?: Record<string, any>[];
    imageQuality?: number;
    textLength?: number;
  } = {}): number {
    const {
      text = '',
      parameters = [],
      imageQuality = 1.0,
      textLength = 0,
    } = input;

    let score = 0;

    // Text completeness (max 0.4)
    const txtLen = text ? text.length : textLength;
    if (txtLen > 500) score += 0.4;
    else if (txtLen > 200) score += 0.3;
    else if (txtLen > 0) score += 0.15;

    // Parameter availability (max 0.35)
    if (parameters.length > 10) score += 0.35;
    else if (parameters.length > 5) score += 0.25;
    else if (parameters.length > 0) score += 0.15;

    // Image quality (max 0.25)
    score += imageQuality * 0.25;

    return Math.min(1.0, score);
  }

  /**
   * Estimates model agreement by comparing LLM outputs
   * Simulated: in production, would run multiple models
   * @param responses - Array of model responses
   * @returns Agreement score (0-1)
   */
  assessModelAgreement(responses: string[] = []): number {
    if (responses.length < 2) {
      return 0.75; // Default confidence if only one model
    }

    // Simple similarity metric based on keyword overlap
    const keywords = responses
      .flatMap((r) => r.toLowerCase().split(/\s+/))
      .filter((w) => w.length > 3);

    const keywordCounts: Record<string, number> = {};
    keywords.forEach((kw) => {
      keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
    });

    // Keywords appearing in multiple responses indicate agreement
    const commonKeywords = Object.values(keywordCounts).filter(
      (count) => count > 1
    ).length;
    const agreement = Math.min(1.0, commonKeywords / Math.max(1, keywords.length * 0.3));

    return agreement;
  }

  /**
   * Assesses strength of supporting evidence
   * @param evidenceItems - Array of evidence pieces
   * @returns Evidence strength (0-1)
   */
  assessEvidenceStrength(evidenceItems: string[] = []): number {
    if (evidenceItems.length === 0) {
      return 0.4; // Low confidence without evidence
    }

    // More evidence = higher confidence (with diminishing returns)
    const evidenceCount = Math.min(evidenceItems.length, 10) / 10;

    // Evidence quality factors (simplified)
    let quality = 0;
    evidenceItems.forEach((item) => {
      // Check if evidence contains specific medical terms (higher quality)
      if (
        typeof item === 'string' &&
        /abnormal|elevated|decreased|present|absent/.test(item.toLowerCase())
      ) {
        quality += 0.1;
      }
    });

    quality = Math.min(1.0, quality);

    // Combined score
    return evidenceCount * 0.6 + quality * 0.4;
  }

  /**
   * Assesses contextual relevance of analysis
   * @param context - Analysis context
   * @returns Relevance score (0-1)
   */
  assessContextRelevance(context: {
    hasPatientHistory?: boolean;
    parameterConsistency?: number;
    timelinessRelevance?: number;
  } = {}): number {
    const {
      hasPatientHistory = false,
      parameterConsistency = 0.7,
      timelinessRelevance = 1.0,
    } = context;

    let score = 0;

    // Patient history improves relevance
    if (hasPatientHistory) score += 0.3;
    else score += 0.15;

    // Parameter consistency
    score += parameterConsistency * 0.4;

    // Timeliness
    score += timelinessRelevance * 0.35;

    return Math.min(1.0, score);
  }

  /**
   * Generates confidence explanation string
   * Helps users understand the confidence level
   */
  generateConfidenceExplanation(
    confidence: number = 0,
    factors: Partial<ConfidenceFactors> = {}
  ): string {
    let explanation = '';

    if (confidence >= 0.85) {
      explanation =
        'High confidence: Analysis based on clear evidence with strong supporting data.';
    } else if (confidence >= 0.7) {
      explanation =
        'Good confidence: Analysis supported by available evidence with minor uncertainty.';
    } else if (confidence >= 0.55) {
      explanation =
        'Moderate confidence: Analysis reasonable but limited by data availability or ambiguity.';
    } else if (confidence >= 0.4) {
      explanation =
        'Low confidence: Analysis based on limited evidence; clinical correlation recommended.';
    } else {
      explanation =
        'Very low confidence: Insufficient data for reliable analysis; additional information needed.';
    }

    // Add factor-specific notes
    const notes: string[] = [];

    if (factors.dataQuality && factors.dataQuality < 0.5) {
      notes.push('Limited input data quality');
    }

    if (factors.modelAgreement && factors.modelAgreement < 0.6) {
      notes.push('Multiple analysis perspectives differ slightly');
    }

    if (factors.evidenceStrength && factors.evidenceStrength < 0.6) {
      notes.push('Supporting evidence is limited');
    }

    if (notes.length > 0) {
      explanation += ` Note: ${notes.join('; ')}`;
    }

    return explanation;
  }

  /**
   * Batch confidence calculation helper
   */
  calculateBatchConfidence(parametersList: Record<string, any>[] = []) {
    const scores = parametersList.map((param) => {
      const factors = {
        dataQuality: this.assessDataQuality({
          text: param.value,
          parameters: [param],
        }),
        modelAgreement: 0.75,
        evidenceStrength: param.normalRange ? 0.8 : 0.6,
        contextRelevance: 0.7,
      };

      return {
        parameter: param.name,
        confidence: this.calculateConfidence(factors),
      };
    });

    const avgConfidence =
      scores.length > 0
        ? scores.reduce((sum, s) => sum + s.confidence, 0) / scores.length
        : 0;

    return {
      individual: scores,
      average: avgConfidence,
    };
  }
}

export default new ConfidenceScorer();
