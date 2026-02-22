// OpenAI-compatible provider
// Covers: OpenAI, Azure OpenAI, Ollama, and any OpenAI-compatible endpoint.
//
// Required env vars:
//   AI_API_KEY       — your OpenAI API key (sk-...) or "ollama" for local Ollama
//   AI_MODEL         — e.g. gpt-4o, gpt-4o-mini, llama3.2, mistral
//
// Optional env vars:
//   AI_API_ENDPOINT  — custom base URL (required for Ollama / Azure OpenAI)
//                      Ollama example:      http://localhost:11434/v1
//                      Azure OpenAI example: https://<resource>.openai.azure.com/openai/deployments/<deployment>
//   AI_API_VERSION   — API version header, required for Azure OpenAI (e.g. 2024-02-01)

const OpenAI = require('openai');

async function generateResponse(systemPrompt, conversationHistory, question) {
    const apiKey   = process.env.AI_API_KEY || 'ollama'; // Ollama doesn't need a real key
    const model    = process.env.AI_MODEL   || 'gpt-4o-mini';
    const baseURL  = process.env.AI_API_ENDPOINT || undefined;

    const clientOptions = { apiKey };
    if (baseURL) clientOptions.baseURL = baseURL;

    // Azure OpenAI requires a different client option
    if (process.env.AI_API_VERSION) {
        clientOptions.defaultQuery  = { 'api-version': process.env.AI_API_VERSION };
        clientOptions.defaultHeaders = { 'api-key': apiKey };
    }

    const client = new OpenAI(clientOptions);

    const messages = [
        { role: 'system', content: systemPrompt },
        ...(Array.isArray(conversationHistory) ? conversationHistory : []),
        { role: 'user', content: question }
    ];

    const response = await client.chat.completions.create({
        model,
        max_tokens: parseInt(process.env.AI_MAX_TOKENS || '2000', 10),
        messages
    });

    const answer = response.choices[0]?.message?.content || '';
    return { answer, model };
}

module.exports = { generateResponse };
