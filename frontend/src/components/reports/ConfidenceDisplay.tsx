'use client';

import React from 'react';
import { TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface ConfidenceLevel {
  value: number;
  level: 'very_low' | 'low' | 'moderate' | 'good' | 'high';
  explanation: string;
  latency?: number;
  modelUsed?: string;
  cacheHit?: boolean;
}

const getConfidenceColor = (level: string): string => {
  switch (level) {
    case 'very_low':
      return 'from-rose-950 to-rose-900 border-rose-700';
    case 'low':
      return 'from-amber-950 to-amber-900 border-amber-700';
    case 'moderate':
      return 'from-yellow-950 to-yellow-900 border-yellow-700';
    case 'good':
      return 'from-emerald-950 to-emerald-900 border-emerald-700';
    case 'high':
      return 'from-cyan-950 to-cyan-900 border-cyan-700';
    default:
      return 'from-slate-900 to-slate-800 border-slate-700';
  }
};

const getConfidenceIcon = (level: string) => {
  switch (level) {
    case 'very_low':
    case 'low':
      return <AlertCircle className="w-5 h-5 text-rose-300" />;
    case 'good':
    case 'high':
      return <CheckCircle className="w-5 h-5 text-emerald-300" />;
    default:
      return <TrendingUp className="w-5 h-5 text-slate-300" />;
  }
};

const getLevelText = (level: string): string => {
  const map: Record<string, string> = {
    very_low: 'Very Low',
    low: 'Low',
    moderate: 'Moderate',
    good: 'Good',
    high: 'High',
  };
  return map[level] || 'Unknown';
};

export const ConfidenceDisplay: React.FC<ConfidenceLevel> = ({
  value,
  level,
  explanation,
  latency,
  modelUsed,
  cacheHit,
}) => {
  const percentage = Math.round(value * 100);

  return (
    <div className={`bg-gradient-to-br ${getConfidenceColor(level)} border rounded-xl p-5 shadow-sm`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {getConfidenceIcon(level)}
          <h3 className="text-sm font-semibold text-slate-100">Confidence Score</h3>
        </div>
        <span className="text-2xl font-bold text-slate-100">{percentage}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-900/50 rounded-full h-2 mb-3 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${
            level === 'high'
              ? 'from-cyan-500 to-emerald-500'
              : level === 'good'
                ? 'from-emerald-500 to-cyan-500'
                : level === 'moderate'
                  ? 'from-yellow-500 to-amber-500'
                  : 'from-rose-500 to-amber-500'
          } transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Level Badge */}
      <div className="inline-block mb-3">
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            level === 'high'
              ? 'bg-cyan-900/40 text-cyan-300'
              : level === 'good'
                ? 'bg-emerald-900/40 text-emerald-300'
                : level === 'moderate'
                  ? 'bg-yellow-900/40 text-yellow-300'
                  : 'bg-rose-900/40 text-rose-300'
          }`}
        >
          {getLevelText(level)} Confidence
        </span>
      </div>

      {/* Explanation */}
      <p className="text-sm text-slate-300 mb-4 leading-relaxed">{explanation}</p>

      {/* Metadata */}
      {(latency !== undefined || modelUsed || cacheHit !== undefined) && (
        <div className="border-t border-slate-700 pt-3 mt-4">
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
            {latency !== undefined && (
              <div>
                <span className="font-semibold">Latency:</span> {latency}ms
              </div>
            )}
            {modelUsed && (
              <div>
                <span className="font-semibold">Model:</span> {modelUsed}
              </div>
            )}
            {cacheHit !== undefined && (
              <div className="col-span-2">
                <span className="font-semibold">Cache:</span> {cacheHit ? 'Hit' : 'Miss'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfidenceDisplay;
