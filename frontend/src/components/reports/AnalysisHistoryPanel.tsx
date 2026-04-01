'use client';

import { AnalysisHistoryItem } from '@/types';

interface AnalysisHistoryPanelProps {
  items: AnalysisHistoryItem[];
  activeAnalysisId?: string | null;
  onSelect: (analysisId: string) => void;
}

export default function AnalysisHistoryPanel({ items, activeAnalysisId, onSelect }: AnalysisHistoryPanelProps) {
  return (
    <div className="bg-slate-900/85 border border-slate-700 rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wide mb-3">Analysis History</h3>

      {!items.length && (
        <p className="text-sm text-slate-400">No analysis runs yet. Start one to populate history.</p>
      )}

      <div className="space-y-2 max-h-64 overflow-auto pr-1">
        {items.map((item) => (
          <button
            key={item.analysisId}
            type="button"
            onClick={() => onSelect(item.analysisId)}
            className={`w-full text-left border rounded-lg p-3 transition ${
              activeAnalysisId === item.analysisId
                ? 'border-primary-500 bg-primary-900/30'
                : 'border-slate-700 hover:border-slate-600 bg-slate-950'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {new Date(item.createdAt).toLocaleTimeString()}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                item.status === 'completed'
                  ? 'bg-emerald-100 text-emerald-700'
                  : item.status === 'failed'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-amber-100 text-amber-700'
              }`}>
                {item.status}
              </span>
            </div>

            <p className="text-sm text-slate-100 line-clamp-2">
              {item.diagnosis || 'Pending diagnosis...'}
            </p>

            {typeof item.confidence === 'number' && (
              <p className="text-xs text-slate-300 mt-1">
                Confidence: {Math.round(item.confidence * 100)}%
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
