/**
 * Admin Authentication Utility
 * Simple token-based auth using ADMIN_PASSWORD env var.
 * Token = base64(password + ':' + timestamp), valid for 24 hours.
 */

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'velora-admin-2026';
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a session token from the admin password.
 */
export function generateToken() {
    const payload = JSON.stringify({
        auth: 'velora-admin',
        ts: Date.now(),
    });
    return Buffer.from(payload).toString('base64');
}

/**
 * Validate a session token.
 */
export function validateToken(token) {
    if (!token) return false;
    try {
        const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
        if (payload.auth !== 'velora-admin') return false;
        if (Date.now() - payload.ts > TOKEN_EXPIRY_MS) return false;
        return true;
    } catch {
        return false;
    }
}

/**
 * Validate admin password.
 */
export function checkPassword(password) {
    return password === ADMIN_PASSWORD;
}

/**
 * Middleware helper: verify admin auth from request headers.
 * Expects: Authorization: Bearer <token>
 * Returns { authorized: boolean, error?: string }
 */
export function verifyAdmin(request) {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
        return { authorized: false, error: 'No authorization token provided' };
    }

    if (!validateToken(token)) {
        return { authorized: false, error: 'Invalid or expired token' };
    }

    return { authorized: true };
}
