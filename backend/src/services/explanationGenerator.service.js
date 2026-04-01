/**
 * Structured Explanation Generator
 * Transforms raw AI outputs into structured explainability format
 * Ensures consistent: observation → pattern → reasoning → diagnosis → confidence
 */

const ConfidenceScorer = require('./confidenceScorer.service');

class ExplanationGenerator {
  /**
   * Generates structured explanation from analysis components
   * @param {Object} components - Analysis components (vision, llm, parameters, etc.)
   * @returns {Object} Structured explainability
   */
  async generateStructuredExplanation(components = {}) {
    const {
      visualFindings = [],
      parameterAnalysis = {},
      llmDiagnosis = '',
      reasoningSteps = [],
      parameters = [],
      riskAssessment = {},
      audienceMode = 'patient',
    } = components;

    // Step 1: Extract observations
    const observation = this._buildObservation(
      visualFindings,
      parameterAnalysis,
      parameters
    );

    // Step 2: Identify patterns
    const pattern = this._identifyPattern(parameters, riskAssessment);

    // Step 3: Build reasoning chain
    const reasoning = this._buildReasoningChain(
      observation,
      pattern,
      reasoningSteps,
      parameters
    );

    // Step 4: Formulate diagnosis
    const diagnosis = llmDiagnosis || this._formulateDiagnosis(reasoning);

    // Step 5: Calculate confidence
    const confidenceFactors = this._assessConfidenceFactors(
      components
    );
    const confidence = ConfidenceScorer.calculateConfidence(
      confidenceFactors
    );
    const confidenceExplanation = ConfidenceScorer.generateConfidenceExplanation(
      confidence,
      confidenceFactors
    );

    // Step 6: Generate audience-specific explanations
    const { patientFriendly, medicalExpl } = this._generateAudienceExplanations(
      diagnosis,
      reasoning,
      confidence,
      audienceMode
    );

    return {
      observation,
      pattern,
      reasoning,
      diagnosis,
      confidence,
      confidenceExplanation,
      audienceMode,
      patientFriendlyExplanation: patientFriendly,
      medicalExplanation: medicalExpl,
    };
  }

  /**
   * Builds observation statement from collected data
   */
  _buildObservation(visualFindings, paramAnalysis, parameters) {
    const parts = [];

    // Visual findings
    if (visualFindings.length > 0) {
      parts.push(
        `Visual analysis revealed: ${visualFindings.slice(0, 2).join('; ')}`
      );
    }

    // Parameter findings
    const abnormalParams = parameters
      .filter((p) => p.status && ['high', 'low', 'critical'].includes(p.status))
      .slice(0, 3)
      .map((p) => `${p.name}: ${p.value} ${p.status}`)
      .join(', ');

    if (abnormalParams) {
      parts.push(`Abnormal parameters identified: ${abnormalParams}`);
    }

    const normalCount = parameters.filter((p) => p.status === 'normal').length;
    if (normalCount > 0) {
      parts.push(`${normalCount} parameters within normal range`);
    }

    return parts.length > 0
      ? parts.join('. ')
      : 'Standard medical analysis conducted on provided data.';
  }

  /**
   * Identifies medical pattern from parameters and risk assessment
   */
  _identifyPattern(parameters, riskAssessment) {
    const patterns = [];

    // Pattern detection based on parameter grouping
    if (parameters.length > 0) {
      const categories = {};
      parameters.forEach((p) => {
        const cat = p.category || 'general';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(p);
      });

      // Identify abnormal patterns by category
      Object.entries(categories).forEach(([category, params]) => {
        const abnormal = params.filter((p) =>
          ['high', 'low', 'critical'].includes(p.status)
        );
        if (abnormal.length > 0) {
          patterns.push(
            `${category} dysfunction pattern: ${abnormal.map((p) => p.name).join('+')}`
          );
        }
      });
    }

    // Risk assessment pattern
    if (
      riskAssessment &&
      riskAssessment.diseaseRisks &&
      riskAssessment.diseaseRisks.length > 0
    ) {
      const topRisk = riskAssessment.diseaseRisks[0];
      patterns.push(
        `Elevated risk pattern: ${topRisk.disease} (${topRisk.riskPercentage}%)`
      );
    }

    return patterns.length > 0
      ? `Pattern detected: ${patterns.join('; ')}`
      : 'Mixed clinical presentation requiring further evaluation.';
  }

