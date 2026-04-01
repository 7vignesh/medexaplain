/**
 * Multi-Language Explanation Service (TypeScript)
 * Provides translations and localized explanations for multiple audiences
 * Supports: English, Spanish, French, German, Japanese, Chinese
 */

type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh';

interface TranslationConfig {
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  audience: 'patient' | 'doctor';
}

interface LocalizedExplanation {
  language: SupportedLanguage;
  observation: string;
  pattern: string;
  diagnosis: string;
  confidenceExplanation: string;
  patientFriendly: string;
  recommendations: string[];
}

// Translation dictionary for common medical terms
const medicalTermTranslations: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    'elevated': 'elevated',
    'glucose': 'glucose',
    'diabetes': 'diabetes',
    'hypertension': 'high blood pressure',
    'abnormal': 'abnormal',
    'normal': 'normal',
    'critical': 'critical',
    'requires_attention': 'requires attention',
  },
  es: {
    'elevated': 'elevado',
    'glucose': 'glucosa',
    'diabetes': 'diabetes',
    'hypertension': 'presión arterial alta',
    'abnormal': 'anormal',
    'normal': 'normal',
    'critical': 'crítico',
    'requires_attention': 'requiere atención',
  },
  fr: {
    'elevated': 'élevé',
    'glucose': 'glucose',
    'diabetes': 'diabète',
    'hypertension': 'hypertension',
    'abnormal': 'anormal',
    'normal': 'normal',
    'critical': 'critique',
    'requires_attention': 'nécessite une attention',
  },
  de: {
    'elevated': 'erhöht',
    'glucose': 'Glukose',
    'diabetes': 'Diabetes',
    'hypertension': 'Hypertonie',
    'abnormal': 'abnormal',
    'normal': 'normal',
    'critical': 'kritisch',
    'requires_attention': 'erfordert Aufmerksamkeit',
  },
  ja: {
    'elevated': '高い',
    'glucose': 'グルコース',
    'diabetes': '糖尿病',
    'hypertension': '高血圧',
    'abnormal': '異常',
    'normal': '正常',
    'critical': '重篤',
    'requires_attention': '注意が必要',
  },
  zh: {
    'elevated': '升高',
    'glucose': '葡萄糖',
    'diabetes': '糖尿病',
    'hypertension': '高血压',
    'abnormal': '异常',
    'normal': '正常',
    'critical': '严重',
    'requires_attention': '需要注意',
  },
};

// Confidence level descriptions in multiple languages
const confidenceLevelDescriptions: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    'very_low': 'Very low confidence - additional information needed',
    'low': 'Low confidence - clinical correlation recommended',
    'moderate': 'Moderate confidence - reasonable analysis with limitations',
    'good': 'Good confidence - well-supported analysis',
    'high': 'High confidence - strong evidence and clear findings',
  },
  es: {
    'very_low': 'Confianza muy baja - información adicional necesaria',
    'low': 'Baja confianza - correlación clínica recomendada',
    'moderate': 'Confianza moderada - análisis razonable con limitaciones',
    'good': 'Buena confianza - análisis bien fundamentado',
    'high': 'Alta confianza - evidencia sólida y hallazgos claros',
  },
  fr: {
    'very_low': 'Très faible confiance - information supplémentaire nécessaire',
    'low': 'Faible confiance - corrélation clinique recommandée',
    'moderate': 'Confiance modérée - analyse raisonnable avec limitations',
    'good': 'Bonne confiance - analyse bien étayée',
    'high': 'Confiance élevée - preuves solides et conclusions claires',
  },
  de: {
    'very_low': 'Sehr niedriges Vertrauen - weitere Informationen erforderlich',
    'low': 'Niedriges Vertrauen - klinische Korrelation empfohlen',
    'moderate': 'Mäßiges Vertrauen - angemessene Analyse mit Einschränkungen',
    'good': 'Gutes Vertrauen - gut gestützte Analyse',
    'high': 'Hohes Vertrauen - starke Beweise und klare Ergebnisse',
  },
  ja: {
    'very_low': '非常に低い信頼度 - 追加情報が必要',
    'low': '低信頼度 - 臨床相関推奨',
    'moderate': '中程度の信頼度 - 制限はあるが合理的な分析',
    'good': '良好な信頼度 - よくサポートされた分析',
    'high': '高い信頼度 - 強い根拠と明確な所見',
  },
  zh: {
    'very_low': '信度非常低 - 需要额外信息',
    'low': '信度低 - 建议临床相关性',
    'moderate': '中等信度 - 虽有局限但合理分析',
    'good': '信度良好 - 证据充分的分析',
    'high': '信度高 - 证据充分且发现明确',
  },
};

class MultiLanguageService {
  /**
   * Translates medical text to target language
   */
  translateMedicalText(text: string, targetLanguage: SupportedLanguage): string {
    if (targetLanguage === 'en') {
      return text;
    }

    let translated = text;
    const terms = medicalTermTranslations.en;

    // Replace medical terms
    Object.entries(terms).forEach(([englishTerm, _]) => {
      const targetTerm = medicalTermTranslations[targetLanguage][englishTerm];
      if (targetTerm) {
        const regex = new RegExp(`\\b${englishTerm}\\b`, 'gi');
        translated = translated.replace(regex, targetTerm);
      }
    });

    return translated;
  }

