/**
 * Response Format Validator Service (TypeScript)
 * Ensures all API responses conform to standardized structure
 * Provides validation, sanitization, and error handling
 */

import type { AnalysisResponse, ExplainabilityCore } from '../types/explainability.types';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data?: any;
}

class ResponseValidator {
  /**
   * Validates complete analysis response format
   */
  validateAnalysisResponse(response: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required top-level fields
    if (typeof response.diagnosis !== 'string' || !response.diagnosis.trim()) {
      errors.push('diagnosis: must be a non-empty string');
    }

    if (typeof response.confidence !== 'number' || response.confidence < 0 || response.confidence > 1) {
      errors.push('confidence: must be a number between 0 and 1');
    }

    // Structured explanation validation
    if (response.structuredExplanation) {
      const exErrors = this._validateStructuredExplanation(response.structuredExplanation);
      errors.push(...exErrors);
    } else {
      warnings.push('structuredExplanation: missing (optional but recommended)');
    }

    // Metadata validation
    if (response.metadata) {
      const metaErrors = this._validateMetadata(response.metadata);
      errors.push(...metaErrors);
    } else {
      errors.push('metadata: required field missing');
    }

    // Optional validations
    if (response.heatmap) {
      const heatmapErrors = this._validateHeatmap(response.heatmap);
      errors.push(...heatmapErrors);
    }

    if (response.riskAssessment) {
      const riskErrors = this._validateRiskAssessment(response.riskAssessment);
      errors.push(...riskErrors);
    }

    // Backward compatibility check
    if (!response.explanation && !response.structuredExplanation) {
      warnings.push('Neither explanation nor structuredExplanation present');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      data: errors.length === 0 ? response : null,
    };
  }

  /**
   * Validates structured explanation format
   */
  private _validateStructuredExplanation(explanation: any): string[] {
    const errors: string[] = [];

    // Required fields
    const required = ['observation', 'pattern', 'reasoning', 'diagnosis', 'confidence', 'confidenceExplanation'];
    required.forEach(field => {
      if (!(field in explanation)) {
        errors.push(`structuredExplanation.${field}: required field missing`);
      }
    });

    // Field type validations
    if (typeof explanation.observation !== 'string' || !explanation.observation.trim()) {
      errors.push('structuredExplanation.observation: must be a non-empty string');
    }

    if (typeof explanation.pattern !== 'string' || !explanation.pattern.trim()) {
      errors.push('structuredExplanation.pattern: must be a non-empty string');
    }

    if (!Array.isArray(explanation.reasoning)) {
      errors.push('structuredExplanation.reasoning: must be an array');
    } else {
      explanation.reasoning.forEach((step: any, idx: number) => {
        const stepErrors = this._validateReasoningStep(step, idx);
        errors.push(...stepErrors);
      });
    }

    if (typeof explanation.diagnosis !== 'string' || !explanation.diagnosis.trim()) {
      errors.push('structuredExplanation.diagnosis: must be a non-empty string');
    }

    if (typeof explanation.confidence !== 'number' || explanation.confidence < 0 || explanation.confidence > 1) {
      errors.push('structuredExplanation.confidence: must be a number between 0 and 1');
    }

    if (typeof explanation.confidenceExplanation !== 'string' || !explanation.confidenceExplanation.trim()) {
      errors.push('structuredExplanation.confidenceExplanation: must be a non-empty string');
    }

    // Optional audience-specific explanations
    if (explanation.patientFriendlyExplanation && typeof explanation.patientFriendlyExplanation !== 'string') {
      errors.push('structuredExplanation.patientFriendlyExplanation: must be a string');
    }

    if (explanation.medicalExplanation && typeof explanation.medicalExplanation !== 'string') {
      errors.push('structuredExplanation.medicalExplanation: must be a string');
    }

    return errors;
  }

  /**
   * Validates individual reasoning step
   */
  private _validateReasoningStep(step: any, index: number): string[] {
    const errors: string[] = [];
    const prefix = `structuredExplanation.reasoning[${index}]`;

    if (typeof step.stepNumber !== 'number' || step.stepNumber < 1) {
      errors.push(`${prefix}.stepNumber: must be a positive number`);
    }

    const validStages = ['observation', 'analysis', 'pattern_recognition', 'diagnosis', 'recommendation'];
    if (!validStages.includes(step.stage)) {
      errors.push(`${prefix}.stage: must be one of ${validStages.join(', ')}`);
    }

    if (typeof step.description !== 'string' || !step.description.trim()) {
      errors.push(`${prefix}.description: must be a non-empty string`);
    }

    if (!Array.isArray(step.evidence)) {
      errors.push(`${prefix}.evidence: must be an array`);
    } else if (!step.evidence.every((e: any) => typeof e === 'string')) {
      errors.push(`${prefix}.evidence: all elements must be strings`);
    }

    if (typeof step.confidence !== 'undefined') {
      if (typeof step.confidence !== 'number' || step.confidence < 0 || step.confidence > 1) {
        errors.push(`${prefix}.confidence: must be a number between 0 and 1`);
      }
    }

    return errors;
  }

