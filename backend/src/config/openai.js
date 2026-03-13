const OpenAI = require('openai').default;

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    model: 'gpt-3.5-turbo',
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
    model: 'gpt-3.5-turbo',
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
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2048,
        temperature: 0.3,
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error(`OpenAI API attempt ${attempt}/${maxRetries} failed:`, error.message);
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
