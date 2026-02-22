// GCP Cloud Functions adapter — chat
// HTTP trigger, Express-style req/res.
// Entry point: exports.chat

const { handleChat } = require('../../api/src/core/chat-handler');

exports.chat = async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type, x-access-code');
        return res.status(204).send('');
    }
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const body       = req.body || {};
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
