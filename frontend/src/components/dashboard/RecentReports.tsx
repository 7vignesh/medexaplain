'use client';

import { useEffect, useState } from 'react';
import { getReports } from '@/lib/api';
import { Report } from '@/types';
import Link from 'next/link';
import { FileText, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function RecentReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await getReports({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' });
      setReports(response.data.data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (report: Report) => {
    if (report.criticalParameters > 0) return 'text-red-600';
    if (report.abnormalParameters > 0) return 'text-orange-600';
    return 'text-green-600';
  };

  const getStatusText = (report: Report) => {
    if (report.criticalParameters > 0) return 'Critical';
    if (report.abnormalParameters > 0) return 'Abnormal';
    return 'Normal';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h2>
        <div className="flex justify-center py-8">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Reports</h2>
        <Link href="/reports" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          View all →
        </Link>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No reports yet</p>
          <p className="text-xs text-gray-400">Upload your first medical report to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Link
              key={report._id}
              href={`/reports/${report._id}`}
              className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {report.fileName}
                    </p>
                    <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {format(new Date(report.createdAt), 'MMM dd, yyyy')}
                      </span>
                      <span>{report.parameters.length} parameters</span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  {report.processingStatus === 'completed' ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report)}`}>
                      {getStatusText(report)}
                    </span>
                  ) : report.processingStatus === 'processing' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Processing...
                    </span>
                  ) : report.processingStatus === 'failed' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Failed
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
