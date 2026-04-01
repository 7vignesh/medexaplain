import { FileText } from 'lucide-react';

interface HealthSummaryProps {
  summary: string;
}

export default function HealthSummary({ summary }: HealthSummaryProps) {
  return (
    <div className="bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-cyan-950/70 rounded-xl shadow-sm border border-slate-700 p-6">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-500/30">
            <FileText className="h-5 w-5 text-cyan-300" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-100 mb-2">AI Health Summary</h3>
          <div className="text-sm">
            <p className="text-slate-300 leading-relaxed whitespace-pre-line">{summary}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
