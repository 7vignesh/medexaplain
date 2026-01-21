const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Initialize Google Gemini client
 */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Initialize Gemini model
 * Using gemini-flash-latest as it is the available stable version
 */
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

/**
 * Prompt template for medical parameter explanation
 */
const explanationTemplate = `You are a medical information assistant. Explain this test result in SHORT bullet points.

Parameter: {parameterName}
Value: {value} {unit}
Normal Range: {normalRange} {unit}
Category: {category}

Respond in this EXACT format (keep it brief, 4-6 bullet points total):

• What it measures: [One short sentence]
• Your result: [Value] is [above/below/within] normal range
• What this means: [One short sentence about implications]
• Common causes: [2-3 common factors if abnormal]
• Quick tip: [One actionable health tip]

⚠️ Consult your doctor for medical advice.

Response:`;

/**
 * Function to generate parameter explanation using Gemini
 */
async function generateParameterExplanation(parameterName, value, unit, normalRange, category) {
  try {
    const prompt = explanationTemplate
      .replace('{parameterName}', parameterName)
      .replace('{value}', value)
      .replace(/\{unit\}/g, unit || '')
      .replace('{normalRange}', normalRange || 'Not specified')
      .replace('{category}', category || 'General');

    const result = await geminiModel.generateContent(prompt);
    const text = await result.response.text();
    return text.trim();
  } catch (error) {
    console.error('Gemini explanation generation error:', error);
    throw error;
  }
}

/**
 * Prompt template for overall health summary
 */
const summaryTemplate = `Summarize these medical test results in a brief, easy-to-read format.

Test Results:
{testResults}

Respond in this EXACT format:

📊 SUMMARY
• Total tests: [number]
• Normal: [count] | Abnormal: [count]

✅ NORMAL RESULTS
[List each normal parameter in one line]

⚠️ NEEDS ATTENTION
[List each abnormal parameter with brief note]

💡 RECOMMENDATIONS
• [2-3 short actionable tips]

⚠️ Disclaimer: For educational purposes only. Consult your doctor.

Response:`;

/**
 * Function to generate health summary using Gemini
 */
async function generateHealthSummary(testResultsText) {
  try {
    const prompt = summaryTemplate.replace('{testResults}', testResultsText);
    
    const result = await geminiModel.generateContent(prompt);
    const text = await result.response.text();
    return text.trim();
  } catch (error) {
    console.error('Gemini health summary generation error:', error);
    throw error;
  }
}

/**
 * Generate content with retry logic for risk assessment
 * @param {String} prompt - The prompt to send to Gemini
 * @param {Number} maxRetries - Maximum number of retry attempts
 * @returns {String} Generated text from Gemini
 */
async function generateWithRetry(prompt, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await geminiModel.generateContent(prompt);
      const text = await result.response.text();
      return text.trim();
    } catch (error) {
      console.error(`Gemini API attempt ${attempt}/${maxRetries} failed:`, error.message);
      lastError = error;
      
      // Don't retry on the last attempt
      if (attempt < maxRetries) {
        // Exponential backoff: wait 1s, 2s, 4s
        const waitTime = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  // If all retries failed, throw the last error
  throw new Error(`Failed to generate content after ${maxRetries} attempts: ${lastError.message}`);
}

module.exports = {
  genAI,
  geminiModel,
  generateParameterExplanation,
  generateHealthSummary,
  generateWithRetry,
};
