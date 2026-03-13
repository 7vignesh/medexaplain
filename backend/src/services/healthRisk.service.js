const { generateWithRetry } = require('../config/openrouter');
/**
 * Health Risk Assessment Service
 * Analyzes medical parameters to generate risk scores, disease predictions, and clinical insights
 */
class HealthRiskService {
  /**
   * Generate comprehensive risk assessment from medical parameters
   * @param {Array} parameters - Array of medical parameters with values
   * @param {String} healthSummary - Overall health summary from AI analysis
   * @returns {Object} Risk assessment with seriousness, disease risks, and influencing parameters
   */
  async generateRiskAssessment(parameters, healthSummary) {
    try {
      const formattedParams = this.formatParametersForAnalysis(parameters);
      const riskAnalysis = await this.analyzeWithGemini(formattedParams, healthSummary);
      const parsedRisks = this.parseRiskAnalysis(riskAnalysis);
      
      return {
        seriousnessLevel: parsedRisks.seriousnessLevel,
        diseaseRisks: parsedRisks.diseaseRisks,
        topInfluencingParameters: parsedRisks.topInfluencingParameters,
        visualJustification: parsedRisks.visualJustification,
        recommendedActions: parsedRisks.recommendedActions,
        analysisDate: new Date(),
        version: '1.0',
      };
    } catch (error) {
      console.error('Error generating risk assessment:', error);
      throw new Error('Failed to generate risk assessment');
    }
  }

  /**
   * Format parameters into a readable string for AI analysis
   * @param {Array} parameters - Medical parameters
   * @returns {String} Formatted parameter string
   */
  formatParametersForAnalysis(parameters) {
    return parameters
      .map(p => {
        const status = p.status ? `(${p.status})` : '';
        const unit = p.unit ? ` ${p.unit}` : '';
        return `${p.name}: ${p.value}${unit} ${status}`;
      })
      .join('\n');
  }

  /**
   * Call Gemini API to analyze parameters and generate risk assessment
   * @param {String} formattedParams - Formatted parameters string
   * @param {String} healthSummary - Health summary from initial analysis
   * @returns {String} Raw risk assessment from Gemini
   */
  async analyzeWithGemini(formattedParams, healthSummary) {
    const timeLabel = `RiskAnalysis-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    console.time(timeLabel);
    const prompt = `You are a medical AI analyzing health parameters. Respond ONLY with valid JSON.

Parameters:
${formattedParams}

Summary: ${healthSummary || 'No summary available'}

Return ONLY this JSON (no markdown, no code blocks, no extra text):
{
  "seriousnessLevel": <number 1-10>,
  "diseaseRisks": [
    {
      "disease": "<condition>",
      "riskPercentage": <0-100>,
      "keyIndicators": ["<indicator1>", "<indicator2>"],
      "explanation": "<brief explanation>"
    }
  ],
  "topInfluencingParameters": [
    {
      "name": "<parameter>",
      "impactScore": <0-100>,
      "reason": "<reason>"
    }
  ],
  "clinicalAnalysis": "<detailed textual justification explaining the decision for the seriousness level and specific risks identified. Explain WHY these conclusions were reached.>",
  "recommendedActions": [
    "<action1>",
    "<action2>",
    "<action3>"
  ]
}

CRITICAL RULES:
- MUST include 2-3 disease risks
- MUST include 3-5 influencing parameters
- clinicalAnalysis MUST be provided to justify the decision
- All fields MUST be populated`;

    try {
      const response = await generateWithRetry(prompt);
      console.timeEnd(timeLabel);
      return response;
    } catch (error) {
      console.timeEnd(timeLabel);
      throw error;
    }
  }

  /**
   * Parse and validate Gemini's risk analysis response
   * @param {String} analysisText - Raw response from Gemini
   * @returns {Object} Parsed and validated risk assessment
   */
  parseRiskAnalysis(analysisText) {
    try {
      console.log('----- START RISK ANALYSIS PARSING -----');
      console.log('Raw Gemini Response Length:', analysisText.length);
      console.log('Raw Gemini Response Preview:', analysisText.substring(0, 500));
      
      // Extract JSON from response (handle markdown code blocks if present)
      let jsonString = analysisText.trim();
      
      // Remove markdown code blocks if present
      const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonString = jsonMatch[1].trim();
      }
      
      console.log('JSON String to parse:', jsonString.substring(0, 200) + '...');

      // Try to parse JSON
      const parsed = JSON.parse(jsonString);
      
      console.log('Parsed Object Keys:', Object.keys(parsed));

      console.log('✅ Parsed Risk Data:', {
        seriousnessLevel: parsed.seriousnessLevel,
        diseaseRisksCount: parsed.diseaseRisks?.length || 0,
        parametersCount: parsed.topInfluencingParameters?.length || 0
      });

      // Validate and sanitize response
      return {
        seriousnessLevel: Math.min(10, Math.max(1, parseInt(parsed.seriousnessLevel) || 5)),
        diseaseRisks: (parsed.diseaseRisks || [])
          .filter(risk => risk.disease) // Only include items with disease name
          .slice(0, 5) // Limit to top 5 diseases
          .map(risk => ({
            disease: risk.disease || 'Unknown',
            riskPercentage: Math.min(100, Math.max(0, parseInt(risk.riskPercentage) || 0)),
            keyIndicators: Array.isArray(risk.keyIndicators) ? risk.keyIndicators.slice(0, 3) : [],
            explanation: risk.explanation || 'No explanation provided',
          })),
        topInfluencingParameters: (parsed.topInfluencingParameters || [])
          .filter(param => param.name) // Only include items with parameter name
          .slice(0, 5) // Limit to top 5 parameters
          .map(param => ({
            name: param.name || 'Unknown',
            impactScore: Math.min(100, Math.max(0, parseInt(param.impactScore) || 0)),
            reason: param.reason || 'No reason provided',
          })),
        visualJustification: parsed.clinicalAnalysis || parsed.visualJustification || 'Clinical analysis pending...',
        recommendedActions: Array.isArray(parsed.recommendedActions)
          ? parsed.recommendedActions.slice(0, 5).filter(action => typeof action === 'string')
          : [
              'Consult with a qualified healthcare provider',
              'Schedule appropriate medical appointments',
              'Follow medical professional guidance',
            ],
      };
    } catch (error) {
      console.error('❌ Error parsing risk analysis:', error.message);
      console.error('Response text was:', analysisText.substring(0, 200));
      
      // Return safe default response if parsing fails
      return {
        seriousnessLevel: 5,
        diseaseRisks: [],
        topInfluencingParameters: [],
        visualJustification: 'Unable to generate detailed risk assessment at this time. Please consult a healthcare provider for proper diagnosis.',
        recommendedActions: [
          'Consult with a healthcare provider for proper diagnosis',
          'Do not rely solely on this AI assessment',
        ],
      };
    }
  }

}

module.exports = new HealthRiskService();
