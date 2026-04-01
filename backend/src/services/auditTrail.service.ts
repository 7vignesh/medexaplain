/**
 * Explanation Audit Trail Service (TypeScript)
 * Tracks all reasoning decisions, model inputs/outputs, and confidence factors
 * Enables explainability and model behavior verification
 */

import { v4 as uuidv4 } from 'uuid';

type AuditEventType =
  | 'ANALYSIS_STARTED'
  | 'IMAGE_PROCESSED'
  | 'PARAMETERS_EXTRACTED'
  | 'AI_MODEL_CALLED'
  | 'CONFIDENCE_CALCULATED'
  | 'EXPLANATION_GENERATED'
  | 'EXPLANATION_REVIEWED'
  | 'FOLLOW_UP_QUESTION'
  | 'EXPLANATION_EXPORTED'
  | 'ANALYSIS_COMPLETED';

interface AuditMetadata {
  [key: string]: any;
}

interface AuditEntry {
  eventId: string;
  timestamp: Date;
  eventType: AuditEventType;
  userId: string;
  analysisId: string;
  description: string;
  metadata: AuditMetadata;
  duration?: number; // milliseconds
  success: boolean;
  errorMessage?: string;
}

interface AuditTrail {
  trailId: string;
  analysisId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  entries: AuditEntry[];
  summary: {
    totalEvents: number;
    totalDuration: number;
    successRate: number;
    failedEvents: number;
    modelCallCount: number;
    confidenceScores: number[];
    averageConfidence: number;
  };
}

interface ModelCallRecord {
  modelName: string;
  provider: 'openai' | 'gemini' | 'openrouter';
  inputTokens: number;
  outputTokens: number;
  responseTime: number;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
}

interface ConfidenceFactorsRecord {
  dataQuality: {
    score: number;
    reasoning: string;
  };
  modelAgreement: {
    score: number;
    reasoning: string;
  };
  evidenceStrength: {
    score: number;
    reasoning: string;
  };
  contextRelevance: {
    score: number;
    reasoning: string;
  };
  finalScore: number;
  calculatedAt: Date;
}

class ExplanationAuditService {
  private trails: Map<string, AuditTrail> = new Map();

  /**
   * Creates a new audit trail for an analysis
   */
  createTrail(analysisId: string, userId: string): string {
    const trailId = uuidv4();
    const now = new Date();

    const trail: AuditTrail = {
      trailId,
      analysisId,
      userId,
      createdAt: now,
      updatedAt: now,
      entries: [],
      summary: {
        totalEvents: 0,
        totalDuration: 0,
        successRate: 100,
        failedEvents: 0,
        modelCallCount: 0,
        confidenceScores: [],
        averageConfidence: 0,
      },
    };

    this.trails.set(trailId, trail);
    return trailId;
  }

  /**
   * Logs an event to the audit trail
   */
  logEvent(
    trailId: string,
    eventType: AuditEventType,
    description: string,
    metadata: AuditMetadata,
    success: boolean = true,
    errorMessage?: string,
    duration?: number
  ): string {
    const trail = this.trails.get(trailId);
    if (!trail) {
      throw new Error(`Audit trail ${trailId} not found`);
    }

    const eventId = uuidv4();
    const entry: AuditEntry = {
      eventId,
      timestamp: new Date(),
      eventType,
      userId: trail.userId,
      analysisId: trail.analysisId,
      description,
      metadata,
      success,
      errorMessage,
      duration,
    };

    trail.entries.push(entry);
    trail.updatedAt = new Date();

    // Update summary
    this._updateSummary(trail);

    return eventId;
  }

  /**
   * Records an AI model call with performance metrics
   */
  recordModelCall(
    trailId: string,
    modelCall: ModelCallRecord,
    prompt?: string,
    response?: string
  ): string {
    return this.logEvent(
      trailId,
      'AI_MODEL_CALLED',
      `Called ${modelCall.modelName} via ${modelCall.provider}`,
      {
        modelName: modelCall.modelName,
        provider: modelCall.provider,
        inputTokens: modelCall.inputTokens,
        outputTokens: modelCall.outputTokens,
        responseTime: modelCall.responseTime,
        totalTokens: modelCall.inputTokens + modelCall.outputTokens,
        tempCost: (modelCall.inputTokens * 0.0005 + modelCall.outputTokens * 0.0015) / 1000,
        temperature: modelCall.temperature,
        topP: modelCall.topP,
        maxTokens: modelCall.maxTokens,
        promptLength: prompt?.length || 0,
        responseLength: response?.length || 0,
      },
      true,
      undefined,
      modelCall.responseTime
    );
  }

  /**
   * Records confidence calculation details
   */
  recordConfidenceCalculation(
    trailId: string,
    factors: ConfidenceFactorsRecord
  ): string {
    return this.logEvent(
      trailId,
      'CONFIDENCE_CALCULATED',
      `Confidence score calculated: ${(factors.finalScore * 100).toFixed(1)}%`,
      {
        dataQuality: factors.dataQuality,
        modelAgreement: factors.modelAgreement,
        evidenceStrength: factors.evidenceStrength,
        contextRelevance: factors.contextRelevance,
        finalScore: factors.finalScore,
        confidenceLevel:
          factors.finalScore >= 0.8
            ? 'high'
            : factors.finalScore >= 0.6
              ? 'good'
              : factors.finalScore >= 0.4
                ? 'moderate'
                : factors.finalScore >= 0.2
                  ? 'low'
                  : 'very_low',
      },
      true
    );
  }