  /**
   * Generates localized explanation
   */
  generateLocalizedExplanation(
    baseExplanation: {
      observation: string;
      pattern: string;
      diagnosis: string;
      confidenceExplanation: string;
      patientFriendly: string;
      recommendations?: string[];
      confidenceLevel?: string;
    },
    config: TranslationConfig
  ): LocalizedExplanation {
    const { targetLanguage, audience } = config;

    // If source is already target language, minimal translation needed
    if (config.sourceLanguage === targetLanguage) {
      return {
        language: targetLanguage,
        observation: baseExplanation.observation,
        pattern: baseExplanation.pattern,
        diagnosis: baseExplanation.diagnosis,
        confidenceExplanation: baseExplanation.confidenceExplanation,
        patientFriendly: baseExplanation.patientFriendly,
        recommendations: baseExplanation.recommendations || [],
      };
    }

    // Mock translation (in production, would use translation API like Google Translate)
    const translation = this.mockTranslate(baseExplanation, targetLanguage, audience);

    return {
      language: targetLanguage,
      observation: translation.observation,
      pattern: translation.pattern,
      diagnosis: translation.diagnosis,
      confidenceExplanation: translation.confidenceExplanation,
      patientFriendly: translation.patientFriendly,
      recommendations: translation.recommendations,
    };
  }

  /**
   * Mock translation (replace with real API in production)
   */
  private mockTranslate(
    baseExplanation: any,
    targetLanguage: SupportedLanguage,
    audience: string
  ): any {
    // Language-specific adjustments
    const languageAdjustments: Record<SupportedLanguage, Record<string, string>> = {
      es: {
        prefix: 'En español: ',
        patientSuffix: ' Consulte a su médico para obtener asesoramiento personalizado.',
        doctorSuffix: ' Se recomienda correlación clínica.',
      },
      fr: {
        prefix: 'En français: ',
        patientSuffix: ' Consultez votre médecin pour des conseils personnalisés.',
        doctorSuffix: ' La corrélation clinique est recommandée.',
      },
      de: {
        prefix: 'Auf Deutsch: ',
        patientSuffix: ' Konsultieren Sie Ihren Arzt für personalisierte Beratung.',
        doctorSuffix: ' Klinische Korrelation empfohlen.',
      },
      ja: {
        prefix: '日本語: ',
        patientSuffix: ' 個人的なアドバイスについては、医師にご相談ください。',
        doctorSuffix: ' 臨床相関を推奨します。',
      },
      zh: {
        prefix: '中文: ',
        patientSuffix: ' 请咨询您的医生获取个性化建议。',
        doctorSuffix: ' 建议进行临床相关性验证。',
      },
      en: {
        prefix: '',
        patientSuffix: ' Consult with your healthcare provider for personalized advice.',
        doctorSuffix: ' Clinical correlation recommended.',
      },
    };

    const adj = languageAdjustments[targetLanguage];

    return {
      observation: adj.prefix + baseExplanation.observation,
      pattern: adj.prefix + baseExplanation.pattern,
      diagnosis: adj.prefix + baseExplanation.diagnosis,
      confidenceExplanation: adj.prefix + baseExplanation.confidenceExplanation,
      patientFriendly: baseExplanation.patientFriendly + (audience === 'patient' ? adj.patientSuffix : ''),
      recommendations: (baseExplanation.recommendations || []).map((rec: string) => adj.prefix + rec),
    };
  }

  /**
   * Gets supported languages
   */
  getSupportedLanguages(): Array<{ code: SupportedLanguage; name: string }> {
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Español' },
      { code: 'fr', name: 'Français' },
      { code: 'de', name: 'Deutsch' },
      { code: 'ja', name: '日本語' },
      { code: 'zh', name: '中文' },
    ];
  }

  /**
   * Detects language from text (mock)
   */
  detectLanguage(text: string): SupportedLanguage {
    // Simple heuristic - in production would use proper language detection
    const chinesePattern = /[\u4E00-\u9FFF]/g;
    const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF]/g;

    if (chinesePattern.test(text)) return 'zh';
    if (japanesePattern.test(text)) return 'ja';

    return 'en';
  }

  /**
   * Converts between language and locale
   */
  getLocale(language: SupportedLanguage): string {
    const localeMap: Record<SupportedLanguage, string> = {
      en: 'en-US',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      ja: 'ja-JP',
      zh: 'zh-CN',
    };
    return localeMap[language];
  }

  /**
   * Formats numbers according to locale
   */
  formatNumber(value: number, language: SupportedLanguage): string {
    const locale = this.getLocale(language);
    return new Intl.NumberFormat(locale).format(value);
  }

  /**
   * Formats date according to locale
   */
  formatDate(date: Date, language: SupportedLanguage): string {
    const locale = this.getLocale(language);
    return new Intl.DateTimeFormat(locale).format(date);
  }
}

export default new MultiLanguageService();
