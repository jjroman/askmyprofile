// Platform-agnostic chat handler.
// Called by all platform adapters (Azure, Netlify, Vercel, AWS, GCP).

const { getProvider } = require('../providers/index');
const { loadProfile } = require('./profile');

/**
 * Handle a chat request.
 * @param {object} opts
 * @param {string}   opts.question    - The user's question
 * @param {Array}    opts.history     - Conversation history (optional)
 * @param {string}   opts.accessCode  - x-access-code header value
 * @param {string}   opts.clientIp    - Client IP (for logging)
 * @param {Function} opts.log         - Logging function (e.g. console.log or context.log)
 * @returns {Promise<{ status: number, body: object }>}
 */
async function handleChat({ question, history = [], accessCode, clientIp = 'unknown', log = console.log }) {
    // ── Access code validation ───────────────────────────────────────────────
    const rawCodes = process.env.ACCESS_CODES || '';
    if (!rawCodes) {
        log('ERROR: ACCESS_CODES environment variable is not set');
        return { status: 500, body: { error: 'Service configuration error' } };
    }

    const validCodes = rawCodes.split(',').map(c => c.trim().toUpperCase());
    if (!accessCode || !validCodes.includes(accessCode.trim().toUpperCase())) {
        log(`[chat] UNAUTHORIZED ip=${clientIp} code=${accessCode || 'none'}`);
        return { status: 401, body: { error: 'Unauthorized' } };
    }

    log(`[chat] REQUEST code=${accessCode.trim().toUpperCase()} ip=${clientIp}`);

    // ── Input validation ─────────────────────────────────────────────────────
    if (!question || typeof question !== 'string' || !question.trim()) {
        return { status: 400, body: { error: 'Question is required' } };
    }

    // ── API key check ────────────────────────────────────────────────────────
    const apiKey = process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        log('ERROR: AI_API_KEY is not configured');
        return { status: 500, body: { error: 'Service configuration error' } };
    }

    // ── Call AI provider ─────────────────────────────────────────────────────
    try {
        const providerName = process.env.AI_PROVIDER || 'anthropic';
        log(`[chat] calling provider=${providerName} model=${process.env.AI_MODEL || 'default'}`);

        const provider = getProvider();
        const { answer, model } = await provider.generateResponse(
            loadProfile(),
            history,
            question
        );

        log('[chat] response generated successfully');
        return { status: 200, body: { answer, model } };

    } catch (error) {
        log(`ERROR [chat]: ${error.message}`);
        log(error.stack || '');
        const verbose = (process.env.MESSAGE_LEVEL || 'INFORMATION').toUpperCase() === 'VERBOSE';
        return {
            status: 500,
            body: {
                error: 'An error occurred processing your request',
                ...(verbose && { details: error.message })
            }
        };
    }
}

module.exports = { handleChat };
