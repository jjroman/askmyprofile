// Azure Functions v4 adapter — chat (thin wrapper around api/src/core/chat-handler.js)
const { app }         = require('@azure/functions');
const { handleChat }  = require('../core/chat-handler');

app.http('chat', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        let body = {};
        try { body = await request.json(); } catch (_) {}

        const accessCode = request.headers.get('x-access-code') || '';
        const clientIp   = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

        const result = await handleChat({
            question:   body.question,
            history:    body.history,
            accessCode,
            clientIp,
            log: msg => context.log(msg)
        });

        return {
            status: result.status,
            headers: { 'Content-Type': 'application/json' },
            jsonBody: result.body
        };
    }
});
