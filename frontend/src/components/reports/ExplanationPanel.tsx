'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { StructuredExplanation } from '@/types';

interface ExplanationPanelProps {
  explanation: StructuredExplanation;
  audienceMode?: 'patient' | 'doctor';
}

type ExpandableSection = 'observation' | 'pattern' | 'diagnosis';

export const ExplanationPanel: React.FC<ExplanationPanelProps> = ({
  explanation,
  audienceMode = 'patient',
}) => {
  const [expandedSections, setExpandedSections] = useState({
    observation: true,
    pattern: true,
    diagnosis: true,
  });

  const toggleSection = (section: ExpandableSection) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const displayText =
    audienceMode === 'patient'
      ? explanation.patientFriendlyExplanation || explanation.diagnosis
      : explanation.medicalExplanation || explanation.diagnosis;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-100">Analysis Explanation</h2>

      {/* Observation Section */}
      <div className="bg-gradient-to-br from-blue-950 to-blue-900 border border-blue-700 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('observation')}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-blue-900/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">👁️</span>
            <div className="text-left">
              <h3 className="font-semibold text-slate-100">Observation</h3>
              <p className="text-xs text-slate-400">What was detected in the data</p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-blue-300 transition-transform ${
              expandedSections.observation ? 'rotate-180' : ''
            }`}
          />
        </button>

        {expandedSections.observation && (
          <div className="px-5 py-4 border-t border-blue-700/50 bg-blue-950/50">
            <p className="text-slate-200 leading-relaxed">{explanation.observation}</p>
          </div>
        )}
      </div>

      {/* Pattern Section */}
      <div className="bg-gradient-to-br from-purple-950 to-purple-900 border border-purple-700 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('pattern')}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-purple-900/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">🔍</span>
            <div className="text-left">
              <h3 className="font-semibold text-slate-100">Pattern Identified</h3>
              <p className="text-xs text-slate-400">Patterns matched in the analysis</p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-purple-300 transition-transform ${
              expandedSections.pattern ? 'rotate-180' : ''
            }`}
          />
        </button>

        {expandedSections.pattern && (
          <div className="px-5 py-4 border-t border-purple-700/50 bg-purple-950/50">
            <p className="text-slate-200 leading-relaxed">{explanation.pattern}</p>
          </div>
        )}
      </div>

      {/* Diagnosis Section */}
      <div className="bg-gradient-to-br from-cyan-950 to-cyan-900 border border-cyan-700 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('diagnosis')}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-cyan-900/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">📋</span>
            <div className="text-left">
              <h3 className="font-semibold text-slate-100">Diagnosis</h3>
              <p className="text-xs text-slate-400">Final clinical conclusion</p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-cyan-300 transition-transform ${
              expandedSections.diagnosis ? 'rotate-180' : ''
            }`}
          />
        </button>

        {expandedSections.diagnosis && (
          <div className="px-5 py-4 border-t border-cyan-700/50 bg-cyan-950/50 space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-300 mb-2">
                {audienceMode === 'patient' ? 'In Simple Terms' : 'Medical Assessment'}
              </p>
              <p className="text-slate-200 leading-relaxed">{displayText}</p>
            </div>

            {audienceMode === 'patient' && explanation.medicalExplanation && (
              <details className="group">
                <summary className="cursor-pointer text-xs font-semibold text-cyan-300 hover:text-cyan-200">
                  📚 Medical Details (Advanced)
                </summary>
                <div className="mt-3 p-3 bg-slate-900/50 rounded border border-slate-700 text-xs text-slate-300">
                  {explanation.medicalExplanation}
                </div>
              </details>
            )}
          </div>
        )}
      </div>

      {/* Confidence Explanation */}
      <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-slate-700 rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-400 mb-2">Confidence Notes:</p>
        <p className="text-sm text-slate-300">{explanation.confidenceExplanation}</p>
      </div>
    </div>
  );
};

export default ExplanationPanel;
