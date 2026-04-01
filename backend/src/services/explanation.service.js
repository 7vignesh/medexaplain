class ExplanationService {
  buildExplanation({ llmOutput, visualFindings, preprocessedInput, language = 'en', audienceMode = 'patient' }) {
    const observation = this.toAudience(
      `Primary observations include ${visualFindings.slice(0, 2).join('; ') || 'general biomarker variation from the provided context'}.`,
      audienceMode
    );

    const pattern = this.toAudience(
      'The model identified a repeatable pattern by correlating abnormal markers, trend cues, and known risk clusters.',
      audienceMode
    );

    const reasoning = this.toAudience(
      llmOutput.reasoningSteps.map((item) => `${item.step}. ${item.title}: ${item.description}`).join(' '),
      audienceMode
    );

    const conclusion = this.toAudience(
      `${llmOutput.diagnosis}. This is an assistive AI interpretation and should be confirmed by a qualified clinician.`,
      audienceMode
    );

    const translated = this.translate({ language, observation, pattern, reasoning, conclusion });

    return {
      observation: translated.observation,
      pattern: translated.pattern,
      reasoning: translated.reasoning,
      conclusion: translated.conclusion,
    };
  }

  toAudience(text, audienceMode) {
    if (audienceMode === 'doctor') {
      return text
        .replace('assistive AI interpretation', 'non-diagnostic computational interpretation')
        .replace('repeatable pattern', 'clinically relevant pattern')
        .replace('qualified clinician', 'attending physician');
    }

    return text
      .replace('biomarker variation', 'changes in your test values')
      .replace('qualified clinician', 'doctor');
  }

  translate({ language, observation, pattern, reasoning, conclusion }) {
    if (!language || language.toLowerCase() === 'en') {
      return { observation, pattern, reasoning, conclusion };
    }

    const prefixMap = {
      es: '[ES]',
      fr: '[FR]',
      hi: '[HI]',
      ta: '[TA]',
    };

    const tag = prefixMap[language.toLowerCase()] || `[${language.toUpperCase()}]`;

    return {
      observation: `${tag} ${observation}`,
      pattern: `${tag} ${pattern}`,
      reasoning: `${tag} ${reasoning}`,
      conclusion: `${tag} ${conclusion}`,
    };
  }
}

module.exports = new ExplanationService();
