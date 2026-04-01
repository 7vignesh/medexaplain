'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getReportById,
  deleteReport,
  generateRiskAssessment,
  analyzeReport,
  getAnalysisResult,
  getAnalysisHistory,
  askFollowUpQuestion,
  getAnalysisMetrics,
} from '@/lib/api';
import { AnalysisHistoryItem, AnalysisMetrics, AnalysisResult, Report } from '@/types';
import Navbar from '@/components/layout/Navbar';
import ParameterCard from '@/components/reports/ParameterCard';
import HealthSummary from '@/components/reports/HealthSummary';
import TrendChart from '@/components/reports/TrendChart';
import RiskAssessment from '@/components/reports/RiskAssessment';
import AiThinkingCard from '@/components/reports/AiThinkingCard';
import HeatmapMock from '@/components/reports/HeatmapMock';
import AnalysisHistoryPanel from '@/components/reports/AnalysisHistoryPanel';
import ConfidenceDisplay from '@/components/reports/ConfidenceDisplay';
import ReasoningTimeline from '@/components/reports/ReasoningTimeline';
import FollowUpQA from '@/components/reports/FollowUpQA';
import ExplanationPanel from '@/components/reports/ExplanationPanel';
import { Trash2, Download, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

const getConfidenceLevel = (
  score: number
): 'very_low' | 'low' | 'moderate' | 'good' | 'high' => {
  if (score >= 0.85) return 'high';
  if (score >= 0.7) return 'good';
  if (score >= 0.55) return 'moderate';
  if (score >= 0.4) return 'low';
  return 'very_low';
};

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const riskIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analysisIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'pending' | 'processing' | 'completed' | 'failed'>('idle');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryItem[]>([]);
  const [analysisPrompt, setAnalysisPrompt] = useState('Please explain what matters most in this report.');
  const [language, setLanguage] = useState('en');
  const [audienceMode, setAudienceMode] = useState<'doctor' | 'patient'>('patient');
  const [metrics, setMetrics] = useState<AnalysisMetrics | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchReport(params.id as string);
      refreshHistory();
      refreshMetrics();
    }

    return () => {
      if (riskIntervalRef.current) clearInterval(riskIntervalRef.current);
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    };
  }, [params.id]);

  const fetchReport = async (id: string) => {
    try {
      const response = await getReportById(id);
      const reportData = response.data.data;
      setReport(reportData);
      
      // Auto-generate risk assessment if missing, pending, or incomplete
      const isIncomplete = reportData.riskAssessment && 
                          (!reportData.riskAssessment.visualJustification || 
                           reportData.riskAssessment.visualJustification.length < 10);

      if (!reportData.riskAssessment || 
          reportData.riskAssessmentStatus === 'pending' || 
          isIncomplete) {
        console.log('Triggering risk assessment regeneration due to missing/incomplete data');
        triggerRiskAssessment(id);
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const triggerRiskAssessment = async (id: string) => {
    try {
      await generateRiskAssessment(id);
      riskIntervalRef.current = setInterval(async () => {
        const res = await getReportById(id);
        const updatedReport = res.data.data;
        if (updatedReport.riskAssessmentStatus === 'completed' || updatedReport.riskAssessmentStatus === 'failed') {
          setReport(updatedReport);
          if (riskIntervalRef.current) clearInterval(riskIntervalRef.current);
        }
      }, 3000);
      setTimeout(() => {
        if (riskIntervalRef.current) clearInterval(riskIntervalRef.current);
      }, 120000);
    } catch (error) {
      console.error('Failed to trigger risk assessment:', error);
    }
  };

  const buildAnalysisPayload = () => {
    if (!report) {
      return null;
    }

    const reportSummary = report.healthSummary || '';
    const textInput = [analysisPrompt, reportSummary].filter(Boolean).join(' ');

    return {
      inputType: report.fileType === 'image' ? 'image' as const : 'text' as const,
      textInput,
      reportSummary,
      parameters: report.parameters,
      imageMeta: {
        fileName: report.fileName,
      },
      language,
      audienceMode,
    };
  };

  const pollAnalysis = (analysisId: string) => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
    }

    setAnalysisStatus('processing');
    analysisIntervalRef.current = setInterval(async () => {
      try {
        const response = await getAnalysisResult(analysisId);
        const data = response.data.data as AnalysisResult | undefined;
        if (!data) {
          throw new Error('Analysis result payload missing');
        }

        setActiveAnalysisId(analysisId);
        setAnalysisStatus(data.status);

        if (data.status === 'completed' || data.status === 'failed') {
          setAnalysisResult(data);
          clearInterval(analysisIntervalRef.current!);
          refreshHistory();
          refreshMetrics();
        }
      } catch (error) {
        console.error('Polling failed:', error);
        clearInterval(analysisIntervalRef.current!);
        setAnalysisStatus('failed');
      }
    }, 1800);

    setTimeout(() => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    }, 120000);
  };

  const runAnalysis = async () => {
    const payload = buildAnalysisPayload();

    if (!payload) {
      return;
    }

    try {
      setAnalysisStatus('pending');
      setAnalysisResult(null);

      const response = await analyzeReport(payload);
      const data = response.data.data;
      if (!data) {
        throw new Error('Analysis job response missing payload');
      }
      const analysisId = data.analysisId as string;

      setActiveAnalysisId(analysisId);

      if (data.status === 'completed') {
        const resultResponse = await getAnalysisResult(analysisId);
        const resultData = resultResponse.data.data as AnalysisResult | undefined;
        if (!resultData) {
          throw new Error('Analysis result payload missing');
        }
        setAnalysisResult(resultData);
        setAnalysisStatus(resultData.status);
        refreshHistory();
        refreshMetrics();
        return;
      }

      pollAnalysis(analysisId);
    } catch (error) {
      console.error('Analysis request failed:', error);
      toast.error('Unable to start analysis');
      setAnalysisStatus('failed');
    }
  };

  const runFollowUp = async (question: string) => {
    if (!activeAnalysisId) {
      toast.error('Run an analysis before asking follow-up questions');
      return;
    }

    const payload = buildAnalysisPayload();
    if (!payload || !question.trim()) {
      toast.error('Enter a follow-up question');
      return;
    }

    try {
      setAnalysisStatus('pending');
      setAnalysisResult(null);

      const response = await askFollowUpQuestion({
        ...payload,
        question,
        contextResultId: activeAnalysisId,
      });

      const data = response.data.data;
      if (!data) {
        throw new Error('Follow-up response missing payload');
      }
      const followUpAnalysisId = data.analysisId as string;
      setActiveAnalysisId(followUpAnalysisId);

      if (data.status === 'completed') {
        const resultResponse = await getAnalysisResult(followUpAnalysisId);
        const resultData = resultResponse.data.data as AnalysisResult | undefined;
        if (!resultData) {
          throw new Error('Follow-up result payload missing');
        }
        setAnalysisResult(resultData);
        setAnalysisStatus(resultData.status);
        refreshHistory();
        refreshMetrics();
      } else {
        pollAnalysis(followUpAnalysisId);
      }

    } catch (error) {
      console.error('Follow-up failed:', error);
      toast.error('Unable to process follow-up question');
      setAnalysisStatus('failed');
    }
  };

  const timelineSteps = analysisResult?.structuredExplanation?.reasoning?.length
    ? analysisResult.structuredExplanation.reasoning
    : (analysisResult?.reasoningSteps || []).map((step, index) => ({
        stepNumber: step.step || index + 1,
        stage: 'analysis' as const,
        description: step.description || step.title,
        evidence: step.evidence || [],
      }));

  const displayConfidence =
    analysisResult?.structuredExplanation?.confidence ?? analysisResult?.confidence ?? 0;

  const selectHistoryResult = async (analysisId: string) => {
    try {
      const response = await getAnalysisResult(analysisId);
      const data = response.data.data as AnalysisResult | undefined;
      if (!data) {
        throw new Error('History result payload missing');
      }
      setActiveAnalysisId(analysisId);
      setAnalysisStatus(data.status);

      if (data.status === 'completed' || data.status === 'failed') {
        setAnalysisResult(data);
      } else {
        setAnalysisResult(null);
        pollAnalysis(analysisId);
      }
    } catch (error) {
      console.error('Failed to load historical result:', error);
      toast.error('Unable to load analysis history item');
    }
  };

  const refreshHistory = async () => {
    try {
      const response = await getAnalysisHistory(12);
      setAnalysisHistory(response.data.data || []);
    } catch (error) {
      console.error('History load failed:', error);
    }
  };

  const refreshMetrics = async () => {
    try {
      const response = await getAnalysisMetrics();
      setMetrics(response.data.data || null);
    } catch (error) {
      console.error('Metrics load failed:', error);
    }
  };

  const handleDelete = async () => {
    if (!report || !confirm('Are you sure you want to delete this report?')) return;

    try {
      await deleteReport(report._id);
      toast.success('Report deleted successfully');
      router.push('/reports');
    } catch (error) {
      toast.error('Failed to delete report');
    }
  };

  if (loading) {
    return (
      <div className="page-shell bg-slate-950">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="page-shell bg-slate-950">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-slate-400">Report not found</p>
            <Link href="/dashboard" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
              Return to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell bg-slate-950">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 rounded-2xl border border-cyan-800/40 bg-gradient-to-r from-cyan-950/45 via-slate-900/60 to-emerald-950/35 p-5">
          <Link href="/reports" className="inline-flex items-center text-sm text-slate-300 hover:text-slate-100 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to reports
          </Link>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-slate-100">{report.fileName}</h1>
              <p className="mt-1 text-sm text-slate-400">
                Uploaded on {new Date(report.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center px-4 py-2 border border-slate-700 rounded-md shadow-sm text-sm font-medium text-slate-200 bg-slate-900 hover:bg-slate-800"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 border border-rose-700 rounded-md shadow-sm text-sm font-medium text-rose-200 bg-rose-950/50 hover:bg-rose-900/60"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Processing Status */}
        {report.processingStatus !== 'completed' && (
          <div className={`mb-6 p-4 rounded-lg ${
            report.processingStatus === 'processing' ? 'bg-sky-950/35 text-sky-200 border border-sky-800/40' :
            report.processingStatus === 'failed' ? 'bg-rose-950/35 text-rose-200 border border-rose-800/40' :
            'bg-amber-950/35 text-amber-200 border border-amber-800/40'
          }`}>
            <p className="font-medium">
              {report.processingStatus === 'processing' && '🔄 Processing report...'}
              {report.processingStatus === 'failed' && '❌ Processing failed'}
              {report.processingStatus === 'pending' && '⏳ Pending processing'}
            </p>
            {report.processingError && (
              <p className="text-sm mt-1">{report.processingError}</p>
            )}
          </div>
        )}

        {/* Explainable AI Workspace */}
        <section className="mb-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-4 space-y-4">
            <div className="bg-slate-900/85 border border-slate-700 rounded-xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wide mb-3">Analysis Input</h2>

              <label className="block text-xs font-medium text-slate-300 mb-1">Prompt</label>
              <textarea
                value={analysisPrompt}
                onChange={(event) => setAnalysisPrompt(event.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Describe what you want the AI to explain"
              />

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Language</label>
                  <select
                    value={language}
                    onChange={(event) => setLanguage(event.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 text-slate-100 px-2 py-2 text-sm"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish (mock)</option>
                    <option value="fr">French (mock)</option>
                    <option value="hi">Hindi (mock)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Mode</label>
                  <div className="flex rounded-lg border border-slate-700 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setAudienceMode('patient')}
                      className={`flex-1 px-2 py-2 text-xs font-medium ${
                        audienceMode === 'patient' ? 'bg-primary-600 text-white' : 'bg-slate-950 text-slate-300'
                      }`}
                    >
                      Patient
                    </button>
                    <button
                      type="button"
                      onClick={() => setAudienceMode('doctor')}
                      className={`flex-1 px-2 py-2 text-xs font-medium ${
                        audienceMode === 'doctor' ? 'bg-primary-600 text-white' : 'bg-slate-950 text-slate-300'
                      }`}
                    >
                      Doctor
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={runAnalysis}
                className="mt-4 w-full rounded-lg bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 text-sm font-semibold"
              >
                Run Explainable Analysis
              </button>
            </div>

            <FollowUpQA
              analysisId={activeAnalysisId || ''}
              onSubmit={runFollowUp}
              disabled={!activeAnalysisId}
              isLoading={analysisStatus === 'pending' || analysisStatus === 'processing'}
            />

            <AnalysisHistoryPanel
              items={analysisHistory}
              activeAnalysisId={activeAnalysisId}
              onSelect={selectHistoryResult}
            />

            {metrics && (
              <div className="bg-slate-900/85 border border-slate-700 rounded-xl p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wide mb-2">Metrics Snapshot</h3>
                <p className="text-xs text-slate-300">Analyses: {metrics.analyses}</p>
                <p className="text-xs text-slate-300">Avg confidence: {Math.round(metrics.confidence.average * 100)}%</p>
                <p className="text-xs text-slate-300">Avg latency: {Math.round(metrics.responseTime.averageMs)} ms</p>
                <p className="text-xs text-slate-300">Mock accuracy: {Math.round(metrics.mockAccuracy * 100)}%</p>
              </div>
            )}
          </aside>

          <div className="lg:col-span-8 space-y-4">
            {(analysisStatus === 'pending' || analysisStatus === 'processing') && (
              <AiThinkingCard status={analysisStatus === 'pending' ? 'pending' : 'processing'} />
            )}

            {analysisResult?.status === 'failed' && (
              <div className="bg-rose-950/35 border border-rose-800/40 rounded-xl p-5">
                <h3 className="font-semibold text-rose-200">Analysis failed</h3>
                <p className="text-sm text-rose-200 mt-1">{analysisResult.error || 'Unable to generate result'}</p>
              </div>
            )}

            {analysisResult?.status === 'completed' && (
              <>
                <div className="bg-slate-900/85 border border-slate-700 rounded-xl p-5 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-100 mb-2">{analysisResult.diagnosis}</h2>
                  <p className="text-sm text-slate-300">
                    Model: {analysisResult.metadata?.modelUsed} • Latency: {analysisResult.metadata?.latency} ms
                  </p>
                </div>

                <ConfidenceDisplay
                  value={displayConfidence}
                  level={getConfidenceLevel(displayConfidence)}
                  explanation={
                    analysisResult.structuredExplanation?.confidenceExplanation ||
                    'Confidence is estimated from data quality and model evidence.'
                  }
                  latency={analysisResult.metadata?.latency}
                  modelUsed={analysisResult.metadata?.modelUsed}
                  cacheHit={analysisResult.metadata?.cacheHit}
                />

                {analysisResult.structuredExplanation ? (
                  <ExplanationPanel
                    explanation={analysisResult.structuredExplanation}
                    audienceMode={analysisResult.audienceMode || audienceMode}
                  />
                ) : analysisResult.explanation ? (
                  <div className="bg-slate-900/85 border border-slate-700 rounded-xl p-5 shadow-sm space-y-4">
                    <h3 className="text-base font-semibold text-slate-100">Structured Explanation</h3>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Observation</p>
                      <p className="text-sm text-slate-200">{analysisResult.explanation.observation}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Pattern</p>
                      <p className="text-sm text-slate-200">{analysisResult.explanation.pattern}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Reasoning</p>
                      <p className="text-sm text-slate-200">{analysisResult.explanation.reasoning}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Conclusion</p>
                      <p className="text-sm text-slate-200">{analysisResult.explanation.conclusion}</p>
                    </div>
                  </div>
                ) : null}

                {!!timelineSteps.length && <ReasoningTimeline steps={timelineSteps} />}
                <HeatmapMock heatmap={analysisResult.heatmap} />
              </>
            )}

            {analysisStatus === 'idle' && (
              <div className="bg-slate-900/75 border border-dashed border-slate-700 rounded-xl p-8 text-center">
                <h3 className="text-lg font-semibold text-slate-100">Run AI Analysis</h3>
                <p className="text-sm text-slate-300 mt-2">
                  Start an explainable run to generate observation, pattern, diagnosis, confidence, and reasoning steps.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Health Summary */}
        {report.healthSummary && (
          <div className="mb-6">
            <HealthSummary summary={report.healthSummary} />
          </div>
        )}

        {/* Health Risk Assessment */}
        {report.riskAssessment && (
          <div className="mb-6">
            <RiskAssessment data={report.riskAssessment} />
          </div>
        )}

        {/* Parameters Grid */}
        {report.parameters.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-100 mb-4">Test Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {report.parameters.map((param, index) => (
                <ParameterCard key={index} parameter={param} />
              ))}
            </div>
          </div>
        )}

        {/* Trends */}
        {report.parameters.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-100 mb-4">Parameter Trends</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {report.parameters.slice(0, 4).map((param, index) => (
                <TrendChart key={index} parameterName={param.name} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
