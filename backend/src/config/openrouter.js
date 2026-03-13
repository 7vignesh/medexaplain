const OpenAI = require('openai').default;

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || 'dummy-key-to-prevent-crash',
  defaultHeaders: {
    'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173', // Optional, for OpenRouter analytics
    'X-Title': 'MedExplain', // Optional, for OpenRouter analytics
  }
});

// Using a free model available on OpenRouter
const DEFAULT_MODEL = 'meta-llama/llama-3.1-8b-instruct';

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

async function generateParameterExplanation(parameterName, value, unit, normalRange, category) {
  const prompt = explanationTemplate
    .replace('{parameterName}', parameterName)
    .replace('{value}', value)
    .replace(/\{unit\}/g, unit || '')
    .replace('{normalRange}', normalRange || 'Not specified')
    .replace('{category}', category || 'General');

  const response = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 512,
    temperature: 0.3,
  });

  return response.choices[0].message.content.trim();
}

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

async function generateHealthSummary(testResultsText) {
  const prompt = summaryTemplate.replace('{testResults}', testResultsText);

  const response = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1024,
    temperature: 0.3,
  });

  return response.choices[0].message.content.trim();
}

async function generateWithRetry(prompt, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2048,
        temperature: 0.3,
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error(`OpenRouter API attempt ${attempt}/${maxRetries} failed:`, error.message);
      lastError = error;

      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw new Error(`Failed to generate content after ${maxRetries} attempts: ${lastError.message}`);
}

module.exports = {
  client,
  generateParameterExplanation,
  generateHealthSummary,
  generateWithRetry,
};
