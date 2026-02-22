// Netlify Functions adapter — chat
// Netlify Functions use the same event/response shape as AWS Lambda.
// Deploy: set netlify.toml functions directory to "platforms/netlify/functions"

const { handleChat } = require('../../../api/src/core/chat-handler');

exports.handler = async (event) => {
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (_) {}

    const headers    = event.headers || {};
    const accessCode = headers['x-access-code'] || '';
    const clientIp   = (headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';

    const result = await handleChat({
        question:   body.question,
        history:    body.history,
        accessCode,
        clientIp,
        log: console.log
    });

    return {
        statusCode: result.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.body)
    };
};
