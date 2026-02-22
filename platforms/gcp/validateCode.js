// GCP Cloud Functions adapter — validateCode
// Entry point: exports.validateCode

const { handleValidate } = require('../../api/src/core/validate-handler');

exports.validateCode = (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(204).send('');
    }
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const body     = req.body || {};
    const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';

    const result = handleValidate({ code: body.code, clientIp, log: console.log });
    res.status(result.status).json(result.body);
};
