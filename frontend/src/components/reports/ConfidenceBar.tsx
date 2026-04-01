'use client';

interface ConfidenceBarProps {
  confidence?: number;
}

export default function ConfidenceBar({ confidence = 0 }: ConfidenceBarProps) {
  const bounded = Math.max(0, Math.min(1, confidence));
  const percent = Math.round(bounded * 100);

  const tone = percent >= 75
    ? 'bg-emerald-500'
    : percent >= 50
      ? 'bg-amber-500'
      : 'bg-rose-500';

  return (
    <div className="bg-slate-900/85 border border-slate-700 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Model Confidence</h3>
        <span className="text-lg font-bold text-slate-100">{percent}%</span>
      </div>

      <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
        <div
          className={`${tone} h-full transition-all duration-500 ease-out`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="text-xs text-slate-400 mt-2">
        Confidence is a calibrated heuristic score from 0 to 1, not a clinical certainty.
      </p>
    </div>
  );
}
