'use client';

import { AlertCircle, TrendingUp, Heart, Shield } from 'lucide-react';
import { RiskAssessment as RiskAssessmentData } from '@/types';

interface RiskAssessmentProps {
  data: RiskAssessmentData;
  loading?: boolean;
}

export default function RiskAssessment({ data, loading = false }: RiskAssessmentProps) {
  if (loading) {
    return (
      <div className="bg-slate-900/90 rounded-xl shadow-md border border-slate-700 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
        <p className="text-center mt-4 text-slate-300">Generating health risk assessment...</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const seriousnessLevel = data.seriousnessLevel || 5;

  const getRiskCategory = (level: number) => {
    if (level <= 2) return 'Minimal';
    if (level <= 4) return 'Low';
    if (level <= 6) return 'Moderate';
    if (level <= 8) return 'High';
    return 'Critical';
  };

  const getRiskColor = (level: number) => {
    if (level <= 2) return { bg: 'bg-emerald-900/20', border: 'border-emerald-700/40', text: 'text-emerald-300', gauge: 'bg-emerald-500' };
    if (level <= 4) return { bg: 'bg-sky-900/20', border: 'border-sky-700/40', text: 'text-sky-300', gauge: 'bg-sky-500' };
    if (level <= 6) return { bg: 'bg-amber-900/20', border: 'border-amber-700/40', text: 'text-amber-300', gauge: 'bg-amber-500' };
    if (level <= 8) return { bg: 'bg-orange-900/20', border: 'border-orange-700/40', text: 'text-orange-300', gauge: 'bg-orange-500' };
    return { bg: 'bg-rose-900/20', border: 'border-rose-700/40', text: 'text-rose-300', gauge: 'bg-rose-500' };
  };

  const colors = getRiskColor(seriousnessLevel);

  return (
    <div className="space-y-6">
      {/* Legal Disclaimer */}
      <div className="bg-rose-950/50 border-l-4 border-rose-500 p-4 rounded-lg">
        <div className="flex gap-3">
          <AlertCircle className="text-rose-300 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-rose-200">⚠️ Important Medical Disclaimer</h3>
            <p className="text-rose-100/90 text-sm mt-2">
              This AI-generated health risk assessment is <strong>NOT a medical diagnosis</strong> and should not be used for self-diagnosis.
              It is for educational purposes only. <strong>Always consult with a qualified healthcare provider</strong> before making any health decisions.
              The AI analysis has limitations and may not account for your complete medical history.
            </p>
          </div>
        </div>
      </div>

      {/* Seriousness Level Gauge */}
      <div className={`${colors.bg} border ${colors.border} rounded-xl p-6`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Health Risk Assessment</h2>
            <p className={`text-sm ${colors.text} font-semibold mt-1`}>Risk Category: {getRiskCategory(seriousnessLevel)}</p>
          </div>
          <Heart className={`${colors.text}`} size={32} />
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-300">Seriousness Level</span>
            <span className={`text-3xl font-bold ${colors.text}`}>{seriousnessLevel}/10</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
            <div
              className={`${colors.gauge} h-full transition-all duration-500 ease-out`}
              style={{ width: `${(seriousnessLevel / 10) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-2">
            <span>Minimal</span>
            <span>Moderate</span>
            <span>Critical</span>
          </div>
        </div>
      </div>

      {/* Clinical Analysis & Justification */}
      <div className="bg-cyan-950/35 border border-cyan-800/40 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
          <Shield size={20} className="text-cyan-300" />
          Clinical Analysis & Justification
        </h3>
        <p className="text-slate-300 leading-relaxed text-sm">
          {(data.visualJustification && data.visualJustification.trim().length > 0)
            ? data.visualJustification
            : 'Generating detailed clinical analysis...'}
        </p>
      </div>

      {/* Disease Risks */}
      {data.diseaseRisks && data.diseaseRisks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <AlertCircle size={20} className="text-amber-400" />
            Potential Health Conditions (Risk Assessment)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.diseaseRisks.map((risk, index) => (
              <div key={index} className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-slate-100">{risk.disease}</h4>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    risk.riskPercentage >= 70 ? 'bg-rose-900/50 text-rose-200' :
                    risk.riskPercentage >= 40 ? 'bg-amber-900/50 text-amber-200' :
                    'bg-emerald-900/50 text-emerald-200'
                  }`}>
                    {risk.riskPercentage}%
                  </span>
                </div>

                <div className="mb-3">
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-full rounded-full transition-all ${
                        risk.riskPercentage >= 70 ? 'bg-rose-500' :
                        risk.riskPercentage >= 40 ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${risk.riskPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {risk.keyIndicators && risk.keyIndicators.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-slate-400 mb-1">Key Indicators:</p>
                    <div className="flex flex-wrap gap-1">
                      {risk.keyIndicators.map((indicator, idx) => (
                        <span key={idx} className="inline-block bg-slate-800 text-slate-200 text-xs px-2 py-1 rounded">
                          {indicator}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-sm text-slate-300">{risk.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Influencing Parameters */}
      {data.topInfluencingParameters && data.topInfluencingParameters.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-violet-400" />
            Most Impactful Parameters
          </h3>
          <div className="space-y-3">
            {data.topInfluencingParameters.map((param, index) => (
              <div key={index} className="bg-slate-900/80 border border-slate-700 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-slate-100">#{index + 1} {param.name}</h4>
                  <span className="text-sm font-bold text-violet-200 bg-violet-900/50 px-2 py-1 rounded">
                    Impact Score: {param.impactScore}%
                  </span>
                </div>

                <div className="mb-3">
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="h-full bg-violet-500 rounded-full transition-all"
                      style={{ width: `${param.impactScore}%` }}
                    ></div>
                  </div>
                </div>

                <p className="text-sm text-slate-300">{param.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Actions */}
      {data.recommendedActions && data.recommendedActions.length > 0 && (
        <div className="bg-emerald-950/35 border border-emerald-800/40 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Recommended Actions</h3>
          <ul className="space-y-2">
            {data.recommendedActions.map((action, index) => (
              <li key={index} className="flex items-start gap-3 text-slate-300">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">
                  {index + 1}
                </span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Final Disclaimer */}
      <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4">
        <p className="text-xs text-slate-400 text-center">
          <strong>Remember:</strong> This assessment is provided as educational content. It does not replace professional medical advice.
          Please consult with a qualified healthcare provider for accurate diagnosis and treatment recommendations.
        </p>
      </div>
    </div>
  );
}
