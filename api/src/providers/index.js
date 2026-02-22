// AI provider factory
// Reads AI_PROVIDER env var and returns the matching provider module.
//
// Supported values for AI_PROVIDER:
//   anthropic   — Anthropic Claude (default)
//   openai      — OpenAI GPT models
//   azure-openai — Azure OpenAI (uses openai provider with AI_API_ENDPOINT + AI_API_VERSION)
//   ollama      — Local Ollama (uses openai provider with AI_API_ENDPOINT pointing to Ollama)
//   gemini      — Google Gemini

const PROVIDERS = {
    anthropic:    () => require('./anthropic'),
    openai:       () => require('./openai'),
    'azure-openai': () => require('./openai'),  // same adapter, different env vars
    ollama:       () => require('./openai'),     // same adapter, Ollama is OpenAI-compatible
    gemini:       () => require('./gemini')
};

function getProvider() {
    const name = (process.env.AI_PROVIDER || 'anthropic').toLowerCase().trim();
    const factory = PROVIDERS[name];
    if (!factory) {
        const supported = Object.keys(PROVIDERS).join(', ');
        throw new Error(
            `Unknown AI_PROVIDER "${name}". Supported values: ${supported}`
        );
    }
    return factory();
}

module.exports = { getProvider };
