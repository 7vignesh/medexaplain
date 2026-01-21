// Test OpenAI API connection
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
  try {
    console.log('Testing OpenAI API connection...');
    console.log('API Key:', process.env.OPENAI_API_KEY ? 'Present' : 'Missing');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: 'Say hello' }
      ],
      max_tokens: 50,
    });
    
    console.log('✅ OpenAI API is working!');
    console.log('Response:', response.choices[0].message.content);
  } catch (error) {
    console.error('❌ OpenAI API Error:', error.message);
    console.error('Error Code:', error.code);
    console.error('Error Status:', error.status);
  }
}

testOpenAI();
