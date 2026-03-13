const {
  generateParameterExplanation,
  generateHealthSummary
} = require('../config/openrouter');

/**
 * AI Service for generating medical parameter explanations
 * Uses Mock data for development and testing
 */
class AIService {
  /**
   * Generate explanation for a single medical parameter
   * @param {Object} parameter - Parameter object with name, value, unit, normalRange, category
   * @returns {Promise<string>} - AI-generated explanation
   */
  async generateParameterExplanation(parameter) {
    try {
      const { name, value, unit, normalRange, category } = parameter;
      
      const explanation = await generateParameterExplanation(
        name,
        value,
        unit || 'N/A',
        normalRange || 'Not specified',
        category || 'General'
      );
      
      return explanation;
    } catch (error) {
      console.error('AI explanation generation error:', error);
      
      // Provide detailed fallback explanation if API fails
      const status = this.determineStatus(parameter.value, parameter.normalRange);
      const statusText = status === 'normal' ? '✅ Within normal range' : 
                        status === 'high' ? '🔺 Above normal range' : 
                        status === 'low' ? '🔻 Below normal range' : '⚠️ Needs review';
      
      const fallbackExplanation = `• Your Value: ${parameter.value} ${parameter.unit || ''}
• Normal Range: ${parameter.normalRange || 'Not specified'} ${parameter.unit || ''}
• Status: ${statusText}
• Category: ${parameter.category || 'General'}

💡 Tips:
• Maintain a balanced diet
• Stay hydrated
• Consult your doctor for personalized advice`;
      
      console.warn(`Using fallback explanation for ${parameter.name}`);
      return fallbackExplanation;
    }
  }

  /**
   * Helper function to determine status
   */
  determineStatus(value, normalRange) {
    if (!normalRange) return 'unknown';
    const numValue = parseFloat(value);
    const rangeParts = normalRange.split('-');
    if (rangeParts.length !== 2) return 'unknown';
    const min = parseFloat(rangeParts[0]);
    const max = parseFloat(rangeParts[1]);
    if (isNaN(numValue) || isNaN(min) || isNaN(max)) return 'unknown';
    if (numValue < min) return 'low';
    if (numValue > max) return 'high';
    return 'normal';
  }

  /**
   * Generate explanations for multiple parameters
   * @param {Array} parameters - Array of parameter objects
   * @returns {Promise<Array>} - Parameters with explanations added
   */
  async generateAllExplanations(parameters) {
    try {
      // Convert Mongoose documents to plain objects if needed
      const plainParams = parameters.map(p => {
        if (p.toObject) return p.toObject();
        return { ...p };
      });

      const explanationPromises = plainParams.map(async (param) => {
        const explanation = await this.generateParameterExplanation(param);
        return {
          ...param,
          explanation,
        };
      });
      
      return await Promise.all(explanationPromises);
    } catch (error) {
      console.error('Batch explanation generation error:', error);
      
      // Convert Mongoose documents to plain objects for fallback
      const plainParams = parameters.map(p => {
        if (p.toObject) return p.toObject();
        return { ...p };
      });

      // Return parameters with detailed fallback explanations
      const fallbackExplanations = plainParams.map(param => {
        const status = this.determineStatus(param.value, param.normalRange);
        const statusText = status === 'normal' ? '✅ Within normal range' : 
                          status === 'high' ? '🔺 Above normal' : 
                          status === 'low' ? '🔻 Below normal' : '⚠️ Needs review';
        
        return {
          ...param,
          explanation: `• Your Value: ${param.value || 'N/A'} ${param.unit || ''}
• Normal Range: ${param.normalRange || 'Not specified'}
• Status: ${statusText}

💡 Consult your doctor for advice.`,
        };
      });
      
      console.warn('Using fallback explanations for all parameters due to API error');
      return fallbackExplanations;
    }
  }

  /**
   * Generate overall health summary based on all parameters
   * @param {Array} parameters - Array of parameter objects with values and status
   * @returns {Promise<string>} - AI-generated health summary
   */
  async generateHealthSummary(parameters) {
    try {
      // Convert Mongoose documents to plain objects if needed
      const plainParams = parameters.map(p => {
        if (p.toObject) return p.toObject();
        return { ...p };
      });

      // Format test results for the AI
      const testResultsText = plainParams.map(param => {
        return `${param.name || 'Unknown'}: ${param.value || 'N/A'} ${param.unit || ''} (Normal: ${param.normalRange || 'N/A'}, Status: ${param.status || 'unknown'})`;
      }).join('\n');
      
      const summary = await generateHealthSummary(testResultsText);
      
      return summary;
    } catch (error) {
      console.error('Health summary generation error:', error);
      
      // Convert Mongoose documents to plain objects for fallback
      const plainParams = parameters.map(p => {
        if (p.toObject) return p.toObject();
        return { ...p };
      });

      // Provide detailed fallback summary if API fails
      const normalParams = plainParams.filter(p => p.status === 'normal');
      const abnormalParams = plainParams.filter(p => p.status !== 'normal');
      
      const normalList = normalParams.length > 0 
        ? normalParams.map(p => `- ✅ ${p.name || 'Unknown'}: ${p.value || 'N/A'} ${p.unit || ''}`).join('\n')
        : '- No parameters in normal range';
      
      const abnormalList = abnormalParams.length > 0
        ? abnormalParams.map(p => `- ⚠️ ${p.name || 'Unknown'}: ${p.value || 'N/A'} ${p.unit || ''} (Normal: ${p.normalRange || 'N/A'})`).join('\n')
        : '- All parameters are within normal range!';

      const fallbackSummary = `## 📊 Health Report Summary

### Overview
Your medical report contains ${plainParams.length} test parameter(s). Here's a breakdown of your results:

### ✅ Normal Results (${normalParams.length})
${normalList}

### ⚠️ Results Needing Attention (${abnormalParams.length})
${abnormalList}

### 💡 General Recommendations
- Schedule a follow-up appointment with your healthcare provider
- Discuss any abnormal results and their potential causes
- Ask about lifestyle changes that might help improve your values
- Consider retesting in a few weeks if values are borderline

---

⚠️ **IMPORTANT MEDICAL DISCLAIMER**
This summary is generated by AI for educational and informational purposes ONLY. It is NOT a medical diagnosis and should NOT replace professional medical advice. Please consult with your healthcare provider to discuss these results.`;
      
      console.warn('Using fallback summary due to API error');
      return fallbackSummary;
    }
  }
}

module.exports = new AIService();
