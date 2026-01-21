import { FileText } from 'lucide-react';

interface HealthSummaryProps {
  summary: string;
}

export default function HealthSummary({ summary }: HealthSummaryProps) {
  return (
    <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg shadow-sm border border-primary-200 p-6">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary-600" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Health Summary</h3>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{summary}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