  /**
   * Validates metadata format
   */
  private _validateMetadata(metadata: any): string[] {
    const errors: string[] = [];

    if (typeof metadata.latency !== 'number' || metadata.latency < 0) {
      errors.push('metadata.latency: must be a non-negative number');
    }

    if (typeof metadata.modelUsed !== 'string' || !metadata.modelUsed.trim()) {
      errors.push('metadata.modelUsed: must be a non-empty string');
    }

    if (typeof metadata.cacheHit !== 'boolean') {
      errors.push('metadata.cacheHit: must be a boolean');
    }

    if (metadata.processingStages) {
      if (typeof metadata.processingStages.total !== 'number' || metadata.processingStages.total < 0) {
        errors.push('metadata.processingStages.total: must be a non-negative number');
      }
    }

    return errors;
  }

  /**
   * Validates heatmap format
   */
  private _validateHeatmap(heatmap: any): string[] {
    const errors: string[] = [];

    if (typeof heatmap.width !== 'number' || heatmap.width <= 0) {
      errors.push('heatmap.width: must be a positive number');
    }

    if (typeof heatmap.height !== 'number' || heatmap.height <= 0) {
      errors.push('heatmap.height: must be a positive number');
    }

    if (!Array.isArray(heatmap.regions)) {
      errors.push('heatmap.regions: must be an array');
    } else {
      heatmap.regions.forEach((region: any, idx: number) => {
        const regionErrors = this._validateHeatmapRegion(region, idx);
        errors.push(...regionErrors);
      });
    }

    return errors;
  }

  /**
   * Validates individual heatmap region
   */
  private _validateHeatmapRegion(region: any, index: number): string[] {
    const errors: string[] = [];
    const prefix = `heatmap.regions[${index}]`;

    const numericFields = ['x', 'y', 'w', 'h'];
    numericFields.forEach(field => {
      if (typeof region[field] !== 'number' || region[field] < 0) {
        errors.push(`${prefix}.${field}: must be a non-negative number`);
      }
    });

    if (typeof region.intensity !== 'number' || region.intensity < 0 || region.intensity > 1) {
      errors.push(`${prefix}.intensity: must be a number between 0 and 1`);
    }

    if (typeof region.id !== 'string' || !region.id.trim()) {
      errors.push(`${prefix}.id: must be a non-empty string`);
    }

    if (typeof region.label !== 'string' || !region.label.trim()) {
      errors.push(`${prefix}.label: must be a non-empty string`);
    }

    return errors;
  }

  /**
   * Validates risk assessment format
   */
  private _validateRiskAssessment(assessment: any): string[] {
    const errors: string[] = [];

    if (typeof assessment.seriousnessLevel !== 'number' || assessment.seriousnessLevel < 1 || assessment.seriousnessLevel > 10) {
      errors.push('riskAssessment.seriousnessLevel: must be a number between 1 and 10');
    }

    if (Array.isArray(assessment.diseaseRisks)) {
      assessment.diseaseRisks.forEach((risk: any, idx: number) => {
        if (typeof risk.disease !== 'string' || typeof risk.riskPercentage !== 'number') {
          errors.push(`riskAssessment.diseaseRisks[${idx}]: invalid structure`);
        }
      });
    }

    return errors;
  }

  /**
   * Sanitizes response to remove sensitive data
   */
  sanitizeResponse(response: any): any {
    const sanitized = { ...response };

    // Remove internal fields
    delete sanitized._id;
    delete sanitized.__v;
    delete sanitized.userId; // Don't expose user IDs in detailed responses

    // Sanitize nested structures
    if (sanitized.structuredExplanation) {
      sanitized.structuredExplanation = this._sanitizeExplanation(sanitized.structuredExplanation);
    }

    return sanitized;
  }

  /**
   * Sanitizes explanation for sensitive content
   */
  private _sanitizeExplanation(explanation: any): any {
    const sanitized = { ...explanation };

    // Remove any personal health data patterns
    const sensitivePatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
      /\b\d{16}\b/g, // Credit card
    ];

    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        sensitivePatterns.forEach(pattern => {
          sanitized[key] = sanitized[key].replace(pattern, '[REDACTED]');
        });
      }
    });

    return sanitized;
  }

  /**
   * Converts old response format to new structured format (for backward compatibility)
   */
  normalizeResponse(response: any): AnalysisResponse {
    // If already in new format, return as-is
    if (response.structuredExplanation) {
      return response as AnalysisResponse;
    }

    // Convert legacy format
    const explanation = response.explanation || response.textExplanation || '';
    const confidence = response.confidence || 0.5;

    // Generate basic structured explanation from legacy data
    const structuredExplanation: ExplainabilityCore = {
      observation: 'Analysis of provided medical data',
      pattern: 'Pattern analysis in progress',
      reasoning: response.reasoningSteps || [],
      diagnosis: response.diagnosis || '',
      confidence,
      confidenceExplanation: `Analysis completed with ${(confidence * 100).toFixed(0)}% confidence`,
      audienceMode: response.audienceMode || 'patient',
      patientFriendlyExplanation: explanation,
      medicalExplanation: response.medicalExplanation || explanation,
    };

    return {
      ...response,
      structuredExplanation,
    } as AnalysisResponse;
  }
}

export default new ResponseValidator();
