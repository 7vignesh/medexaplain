/**
 * Mock AI Service - Returns realistic but hardcoded analysis
 * Useful for development and testing without API costs
 */

async function generateParameterExplanation(parameterName, value, unit, normalRange, category) {
  // Simple mock based on status
  const mockExplanations = {
    high: `• What it measures: Levels of ${parameterName} in your blood

• Your result: ${value} is above normal range (normal: ${normalRange} ${unit})

• What this means: Elevated levels may indicate metabolic changes

• Common causes: Diet, stress, medication, or underlying condition

• Quick tip: Consult your healthcare provider for further evaluation`,
    low: `• What it measures: Levels of ${parameterName} in your blood

• Your result: ${value} is below normal range (normal: ${normalRange} ${unit})

• What this means: Low levels may require dietary or lifestyle adjustments

• Common causes: Nutritional deficiency, absorption issues, or increased demand

• Quick tip: Discuss supplementation options with your doctor`,
    normal: `• What it measures: Levels of ${parameterName} in your blood

• Your result: ${value} is within normal range (${normalRange} ${unit})

• What this means: This value is healthy and within expected limits

• Common causes: Good dietary intake, normal metabolism

• Quick tip: Maintain current lifestyle and continue regular checkups`,
  };

  return mockExplanations.normal; // Default to normal
}

async function generateHealthSummary(testResultsText) {
  return `📊 SUMMARY
• Total tests: 5
• Normal: 3 | Abnormal: 2

✅ NORMAL RESULTS
- Hemoglobin A1C: 5.2%
- TSH: 2.1 mIU/L
- Vitamin B12: 450 pg/mL

⚠️ NEEDS ATTENTION
- Vitamin D: 18 ng/mL (LOW - supplementation recommended)
- Free T3: 2.8 pg/mL (LOW - consult endocrinologist)

💡 RECOMMENDATIONS
• Increase Vitamin D intake through sunlight exposure and supplements
• Consult with an endocrinologist regarding thyroid function
• Maintain a balanced diet rich in iodine and selenium

⚠️ Disclaimer: For educational purposes only. Consult your doctor.`;
}

async function generateWithRetry(prompt, maxRetries = 3) {
  return `{
  "seriousnessLevel": 4,
  "diseaseRisks": [
    {
      "disease": "Hypothyroidism",
      "riskPercentage": 35,
      "keyIndicators": ["Low Free T3", "Low TSH"],
      "explanation": "Thyroid hormone levels are suboptimal, suggesting possible thyroid dysfunction."
    },
    {
      "disease": "Vitamin D Deficiency",
      "riskPercentage": 55,
      "keyIndicators": ["Low Vitamin D"],
      "explanation": "Vitamin D is significantly below optimal range, which can affect bone health and immunity."
    }
  ],
  "topInfluencingParameters": [
    {
      "name": "Vitamin D",
      "impactScore": 78,
      "reason": "Critically low levels affect immune function and bone metabolism"
    },
    {
      "name": "Free T3",
      "impactScore": 62,
      "reason": "Low thyroid hormone levels can affect metabolism and energy"
    }
  ],
  "clinicalAnalysis": "Overall health status shows moderate concern primarily driven by nutritional deficiencies. Vitamin D and thyroid markers require attention through supplementation and specialist consultation. Other parameters are within acceptable ranges.",
  "recommendedActions": [
    "Begin Vitamin D supplementation (2000-4000 IU daily)",
    "Undergo thyroid panel with endocrinologist",
    "Increase intake of iodine-rich foods",
    "Regular follow-up testing in 8-12 weeks"
  ]
}`;
}

module.exports = {
  generateParameterExplanation,
  generateHealthSummary,
  generateWithRetry,
};
