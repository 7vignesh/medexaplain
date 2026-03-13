'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { getReports } from '@/lib/api';
import { Report } from '@/types';
import Link from 'next/link';
import { FileText, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'normal' | 'abnormal'>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    try {
      const response = await getReports({ limit: 50, sortBy: 'createdAt', sortOrder: 'desc' });
      setReports(response.data.data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = useMemo(() => reports.filter(report => {
    if (filter === 'all') return true;
    if (filter === 'normal') return report.abnormalParameters === 0;
    if (filter === 'abnormal') return report.abnormalParameters > 0;
    return true;
  }), [reports, filter]);

  const normalCount = useMemo(() => reports.filter(r => r.abnormalParameters === 0).length, [reports]);
  const abnormalCount = useMemo(() => reports.filter(r => r.abnormalParameters > 0).length, [reports]);

  const getStatusColor = (report: Report) => {
    if (report.criticalParameters > 0) return 'bg-red-100 text-red-800';
    if (report.abnormalParameters > 0) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Reports</h1>
          <p className="mt-2 text-sm text-gray-600">
            View and manage your medical reports
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Reports ({reports.length})
          </button>
          <button
            onClick={() => setFilter('normal')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'normal'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Normal ({normalCount})
          </button>
          <button
            onClick={() => setFilter('abnormal')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'abnormal'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Abnormal ({abnormalCount})
          </button>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner"></div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No reports found</h3>
            <p className="mt-2 text-sm text-gray-500">
              {filter === 'all'
                ? 'Upload your first medical report to get started'
                : `No ${filter} reports found`}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <li key={report._id}>
                  <Link
                    href={`/reports/${report._id}`}
                    className="block hover:bg-gray-50 transition-colors"
                  >
                    <div className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                              <FileText className="h-5 w-5 text-primary-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {report.fileName}
                            </p>
                            <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {format(new Date(report.createdAt), 'MMM dd, yyyy')}
                              </span>
                              <span className="flex items-center">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {report.parameters.length} parameters
                              </span>
                              {report.abnormalParameters > 0 && (
                                <span className="flex items-center text-orange-600">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  {report.abnormalParameters} abnormal
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {report.processingStatus === 'completed' ? (
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report)}`}>
                              {report.criticalParameters > 0
                                ? 'Critical'
                                : report.abnormalParameters > 0
                                ? 'Abnormal'
                                : 'Normal'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {report.processingStatus}
                            </span>
                          )}
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
