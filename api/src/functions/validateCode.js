// Azure Functions v4 adapter — validateCode (thin wrapper around api/src/core/validate-handler.js)
const { app }             = require('@azure/functions');
const { handleValidate }  = require('../core/validate-handler');

app.http('validateCode', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        let body = {};
        try { body = await request.json(); } catch (_) {}

        const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                         request.headers.get('client-ip') || 'unknown';

        const result = handleValidate({
            code: body.code,
            clientIp,
            log: msg => context.log(msg)
        });

        return {
            status: result.status,
            jsonBody: result.body
        };
    }
});