  /**
   * Records parameters extraction from medical images
   */
  recordParameterExtraction(
    trailId: string,
    parameters: Record<string, any>,
    extractionMethod: string
  ): string {
    return this.logEvent(
      trailId,
      'PARAMETERS_EXTRACTED',
      `Extracted ${Object.keys(parameters).length} parameters using ${extractionMethod}`,
      {
        extractionMethod,
        parameterCount: Object.keys(parameters).length,
        parameters: this._redactSensitiveData(parameters),
        timestamp: new Date(),
      },
      true
    );
  }

  /**
   * Records follow-up questions
   */
  recordFollowUpQuestion(
    trailId: string,
    question: string,
    answer: string,
    aiModel: string
  ): string {
    return this.logEvent(
      trailId,
      'FOLLOW_UP_QUESTION',
      `Follow-up Q&A processed: "${question.substring(0, 50)}..."`,
      {
        question,
        answerLength: answer.length,
        aiModel,
        questionLength: question.length,
        timestamp: new Date(),
      },
      true
    );
  }

  /**
   * Gets the complete audit trail
   */
  getTrail(trailId: string): AuditTrail | null {
    return this.trails.get(trailId) || null;
  }

  /**
   * Exports audit trail as JSON report
   */
  exportTrailAsJSON(trailId: string): string {
    const trail = this.trails.get(trailId);
    if (!trail) {
      throw new Error(`Audit trail ${trailId} not found`);
    }

    return JSON.stringify(trail, null, 2);
  }

  /**
   * Generates human-readable audit report
   */
  generateAuditReport(trailId: string): string {
    const trail = this.trails.get(trailId);
    if (!trail) {
      throw new Error(`Audit trail ${trailId} not found`);
    }

    let report = '';
    report += `=== EXPLANATION AUDIT TRAIL REPORT ===\n`;
    report += `Trail ID: ${trail.trailId}\n`;
    report += `Analysis ID: ${trail.analysisId}\n`;
    report += `User ID: ${trail.userId}\n`;
    report += `Created: ${trail.createdAt.toISOString()}\n`;
    report += `Updated: ${trail.updatedAt.toISOString()}\n`;
    report += `\n--- SUMMARY ---\n`;
    report += `Total Events: ${trail.summary.totalEvents}\n`;
    report += `Total Duration: ${trail.summary.totalDuration}ms\n`;
    report += `Success Rate: ${trail.summary.successRate.toFixed(1)}%\n`;
    report += `Failed Events: ${trail.summary.failedEvents}\n`;
    report += `Model Calls: ${trail.summary.modelCallCount}\n`;
    report += `Average Confidence: ${trail.summary.averageConfidence.toFixed(3)}\n`;

    report += `\n--- EVENT TIMELINE ---\n`;
    trail.entries.forEach((entry) => {
      report += `\n[${entry.timestamp.toISOString()}] ${entry.eventType}\n`;
      report += `Status: ${entry.success ? 'SUCCESS' : 'FAILED'}\n`;
      report += `Description: ${entry.description}\n`;
      if (entry.duration) {
        report += `Duration: ${entry.duration}ms\n`;
      }
      if (entry.errorMessage) {
        report += `Error: ${entry.errorMessage}\n`;
      }
      if (Object.keys(entry.metadata).length > 0) {
        report += `Metadata:\n`;
        Object.entries(entry.metadata).forEach(([key, value]) => {
          if (typeof value === 'object') {
            report += `  ${key}: ${JSON.stringify(value, null, 2).split('\n').join('\n  ')}\n`;
          } else {
            report += `  ${key}: ${value}\n`;
          }
        });
      }
    });

    return report;
  }

  /**
   * Analyzes explanation decisions and provides insights
   */
  analyzeDecisions(trailId: string): {
    recommendedConfidenceLevel: string;
    decisionFactors: string[];
    potentialIssues: string[];
    suggestions: string[];
  } {
    const trail = this.trails.get(trailId);
    if (!trail) {
      throw new Error(`Audit trail ${trailId} not found`);
    }

    const insights = {
      recommendedConfidenceLevel: 'good',
      decisionFactors: [] as string[],
      potentialIssues: [] as string[],
      suggestions: [] as string[],
    };

    const confidenceEntries = trail.entries.filter((e) => e.eventType === 'CONFIDENCE_CALCULATED');
    if (confidenceEntries.length > 0) {
      const avgConfidence =
        confidenceEntries.reduce((sum, e) => sum + (e.metadata.finalScore || 0), 0) /
        confidenceEntries.length;

      if (avgConfidence >= 0.8) {
        insights.recommendedConfidenceLevel = 'high';
        insights.decisionFactors.push('Strong model confidence scores');
      } else if (avgConfidence >= 0.6) {
        insights.recommendedConfidenceLevel = 'good';
        insights.decisionFactors.push('Moderate to good confidence scores');
      } else {
        insights.recommendedConfidenceLevel = 'moderate';
        insights.potentialIssues.push('Confidence scores below recommended threshold');
        insights.suggestions.push('Consider requesting additional diagnostic information');
      }
    }

    const failedEvents = trail.entries.filter((e) => !e.success);
    if (failedEvents.length > 0) {
      insights.potentialIssues.push(`${failedEvents.length} processing errors detected`);
      insights.suggestions.push('Review error logs for processing issues');
    }

    const modelCalls = trail.entries.filter((e) => e.eventType === 'AI_MODEL_CALLED');
    if (modelCalls.length === 0) {
      insights.potentialIssues.push('No AI model calls recorded');
      insights.suggestions.push('Verify analysis was processed with AI models');
    }

    return insights;
  }