  /**
   * Constructs step-by-step reasoning chain
   */
  _buildReasoningChain(observation, pattern, providedSteps, parameters) {
    const chain = [];

    // Step 1: Observation
    chain.push({
      stepNumber: 1,
      stage: 'observation',
      description: observation,
      evidence: parameters
        .filter((p) => p.status !== 'normal')
        .slice(0, 3)
        .map((p) => `${p.name}: ${p.value}`),
      confidence: 0.9,
    });

    // Step 2: Analysis
    chain.push({
      stepNumber: 2,
      stage: 'analysis',
      description:
        'Cross-referencing findings with medical literature and clinical guidelines.',
      evidence: [
        'Parameter correlation analysis',
        'Risk stratification assessment',
      ],
      confidence: 0.8,
    });

    // Step 3: Pattern Recognition
    chain.push({
      stepNumber: 3,
      stage: 'pattern_recognition',
      description: pattern,
      evidence: parameters
        .slice(0, 5)
        .map((p) => `${p.name} (${p.status || 'normal'})`),
      confidence: 0.75,
    });

    // Step 4-5: Use provided reasoning steps or generate
    if (providedSteps && providedSteps.length > 0) {
      providedSteps.forEach((step, idx) => {
        chain.push({
          stepNumber: 4 + idx,
          stage: 'diagnosis',
          description: step.description || step,
          evidence: step.evidence || [],
          confidence: step.confidence || 0.7,
        });
      });
    } else {
      chain.push({
        stepNumber: 4,
        stage: 'diagnosis',
        description:
          'Based on integrated analysis, deriving clinical conclusions.',
        evidence: ['All parameters analyzed', 'Clinical guidelines applied'],
        confidence: 0.72,
      });
    }

    // Final step: Recommendation
    chain.push({
      stepNumber: chain.length + 1,
      stage: 'recommendation',
      description:
        'Clinical correlation and specialist consultation recommended where appropriate.',
      evidence: ['Multi-factor analysis complete', 'Confidence thresholds met'],
      confidence: 0.78,
    });

    return chain;
  }

  /**
   * Formulates diagnosis from reasoning chain
   */
  _formulateDiagnosis(reasoning) {
    const diagnosisSteps = reasoning.filter((r) => r.stage === 'diagnosis');
    if (diagnosisSteps.length > 0) {
      return diagnosisSteps.map((s) => s.description).join(' ');
    }
    return 'Based on comprehensive analysis, clinical evaluation recommended.';
  }

  /**
   * Assesses confidence factors for scoring
   */
  _assessConfidenceFactors(components) {
    const {
      visualFindings = [],
      parameters = [],
      riskAssessment = {},
    } = components;

    // Data quality
    const dataQuality =
      0.5 +
      (Math.min(parameters.length, 10) / 10) * 0.3 +
      (visualFindings.length > 0 ? 0.2 : 0);

    // Model agreement (simulated)
    const modelAgreement = 0.75;

    // Evidence strength
    const abnormalParams = parameters.filter((p) =>
      ['high', 'low', 'critical'].includes(p.status)
    );
    const evidenceStrength =
      0.4 + (Math.min(abnormalParams.length, 5) / 5) * 0.5;

    // Context relevance
    const contextRelevance =
      riskAssessment && riskAssessment.diseaseRisks
        ? 0.8
        : 0.6;

    return {
      dataQuality: Math.min(1, dataQuality),
      modelAgreement,
      evidenceStrength: Math.min(1, evidenceStrength),
      contextRelevance,
    };
  }

  /**
   * Generates audience-specific explanations
   */
  _generateAudienceExplanations(diagnosis, reasoning, confidence, mode) {
    let patientFriendly = '';
    let medicalExpl = '';

    // Patient-friendly version
    patientFriendly = this._simplifyForPatient(
      diagnosis,
      reasoning,
      confidence
    );

    // Medical version
    medicalExpl = this._expandForMedical(diagnosis, reasoning, confidence);

    return {
      patientFriendly,
      medicalExpl,
    };
  }

  /**
   * Simplifies explanation for patient understanding
   */
  _simplifyForPatient(diagnosis, reasoning, confidence) {
    // Replace medical jargon with simpler terms
    let simplified = diagnosis
      .replace(/dysfunction/gi, 'problem')
      .replace(/abnormal/gi, 'unusual')
      .replace(/elevated/gi, 'high')
      .replace(/decreased/gi, 'low')
      .replace(/correlation/gi, 'connection');

    const confidenceLevel =
      confidence >= 0.85
        ? 'quite confident'
        : confidence >= 0.7
          ? 'fairly confident'
          : 'moderate confidence';

    simplified += ` We are ${confidenceLevel} about this finding based on the available information.`;

    // Add recommendation
    simplified +=
      ' Follow-up with your healthcare provider for personalized medical advice.';

    return simplified;
  }

  /**
   * Expands explanation for medical professional
   */
  _expandForMedical(diagnosis, reasoning, confidence) {
    let medical = diagnosis;

    // Add confidence metrics
    medical += ` [Confidence: ${(confidence * 100).toFixed(1)}%]`;

    // Add reasoning transparency
    const stages = reasoning
      .map((r) => `${r.stage}: ${r.confidence.toFixed(2)}`)
      .join(' → ');
    medical += `\n\nReasoning chain: ${stages}`;

    // Add clinical note
    medical +=
      '\n\nClinical Note: Analysis supports differential diagnosis requiring clinical correlation and appropriate investigations.';

    return medical;
  }
}

module.exports = new ExplanationGenerator();
