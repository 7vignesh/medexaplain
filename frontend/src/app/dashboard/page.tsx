'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import StatsCards from '@/components/dashboard/StatsCards';
import UploadSection from '@/components/dashboard/UploadSection';
import RecentReports from '@/components/dashboard/RecentReports';
import { getUserStats } from '@/lib/api';
import { UserStats } from '@/types';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await getUserStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="page-shell flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-shell bg-gray-50 dark:bg-slate-950">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 rounded-2xl border border-primary-100 dark:border-slate-700 bg-gradient-to-r from-emerald-100/80 via-cyan-100/75 to-amber-100/70 dark:from-emerald-900/20 dark:via-cyan-900/20 dark:to-amber-900/20 p-6 lift-on-hover">
          <p className="text-xs uppercase tracking-[0.22em] text-gray-600 dark:text-slate-300 font-semibold">Health Intelligence Workspace</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-heading font-bold text-gray-900 dark:text-slate-100">
            Welcome back, <span className="headline-gradient">{user.displayName || 'User'}</span>
          </h1>
          <p className="mt-2 text-base text-gray-700 dark:text-slate-300 max-w-2xl">
            Upload reports, run explainable AI analysis, compare trends, and ask contextual follow-up questions in one place.
          </p>
        </div>

        {/* Stats Cards */}
        {stats && <StatsCards stats={stats} />}

        {/* Upload Section */}
        <div className="mt-8">
          <UploadSection />
        </div>

        {/* Recent Reports */}
        <div className="mt-8">
          <RecentReports />
        </div>

        {/* Disclaimer */}
        <div className="mt-8 glass-panel rounded-xl border-l-4 border-yellow-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-200">
                <strong>Important:</strong> This application is for informational purposes only and does not provide medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals for medical decisions.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