  /**
   * Compares two audit trails for model behavior consistency
   */
  compareTrails(trailId1: string, trailId2: string): {
    similarityScore: number;
    differences: string[];
    consistencyNotes: string[];
  } {
    const trail1 = this.trails.get(trailId1);
    const trail2 = this.trails.get(trailId2);

    if (!trail1 || !trail2) {
      throw new Error('One or both audit trails not found');
    }

    const comparison = {
      similarityScore: 0,
      differences: [] as string[],
      consistencyNotes: [] as string[],
    };

    const conf1 = trail1.summary.averageConfidence;
    const conf2 = trail2.summary.averageConfidence;
    const confDiff = Math.abs(conf1 - conf2);

    if (confDiff < 0.1) {
      comparison.consistencyNotes.push('Confidence scores are consistent');
      comparison.similarityScore += 30;
    } else {
      comparison.differences.push(
        `Confidence difference: ${(confDiff * 100).toFixed(1)}% (Trail1: ${(conf1 * 100).toFixed(1)}%, Trail2: ${(conf2 * 100).toFixed(1)}%)`
      );
    }

    const model1Count = trail1.summary.modelCallCount;
    const model2Count = trail2.summary.modelCallCount;
    if (model1Count === model2Count) {
      comparison.consistencyNotes.push('Same number of model calls');
      comparison.similarityScore += 20;
    } else {
      comparison.differences.push(
        `Model call count differs: Trail1: ${model1Count}, Trail2: ${model2Count}`
      );
    }

    const success1 = trail1.summary.successRate === 100;
    const success2 = trail2.summary.successRate === 100;
    if (success1 === success2) {
      comparison.consistencyNotes.push('Same success status');
      comparison.similarityScore += 20;
    } else {
      comparison.differences.push('Success/failure status differs between trails');
    }

    if (trail1.summary.totalEvents === trail2.summary.totalEvents) {
      comparison.consistencyNotes.push('Event counts match');
      comparison.similarityScore += 20;
    }

    if (confDiff < 0.15 && model1Count === model2Count && success1 === success2) {
      comparison.consistencyNotes.push('Model behavior appears consistent');
      comparison.similarityScore += 10;
    }

    return comparison;
  }

  /**
   * Deletes an audit trail (for data retention/GDPR compliance)
   */
  deleteTrail(trailId: string): boolean {
    return this.trails.delete(trailId);
  }

  /**
   * Exports all trails for the user (for data export requests)
   */
  exportUserTrails(userId: string): AuditTrail[] {
    return Array.from(this.trails.values()).filter((trail) => trail.userId === userId);
  }

  /**
   * Updates audit trail summary statistics
   */
  private _updateSummary(trail: AuditTrail): void {
    trail.summary.totalEvents = trail.entries.length;
    trail.summary.totalDuration = trail.entries.reduce((sum, e) => sum + (e.duration || 0), 0);
    trail.summary.failedEvents = trail.entries.filter((e) => !e.success).length;
    trail.summary.successRate =
      trail.entries.length > 0
        ? ((trail.entries.length - trail.summary.failedEvents) / trail.entries.length) * 100
        : 100;

    trail.summary.modelCallCount = trail.entries.filter((e) => e.eventType === 'AI_MODEL_CALLED')
      .length;

    trail.summary.confidenceScores = trail.entries
      .filter((e) => e.eventType === 'CONFIDENCE_CALCULATED')
      .map((e) => e.metadata.finalScore);

    trail.summary.averageConfidence =
      trail.summary.confidenceScores.length > 0
        ? trail.summary.confidenceScores.reduce((a, b) => a + b, 0) /
          trail.summary.confidenceScores.length
        : 0;
  }

  /**
   * Redacts sensitive data from parameters
   */
  private _redactSensitiveData(data: Record<string, any>): Record<string, any> {
    const redacted = { ...data };
    const sensitiveFields = ['ssn', 'mrn', 'password', 'token', 'email', 'phone'];

    Object.keys(redacted).forEach((key) => {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
        redacted[key] = '[REDACTED]';
      }
    });

    return redacted;
  }
}

export default new ExplanationAuditService();
