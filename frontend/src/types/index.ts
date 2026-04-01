export interface User {
  _id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  preferences?: {
    notifications: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
  isActive?: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Parameter {
  name: string;
  value: string;
  unit?: string;
  normalRange?: string;
  category?: string;
  status: 'normal' | 'slightly_high' | 'slightly_low' | 'high' | 'low' | 'critical';
  explanation?: string;
  description?: string;
}

export interface DiseaseRisk {
  disease: string;
  riskPercentage: number;
  keyIndicators: string[];
  explanation: string;
}

export interface InfluencingParameter {
  name: string;
  impactScore: number;
  reason: string;
}

export interface RiskAssessment {
  seriousnessLevel: number;
  diseaseRisks: DiseaseRisk[];
  topInfluencingParameters: InfluencingParameter[];
  visualJustification: string;
  recommendedActions: string[];
  analysisDate: Date;
  version: string;
}

export interface Report {
  _id: string;
  userId: string;
  fileName: string;
  fileType: 'pdf' | 'image';
  fileSize: number;
  extractedText?: string;
  parameters: Parameter[];
  healthSummary?: string;
  riskAssessment?: RiskAssessment;
  riskAssessmentStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  riskAssessmentError?: string;
  reportDate: Date;
  labName?: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingError?: string;
  abnormalParameters: number;
  criticalParameters: number;
  tags?: string[];
  userNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrendData {
  date: Date;
  value: number;
  unit?: string;
  status: string;
}

export interface UserStats {
  totalReports: number;
  reportsThisMonth: number;
  abnormalReports: number;
  memberSince: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}

export interface ExplanationBlock {
  observation: string;
  pattern: string;
  reasoning: string;
  conclusion: string;
}

export interface ReasoningStep {
  step: number;
  title: string;
  description: string;
  evidence: string[];
}

export interface StructuredReasoningStep {
  stepNumber: number;
  stage: 'observation' | 'analysis' | 'pattern_recognition' | 'diagnosis' | 'recommendation';
  description: string;
  evidence: string[];
  confidence?: number;
}

export interface StructuredExplanation {
  observation: string;
  pattern: string;
  reasoning: StructuredReasoningStep[];
  diagnosis: string;
  confidence: number;
  confidenceExplanation: string;
  audienceMode?: 'doctor' | 'patient';
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
}

export interface HeatmapData {
  width: number;
  height: number;
  regions: HeatmapRegion[];
  note: string;
}

export interface AnalysisResult {
  analysisId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  diagnosis?: string;
  confidence?: number;
  explanation?: ExplanationBlock;
  structuredExplanation?: StructuredExplanation | null;
  metadata?: {
    latency: number;
    modelUsed: string;
    visionModelUsed?: string;
    llmModelUsed?: string;
    cacheHit?: boolean;
    processingStages?: {
      vision?: number;
      llm?: number;
      explanation?: number;
      total: number;
    };
  };
  reasoningSteps?: ReasoningStep[];
  heatmap?: HeatmapData | null;
  riskAssessment?: RiskAssessment | null;
  language?: string;
  audienceMode?: 'doctor' | 'patient';
  error?: string;
}

export interface AnalysisHistoryItem {
  analysisId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  diagnosis: string | null;
  confidence: number | null;
  language: string;
  audienceMode: 'doctor' | 'patient';
}

export interface AnalysisMetrics {
  startedAt: string;
  analyses: number;
  completed: number;
  failed: number;
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
  };
  responseTime: {
    averageMs: number;
    p50Ms: number;
    p95Ms: number;
  };
  confidence: {
    average: number;
  };
  mockAccuracy: number;
  reliability: {
    successRate: number;
    failureRate: number;
  };
  modelUsage: Record<string, number>;
}
