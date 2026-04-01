import { Parameter } from '@/types';
import { Activity } from 'lucide-react';

interface ParameterCardProps {
  parameter: Parameter;
}

export default function ParameterCard({ parameter }: ParameterCardProps) {
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'normal':
        return 'status-normal';
      case 'slightly_high':
      case 'slightly_low':
        return 'status-slightly_high';
      case 'high':
      case 'low':
        return 'status-high';
      case 'critical':
        return 'status-critical';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
        return '✓';
      case 'slightly_high':
      case 'slightly_low':
        return '⚠';
      case 'high':
      case 'low':
        return '↑';
      case 'critical':
        return '⚠⚠';
      default:
        return '○';
    }
  };

  return (
    <div className="bg-slate-900/85 rounded-xl shadow-sm border border-slate-700 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-100">{parameter.name}</h3>
          {parameter.category && (
            <p className="text-xs text-slate-400 mt-1">{parameter.category}</p>
          )}
        </div>
        <Activity className="h-5 w-5 text-cyan-300" />
      </div>

      <div className="mb-3">
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold text-slate-100">{parameter.value}</span>
          {parameter.unit && (
            <span className="text-sm text-slate-400">{parameter.unit}</span>
          )}
        </div>
        {parameter.normalRange && (
          <p className="text-xs text-slate-400 mt-1">
            Normal: {parameter.normalRange} {parameter.unit}
          </p>
        )}
      </div>

      <div className="mb-3">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusClass(parameter.status)}`}>
          <span className="mr-1">{getStatusIcon(parameter.status)}</span>
          {parameter.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {parameter.explanation && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <p className="text-sm text-slate-300 leading-relaxed">{parameter.explanation}</p>
        </div>
      )}
    </div>
  );
}
