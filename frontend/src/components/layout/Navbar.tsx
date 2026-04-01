'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { LogOut, User, FileText } from 'lucide-react';
import Link from 'next/link';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/75 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-xl flex items-center justify-center shadow-md">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-heading font-bold headline-gradient">MedXplain</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="text-gray-700 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-300 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-primary-50 dark:hover:bg-slate-800 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/reports"
              className="text-gray-700 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-300 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-primary-50 dark:hover:bg-slate-800 transition-colors"
            >
              My Reports
            </Link>

            <div className="flex items-center space-x-3 border-l border-gray-200 dark:border-slate-700 pl-4 ml-2">
              <div className="flex items-center space-x-2">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-500 dark:text-slate-200" />
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 dark:text-slate-200 max-w-[190px] truncate">
                  {user?.displayName || user?.email}
                </span>
              </div>
              <button
                onClick={logout}
                className="text-gray-500 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
