// Platform-agnostic validate-code handler.
// Called by all platform adapters (Azure, Netlify, Vercel, AWS, GCP).

// Rate limiting: max 10 attempts per IP per 15-minute window.
// In-memory only — resets on cold start (acceptable for this use case).
const MAX_ATTEMPTS = 10;
const WINDOW_MS    = 15 * 60 * 1000;
const rateLimitMap = new Map();

function isRateLimited(ip) {
    const now   = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now - entry.windowStart > WINDOW_MS) {
        rateLimitMap.set(ip, { count: 1, windowStart: now });
        return false;
    }
    entry.count++;
    return entry.count > MAX_ATTEMPTS;
}

/**
 * Validate an invite code.
 * @param {object} opts
 * @param {string}   opts.code      - The submitted code
 * @param {string}   opts.clientIp  - Client IP for rate limiting
 * @param {Function} opts.log       - Logging function
 * @returns {{ status: number, body: object }}
 */
function handleValidate({ code, clientIp = 'unknown', log = console.log }) {
    const timestamp = new Date().toISOString();

    if (isRateLimited(clientIp)) {
        log(`[validateCode] RATE_LIMITED ip=${clientIp} time=${timestamp}`);
        return {
            status: 429,
            body: { valid: false, error: 'Too many attempts. Please wait 15 minutes.' }
        };
    }

    if (!code || typeof code !== 'string') {
        return { status: 400, body: { valid: false, error: 'Code is required' } };
    }

    const raw = process.env.ACCESS_CODES || '';
    if (!raw) {
        log('[validateCode] ERROR: ACCESS_CODES environment variable is not set');
        return { status: 500, body: { valid: false, error: 'Service configuration error' } };
    }

    const validCodes = raw.split(',').map(c => c.trim().toUpperCase());
    const submitted  = code.trim().toUpperCase();
    const valid      = validCodes.includes(submitted);

    log(`[validateCode] result=${valid ? 'PASS' : 'FAIL'} code=${submitted} ip=${clientIp} time=${timestamp}`);

    return { status: 200, body: { valid } };
}

module.exports = { handleValidate };
