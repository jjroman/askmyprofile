// Vercel Serverless Function adapter — validateCode

const { handleValidate } = require('../../../api/src/core/validate-handler');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let body = req.body || {};
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (_) {}
    }

    const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    const result   = handleValidate({ code: body.code, clientIp, log: console.log });

    res.status(result.status).json(result.body);
};
