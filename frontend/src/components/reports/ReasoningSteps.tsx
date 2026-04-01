'use client';

import { ReasoningStep } from '@/types';

interface ReasoningStepsProps {
  steps?: ReasoningStep[];
}

export default function ReasoningSteps({ steps = [] }: ReasoningStepsProps) {
  if (!steps.length) {
    return null;
  }

  return (
    <div className="bg-slate-900/85 border border-slate-700 rounded-xl p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-100 mb-4">Step-by-Step Reasoning</h3>

      <ol className="space-y-3">
        {steps.map((step) => (
          <li key={`${step.step}-${step.title}`} className="rounded-lg border border-slate-700 bg-slate-950 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  {step.step}. {step.title}
                </p>
                <p className="text-sm text-slate-300 mt-1">{step.description}</p>
              </div>
            </div>

            {step.evidence?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {step.evidence.map((item) => (
                  <span key={item} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {item}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
