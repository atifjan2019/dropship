/**
 * CJ Dropshipping API v2 Client
 * Handles authentication, token caching, and all API interactions.
 */

const BASE_URL = process.env.CJ_API_BASE_URL || 'https://developers.cjdropshipping.com/api2.0/v1';
const API_KEY = process.env.CJ_API_KEY;

// Use globalThis to survive Next.js dev-mode hot reloads
// This prevents re-requesting the token (which is rate-limited to 1/5min)
if (!globalThis.__cjTokenCache) {
    globalThis.__cjTokenCache = {
        accessToken: null,
        expiresAt: 0,
        refreshToken: null,
        refreshExpiresAt: 0,
        pending: null, // prevent concurrent auth requests
    };
}

const tokenCache = globalThis.__cjTokenCache;

/**
 * Get a valid access token, refreshing if needed.
 */
export async function getAccessToken() {
    const now = Date.now();

    // Return cached token if still valid (with 60s buffer)
    if (tokenCache.accessToken && tokenCache.expiresAt > now + 60000) {
        return tokenCache.accessToken;
    }

    // If there's already a pending auth request, wait for it
    if (tokenCache.pending) {
        return tokenCache.pending;
    }

    // Request a new token (wrapped in a dedup promise)
    tokenCache.pending = (async () => {
        try {
            const res = await fetch(`${BASE_URL}/authentication/getAccessToken`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: API_KEY }),
            });

            const json = await res.json();

            if (!json.result || json.code !== 200) {
                throw new Error(`CJ Auth failed: ${json.message || 'Unknown error'}`);
            }

            const data = json.data;
            tokenCache.accessToken = data.accessToken;
            tokenCache.expiresAt = new Date(data.accessTokenExpiryDate).getTime();
            tokenCache.refreshToken = data.refreshToken;
            tokenCache.refreshExpiresAt = new Date(data.refreshTokenExpiryDate).getTime();

            return tokenCache.accessToken;
        } finally {
            tokenCache.pending = null;
        }
    })();

    return tokenCache.pending;
}

/**
 * Simple request serializer to avoid hitting QPS limits.
 * CJ API allows only 1 request per second per endpoint.
 */
let lastRequestTime = 0;
const MIN_REQUEST_GAP = 1100; // 1.1 seconds between requests

async function rateLimitedFetch(url, options) {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_GAP) {
        await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_GAP - timeSinceLastRequest));
    }
    lastRequestTime = Date.now();
    return fetch(url, options);
}

/**
 * Authenticated fetch wrapper for CJ API with retry support.
 */
export async function cjFetch(endpoint, options = {}, retries = 2) {
    const token = await getAccessToken();

    const res = await rateLimitedFetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'CJ-Access-Token': token,
            ...options.headers,
        },
        body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
    });

    const json = await res.json();

    // Retry on rate limit errors
    if (json.code === 1600200 && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_GAP));
        return cjFetch(endpoint, options, retries - 1);
    }

    return json;
}

// ─── Product Endpoints ───────────────────────────────────────

export async function searchProducts({ keyword = '', page = 1, size = 20, categoryId = '', countryCode = 'US' } = {}) {
    const params = new URLSearchParams();
    if (keyword) params.set('keyWord', keyword);
    params.set('page', page);
    params.set('size', size);
    if (categoryId) params.set('categoryId', categoryId);
    params.set('countryCode', countryCode);

    return cjFetch(`/product/listV2?${params.toString()}`);
}

export async function getProductDetails(productId) {
    return cjFetch(`/product/query?pid=${productId}`);
}

export async function getProductVariants(productId) {
    return cjFetch(`/product/variant/query?pid=${productId}`);
}

export async function getCategories() {
    return cjFetch('/product/getCategory');
}

// ─── Logistics Endpoints ─────────────────────────────────────

export async function calculateFreight({ startCountryCode = 'CN', endCountryCode = 'US', products = [] }) {
    return cjFetch('/logistic/freightCalculate', {
        method: 'POST',
        body: JSON.stringify({ startCountryCode, endCountryCode, products }),
    });
}

export async function getTrackingInfo(orderNumber) {
    return cjFetch(`/logistic/getTrackInfo?orderNumber=${orderNumber}`);
}

// ─── Order Endpoints ─────────────────────────────────────────

export async function createOrder(orderData) {
    return cjFetch('/shopping/order/createOrderV2', {
        method: 'POST',
        body: JSON.stringify(orderData),
    });
}

export async function listOrders({ page = 1, size = 20 } = {}) {
    const params = new URLSearchParams({ page, size });
    return cjFetch(`/shopping/order/list?${params.toString()}`);
}

export async function getOrderDetails(orderId) {
    return cjFetch(`/shopping/order/getOrderDetail?orderId=${orderId}`);
}

// ─── Payment Endpoints ───────────────────────────────────────

export async function getBalance() {
    return cjFetch('/shopping/pay/getBalance');
}
