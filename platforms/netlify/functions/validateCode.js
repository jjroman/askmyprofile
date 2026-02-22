// Netlify Functions adapter — validateCode

const { handleValidate } = require('../../../api/src/core/validate-handler');

exports.handler = async (event) => {
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (_) {}

    const headers  = event.headers || {};
    const clientIp = (headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';

    const result = handleValidate({ code: body.code, clientIp, log: console.log });

    return {
        statusCode: result.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.body)
    };
};
