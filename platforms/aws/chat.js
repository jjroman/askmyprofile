// AWS Lambda adapter — chat
// Compatible with API Gateway proxy integration (HTTP API or REST API).

const { handleChat } = require('../../api/src/core/chat-handler');

exports.handler = async (event) => {
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (_) {}

    const headers    = event.headers || {};
    const accessCode = headers['x-access-code'] || headers['X-Access-Code'] || '';
    const clientIp   = (headers['x-forwarded-for'] || '').split(',')[0].trim() ||
                       event.requestContext?.identity?.sourceIp || 'unknown';

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
