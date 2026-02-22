// Vercel Serverless Function adapter — chat
// Deploy: vercel.json maps /api/chat → this file

const { handleChat } = require('../../../api/src/core/chat-handler');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let body = req.body || {};
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (_) {}
    }

    const accessCode = req.headers['x-access-code'] || '';
    const clientIp   = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';

    const result = await handleChat({
        question:   body.question,
        history:    body.history,
        accessCode,
        clientIp,
        log: console.log
    });

    res.status(result.status).json(result.body);
};
