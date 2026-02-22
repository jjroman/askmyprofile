// Anthropic (Claude) provider
// Required env vars:
//   AI_API_KEY      — your Anthropic API key (sk-ant-...)
//   AI_MODEL        — optional, defaults to claude-3-5-sonnet-20241022

const Anthropic = require('@anthropic-ai/sdk');

async function generateResponse(systemPrompt, conversationHistory, question) {
    const apiKey = process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('AI_API_KEY is not set (Anthropic provider)');

    const model = process.env.AI_MODEL || 'claude-3-5-sonnet-20241022';

    const client = new Anthropic({ apiKey });

    const messages = [
        ...(Array.isArray(conversationHistory) ? conversationHistory : []),
        { role: 'user', content: question }
    ];

    const response = await client.messages.create({
        model,
        max_tokens: parseInt(process.env.AI_MAX_TOKENS || '2000', 10),
        system: systemPrompt,
        messages
    });

    const answer = response.content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('\n');

    return { answer, model };
}

module.exports = { generateResponse };
