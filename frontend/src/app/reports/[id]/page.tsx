'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getReportById, deleteReport, generateRiskAssessment } from '@/lib/api';
import { Report } from '@/types';
import Navbar from '@/components/layout/Navbar';
import ParameterCard from '@/components/reports/ParameterCard';
import HealthSummary from '@/components/reports/HealthSummary';
import TrendChart from '@/components/reports/TrendChart';
import RiskAssessment from '@/components/reports/RiskAssessment';
import { Trash2, Download, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchReport(params.id as string);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
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
      intervalRef.current = setInterval(async () => {
        const res = await getReportById(id);
        const updatedReport = res.data.data;
        if (updatedReport.riskAssessmentStatus === 'completed' || updatedReport.riskAssessmentStatus === 'failed') {
          setReport(updatedReport);
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      }, 3000);
      setTimeout(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }, 120000);
    } catch (error) {
      console.error('Failed to trigger risk assessment:', error);
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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-500">Report not found</p>
            <Link href="/dashboard" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
              Return to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/reports" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to reports
          </Link>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{report.fileName}</h1>
              <p className="mt-1 text-sm text-gray-500">
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
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
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
            report.processingStatus === 'processing' ? 'bg-blue-50 text-blue-800' :
            report.processingStatus === 'failed' ? 'bg-red-50 text-red-800' :
            'bg-yellow-50 text-yellow-800'
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
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Results</h2>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Parameter Trends</h2>
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
