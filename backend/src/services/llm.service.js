class LlmService {
  /**
   * Produces a deterministic mock diagnosis and confidence score from extracted signals.
   */
  async infer({ preprocessedInput, visualFindings = [], audienceMode = 'patient', contextResult = null, followUpQuestion = '' }) {
    const signals = [
      ...(preprocessedInput.keySignals || []),
      ...visualFindings,
    ];

    const abnormalScore = preprocessedInput.abnormalCount || 0;
    const criticalScore = preprocessedInput.criticalCount || 0;
    const signalWeight = Math.min(1, (abnormalScore * 0.09) + (criticalScore * 0.2) + (signals.length * 0.04));
    const confidence = Math.max(0.4, Math.min(0.97, Number((0.52 + signalWeight).toFixed(2))));

    const diagnosis = this.selectDiagnosis({
      text: preprocessedInput.textBlob,
      abnormalScore,
      criticalScore,
      contextResult,
    });

    const reasoningSteps = this.buildReasoningSteps({
      diagnosis,
      signals,
      confidence,
      followUpQuestion,
      audienceMode,
      contextResult,
    });

    const audienceLabel = audienceMode === 'doctor' ? 'clinical' : 'patient_friendly';

    return {
      modelUsed: 'llm-mock-medexplain-v2',
      audienceLabel,
      diagnosis,
      confidence,
      reasoningSteps,
      mockAccuracy: Number((0.72 + (confidence - 0.5) * 0.35).toFixed(2)),
    };
  }

  selectDiagnosis({ text, abnormalScore, criticalScore, contextResult }) {
    const lower = (text || '').toLowerCase();

    if (criticalScore >= 1) {
      return 'High-risk biomarker profile requiring prompt clinical review';
    }

    if (lower.includes('glucose') || lower.includes('hba1c')) {
      return 'Metabolic dysregulation pattern consistent with glucose-control concerns';
    }

    if (lower.includes('ldl') || lower.includes('cholesterol') || lower.includes('triglyceride')) {
      return 'Cardiometabolic risk pattern with lipid irregularities';
    }

    if (lower.includes('creatinine') || lower.includes('egfr')) {
      return 'Possible renal stress pattern suggested by kidney-related markers';
    }

    if (contextResult && contextResult.diagnosis) {
      return `Follow-up refinement: ${contextResult.diagnosis}`;
    }

    if (abnormalScore >= 2) {
      return 'Mixed biomarker variation requiring clinical follow-up';
    }

    return 'Overall profile appears near expected ranges with preventive monitoring advised';
  }

  buildReasoningSteps({ diagnosis, signals, confidence, followUpQuestion, audienceMode, contextResult }) {
    const steps = [
      {
        step: 1,
        title: 'Observation',
        description: `Detected ${signals.length} salient signal(s) from provided clinical context.`,
        evidence: signals.slice(0, 3),
      },
      {
        step: 2,
        title: 'Pattern Mapping',
        description: 'Mapped extracted signals to known risk archetypes and biomarker trend families.',
        evidence: ['Metabolic profile mapping', 'Inflammation/risk triage heuristic'],
      },
      {
        step: 3,
        title: 'Diagnostic Hypothesis',
        description: diagnosis,
        evidence: contextResult ? ['Incorporated prior result context'] : ['Current input only'],
      },
      {
        step: 4,
        title: 'Confidence Estimation',
        description: `Confidence calibrated at ${Math.round(confidence * 100)}% using signal density and consistency checks.`,
        evidence: ['Signal consistency', 'Abnormal marker density'],
      },
    ];

    if (followUpQuestion) {
      steps.push({
        step: 5,
        title: 'Follow-up Resolution',
        description: audienceMode === 'doctor'
          ? `Addressed targeted follow-up query in clinical style: "${followUpQuestion}".`
          : `Addressed your follow-up question in plain language: "${followUpQuestion}".`,
        evidence: ['Contextual Q&A refinement'],
      });
    }

    return steps;
  }
}

module.exports = new LlmService();
