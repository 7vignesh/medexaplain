export interface User {
  _id: string;
  firebaseUid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  provider: 'email' | 'google';
  preferences: {
    notifications: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
  isActive: boolean;
  lastLoginAt: Date;
  createdAt: Date;
  updatedAt: Date;
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
