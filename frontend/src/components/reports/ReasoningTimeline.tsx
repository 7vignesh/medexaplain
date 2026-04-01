'use client';

import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import type { ReasoningStep } from '@/types/analysis';

interface ReasoningTimelineProps {
  steps: ReasoningStep[];
  currentStep?: number;
}

const getStageColor = (stage: string): string => {
  switch (stage) {
    case 'observation':
      return 'from-blue-950 to-blue-900 border-blue-700 text-blue-300';
    case 'analysis':
      return 'from-purple-950 to-purple-900 border-purple-700 text-purple-300';
    case 'pattern_recognition':
      return 'from-indigo-950 to-indigo-900 border-indigo-700 text-indigo-300';
    case 'diagnosis':
      return 'from-cyan-950 to-cyan-900 border-cyan-700 text-cyan-300';
    case 'recommendation':
      return 'from-emerald-950 to-emerald-900 border-emerald-700 text-emerald-300';
    default:
      return 'from-slate-900 to-slate-800 border-slate-700 text-slate-300';
  }
};

const getStageName = (stage: string): string => {
  return stage
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const ReasoningTimeline: React.FC<ReasoningTimelineProps> = ({ steps, currentStep = steps.length }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
        <span className="text-lg">🧠</span> Reasoning Steps
      </h3>

      <div className="relative">
        {/* Vertical line */}
        {steps.length > 1 && (
          <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gradient-to-b from-slate-700 to-slate-900" />
        )}

        {/* Steps */}
        <div className="space-y-6">
          {steps.map((step, idx) => (
            <div key={step.stepNumber} className="relative pl-16">
              {/* Circle indicator */}
              <div
                className={`absolute left-0 top-2 w-12 h-12 rounded-full flex items-center justify-center
                  ${idx < currentStep ? 'bg-emerald-900/40 border-emerald-700' : 'bg-slate-900/40 border-slate-700'}
                  border-2 transition-all duration-300`}
              >
                {idx < currentStep ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-300" />
                ) : (
                  <Circle className="w-6 h-6 text-slate-400" />
                )}
              </div>

              {/* Content card */}
              <div
                className={`bg-gradient-to-br ${getStageColor(
                  step.stage
                )} border rounded-lg p-4 transition-all duration-300 hover:shadow-lg`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-slate-100">{getStageName(step.stage)}</h4>
                    <p className="text-xs text-slate-400 mt-1">Step {step.stepNumber}</p>
                  </div>
                  {step.confidence !== undefined && (
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-100">
                        {Math.round(step.confidence * 100)}%
                      </div>
                      <div className="text-xs text-slate-400">confidence</div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-slate-200 mb-3 leading-relaxed">{step.description}</p>

                {/* Evidence */}
                {step.evidence && step.evidence.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <p className="text-xs font-semibold text-slate-400 mb-2">Supporting Evidence:</p>
                    <ul className="space-y-1">
                      {step.evidence.slice(0, 3).map((ev, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="text-slate-500 mt-1">•</span>
                          <span>{ev}</span>
                        </li>
                      ))}
                      {step.evidence.length > 3 && (
                        <li className="text-xs text-slate-400 italic">
                          +{step.evidence.length - 3} more...
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReasoningTimeline;
