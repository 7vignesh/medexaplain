/**
 * useAnalysis - Custom React Hook for Type-Safe Medical Analysis
 * Handles API calls, loading states, error handling, and response validation
 */

'use client';

import { useState, useCallback } from 'react';
import type { AnalysisRequest, AnalysisResponse } from '@/types/analysis';
import { analyzeReport, askFollowUpQuestion, getAnalysisHistory } from '@/lib/api';

interface UseAnalysisState {
  data: AnalysisResponse | null;
  loading: boolean;
  error: Error | null;
  validationErrors: string[];
}

interface UseAnalysisReturn extends UseAnalysisState {
  analyze: (request: AnalysisRequest) => Promise<void>;
  followUp: (question: string, contextId: string) => Promise<void>;
  reset: () => void;
  getHistory: (limit?: number) => Promise<AnalysisResponse[]>;
  confidence: {
    score: number;
    level: 'very_low' | 'low' | 'moderate' | 'good' | 'high';
    explanation: string;
  };
}

/**
 * Converts confidence score (0-1) to readable level
 */
function getConfidenceLevel(score: number): 'very_low' | 'low' | 'moderate' | 'good' | 'high' {
  if (score >= 0.85) return 'high';
  if (score >= 0.7) return 'good';
  if (score >= 0.55) return 'moderate';
  if (score >= 0.4) return 'low';
  return 'very_low';
}

/**
 * Custom hook for medical analysis
 */
export const useAnalysis = (): UseAnalysisReturn => {
  const [state, setState] = useState<UseAnalysisState>({
    data: null,
    loading: false,
    error: null,
    validationErrors: [],
  });

  /**
   * Validates API response structure
   */
  const validateResponse = useCallback((response: any): [boolean, string[]] => {
    const errors: string[] = [];

    // Validate required fields
    if (!response.structuredExplanation) {
      errors.push('Missing structured explanation');
    }

    if (typeof response.confidence !== 'number' || response.confidence < 0 || response.confidence > 1) {
      errors.push('Invalid confidence score');
    }

    if (!response.diagnosis || typeof response.diagnosis !== 'string') {
      errors.push('Missing or invalid diagnosis');
    }

    if (!response.metadata) {
      errors.push('Missing metadata');
    }

    // Validate structured explanation if present
    if (response.structuredExplanation) {
      const ex = response.structuredExplanation;
      if (!ex.observation || !ex.pattern || !ex.reasoning || !ex.diagnosis) {
        errors.push('Incomplete structured explanation');
      }

      if (!Array.isArray(ex.reasoning)) {
        errors.push('Reasoning steps must be an array');
      }
    }

    return [errors.length === 0, errors];
  }, []);

  /**
   * Perform analysis
   */
  const analyze = useCallback(
    async (request: AnalysisRequest) => {
      setState((prev) => ({ ...prev, loading: true, error: null, validationErrors: [] }));

      try {
        const response = await analyzeReport(request);
        const payload = (response as any)?.data?.data ?? (response as any)?.data;
        const [isValid, validationErrors] = validateResponse(payload);

        if (!isValid) {
          setState((prev) => ({
            ...prev,
            loading: false,
            validationErrors,
            error: new Error('Response validation failed'),
          }));
          return;
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          data: payload,
          error: null,
          validationErrors: [],
        }));
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error occurred');
        setState((prev) => ({
          ...prev,
          loading: false,
          error,
        }));
      }
    },
    [validateResponse]
  );

  /**
   * Ask follow-up question
   */
  const followUp = useCallback(
    async (question: string, contextId: string) => {
      if (!question.trim()) {
        setState((prev) => ({
          ...prev,
          error: new Error('Question cannot be empty'),
        }));
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await askFollowUpQuestion({
          question,
          contextResultId: contextId,
          audienceMode: state.data?.audienceMode || 'patient',
        });

        const payload = (response as any)?.data?.data ?? (response as any)?.data;
        const [isValid, validationErrors] = validateResponse(payload);

        if (!isValid) {
          setState((prev) => ({
            ...prev,
            loading: false,
            validationErrors,
            error: new Error('Follow-up response validation failed'),
          }));
          return;
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          data: payload,
          error: null,
          validationErrors: [],
        }));
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Follow-up failed');
        setState((prev) => ({
          ...prev,
          loading: false,
          error,
        }));
      }
    },
    [state.data?.audienceMode, validateResponse]
  );

  /**
   * Get analysis history
   */
  const getHistory = useCallback(async (limit: number = 10): Promise<AnalysisResponse[]> => {
    try {
      const response = await getAnalysisHistory(limit);
      return response.data as AnalysisResponse[];
    } catch (err) {
      console.error('Failed to fetch history:', err);
      return [];
    }
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      validationErrors: [],
    });
  }, []);

  // Calculate confidence info
  const confidence = {
    score: state.data?.confidence ?? 0,
    level: getConfidenceLevel(state.data?.confidence ?? 0),
    explanation: state.data?.structuredExplanation?.confidenceExplanation ?? 'No analysis performed',
  };

  return {
    ...state,
    analyze,
    followUp,
    reset,
    getHistory,
    confidence,
  };
};

/**
 * Hook for getting structured explanation
 */
export const useStructuredExplanation = (analysisResponse: AnalysisResponse | null) => {
  const explanation = analysisResponse?.structuredExplanation;

  return {
    observation: explanation?.observation ?? '',
    pattern: explanation?.pattern ?? '',
    reasoning: explanation?.reasoning ?? [],
    diagnosis: explanation?.diagnosis ?? '',
    confidence: explanation?.confidence ?? 0,
    confidenceExplanation: explanation?.confidenceExplanation ?? '',
    patientFriendly: explanation?.patientFriendlyExplanation ?? '',
    medicalVersion: explanation?.medicalExplanation ?? '',
    audienceMode: explanation?.audienceMode ?? 'patient',
  };
};

/**
 * Hook for getting confidence details
 */
export const useConfidenceMetrics = (analysisResponse: AnalysisResponse | null) => {
  if (!analysisResponse) {
    return {
      score: 0,
      level: 'very_low' as const,
      explanation: 'No analysis performed',
      latency: 0,
      modelUsed: '',
      cacheHit: false,
    };
  }

  const { confidence, structuredExplanation, metadata } = analysisResponse;

  return {
    score: confidence,
    level: getConfidenceLevel(confidence),
    explanation: structuredExplanation?.confidenceExplanation ?? '',
    latency: metadata?.latency ?? 0,
    modelUsed: metadata?.modelUsed ?? '',
    cacheHit: metadata?.cacheHit ?? false,
  };
};

export default useAnalysis;
