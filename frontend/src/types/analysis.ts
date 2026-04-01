/**
 * Frontend Type Definitions
 * Mirrors backend explainability types for type safety
 */

export interface ReasoningStep {
  stepNumber: number;
  stage: 'observation' | 'analysis' | 'pattern_recognition' | 'diagnosis' | 'recommendation';
  description: string;
  evidence: string[];
  confidence?: number;
}

export interface StructuredExplanation {
  observation: string;
  pattern: string;
  reasoning: ReasoningStep[];
  diagnosis: string;
  confidence: number;
  confidenceExplanation: string;
  audienceMode: 'patient' | 'doctor';
  patientFriendlyExplanation?: string;
  medicalExplanation?: string;
}

export interface HeatmapRegion {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  intensity: number;
  explanation?: string;
}

export interface Heatmap {
  width: number;
  height: number;
  regions: HeatmapRegion[];
  note: string;
}

export interface RiskAssessment {
  seriousnessLevel: number;
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
}

export interface AnalysisMetadata {
  latency: number;
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
}

export interface AnalysisResponse {
  analysisId?: string;
  timestamp?: Date;
  userId?: string;

  diagnosis: string;
  confidence: number;
  explanation?: string;

  structuredExplanation: StructuredExplanation;
  heatmap?: Heatmap;
  riskAssessment?: RiskAssessment;

  metadata: AnalysisMetadata;
  reasoningSteps?: ReasoningStep[];
  language?: string;
  audienceMode?: 'patient' | 'doctor';
}

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
  parameters?: Array<{
    name: string;
    value: string;
    unit?: string;
    normalRange?: string;
    status?: 'normal' | 'high' | 'low' | 'critical' | 'slightly_high' | 'slightly_low';
  }>;
  audienceMode?: 'patient' | 'doctor';
  language?: string;
  followUpQuestion?: string;
}

export interface ConfidenceBar {
  value: number; // 0-1
  level: 'very_low' | 'low' | 'moderate' | 'good' | 'high';
  explanation: string;
}

export interface Explanation {
  section: string;
  content: string;
  confidence?: number;
}
