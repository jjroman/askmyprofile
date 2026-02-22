// Google Gemini provider
// Required env vars:
//   AI_API_KEY   — your Google AI Studio API key
//   AI_MODEL     — optional, defaults to gemini-1.5-flash

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function generateResponse(systemPrompt, conversationHistory, question) {
    const apiKey = process.env.AI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error('AI_API_KEY is not set (Gemini provider)');

    const modelName = process.env.AI_MODEL || 'gemini-1.5-flash';
    const genAI     = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt
    });

    // Convert history to Gemini format: role is 'user' or 'model'
    const history = (Array.isArray(conversationHistory) ? conversationHistory : [])
        .map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

    const chat   = model.startChat({ history });
    const result = await chat.sendMessage(question);
    const answer = result.response.text();

    return { answer, model: modelName };
}

module.exports = { generateResponse };
