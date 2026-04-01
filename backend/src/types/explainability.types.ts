/**
 * Explainability Type Definitions
 * Defines the standard structure for AI-generated explanations
 * ensuring consistency across all analysis pipelines
 */

/**
 * Individual reasoning step in the explanation chain
 */
export interface ReasoningStep {
  stepNumber: number;
  stage: 'observation' | 'analysis' | 'pattern_recognition' | 'diagnosis' | 'recommendation';
  description: string;
  evidence: string[];
  confidence?: number;
}

/**
 * Core explainability structure
 * Represents the complete reasoning chain with confidence metrics
 */
export interface ExplainabilityCore {
  // Observation: What did we detect?
  observation: string;

  // Pattern: What pattern does this match?
  pattern: string;

  // Reasoning: Step-by-step chain of thought
  reasoning: ReasoningStep[];

  // Diagnosis: What is the conclusion?
  diagnosis: string;

  // Confidence: How confident are we? (0-1)
  confidence: number;

  // Confidence explanation
  confidenceExplanation: string;

  // Audience-specific explanation
  audienceMode: 'patient' | 'doctor';
  patientFriendlyExplanation?: string;
  medicalExplanation?: string;
}

/**
 * Heatmap region for image-based explanations
 */
export interface HeatmapRegion {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  intensity: number; // 0-1
  explanation?: string;
}

/**
 * Heatmap visualization metadata
 */
export interface Heatmap {
  width: number;
  height: number;
  regions: HeatmapRegion[];
  note: string;
}

/**
 * Complete analysis response
 * This is the unified format returned from /analyze endpoint
 */
export interface AnalysisResponse {
  // Analysis metadata
  analysisId: string;
  timestamp: Date;
  userId: string;

  // Input information
  inputType: 'text' | 'image' | 'document';
  inputSource?: string;

  // Core diagnosis
  diagnosis: string;
  confidence: number;

  // Explainability bundle
  explanation: ExplainabilityCore;

  // Visual explanations (if applicable)
  heatmap?: Heatmap;

  // Health assessment
  healthSummary?: string;
  riskAssessment?: {
    seriousnessLevel: number; // 1-10
    diseaseRisks: Array<{
      disease: string;
      riskPercentage: number;
      keyIndicators: string[];
      explanation: string;
    }>;
    topInfluencingParameters: Array<{
      parameter: string;
      value: string;
      impactScore: number;
      explanation: string;
    }>;
    recommendedActions: string[];
  };

  // Performance metrics
  metadata: {
    latency: number; // milliseconds
    modelUsed: string;
    visionModelUsed?: string;
    llmModelUsed?: string;
    cacheHit: boolean;
    processingStages: {
      vision?: number;
      llm?: number;
      explanation?: number;
      total: number;
    };
  };

  // Follow-up context
  followUpContext?: {
    previousAnalysisId?: string;
    conversationHistory?: Array<{
      question: string;
      answer: string;
      confidence: number;
    }>;
  };
}

/**
 * Request payload for analysis
 */
export interface AnalysisRequest {
  inputType: 'text' | 'image' | 'document';
  textInput?: string;
  imagePath?: string;
  documentPath?: string;
  imageMeta?: {
    fileName?: string;
    width?: number;
    height?: number;
    format?: string;
  };
  audienceMode?: 'patient' | 'doctor';
  followUpContext?: {
    previousAnalysisId?: string;
    question?: string;
  };
}

/**
 * Service response wrapper
 */
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Confidence scoring factors
 */
export interface ConfidenceFactors {
  dataQuality: number; // 0-1: How complete/clear is the input?
  modelAgreement: number; // 0-1: Do multiple models agree?
  evidenceStrength: number; // 0-1: How strong is the supporting evidence?
  contextRelevance: number; // 0-1: How relevant is the context?
  weights?: {
    dataQuality: number;
    modelAgreement: number;
    evidenceStrength: number;
    contextRelevance: number;
  };
}
