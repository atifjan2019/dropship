/**
 * CJ → Supabase Sync Service
 * Handles importing products, updating prices/stock, and syncing tracking info.
 */

import { supabase } from './supabase';
import { searchProducts, getProductDetails, getProductVariants, getOrderDetails, getTrackingInfo } from './cj-api';

/**
 * CJ sometimes returns image fields as JSON-encoded arrays like
 * '["https://...", "https://..."]'. This helper extracts the first URL.
 */
function parseImageUrl(val) {
    if (!val) return '';
    if (typeof val === 'string' && val.startsWith('[')) {
        try {
            const arr = JSON.parse(val);
            return Array.isArray(arr) && arr.length > 0 ? arr[0] : '';
        } catch { return val; }
    }
    return val;
}

// ─── Product Import ──────────────────────────────────────────

/**
 * Import products from CJ API into Supabase.
 * Uses cj_product_id for deduplication (upsert).
 */
export async function importProducts({ keyword = '', pages = 1, size = 20 } = {}) {
    // Create sync log
    const { data: log } = await supabase
        .from('sync_logs')
        .insert({ type: 'product_import', status: 'started', details: { keyword, pages } })
        .select()
        .single();

    const logId = log?.id;
    let totalSynced = 0;
    const errors = [];

    try {
        for (let page = 1; page <= pages; page++) {
            const data = await searchProducts({ keyword, page, size, countryCode: 'US' });

            // Extract products from V2 response
            let products = [];
            if (data.data) {
                if (data.data.content && Array.isArray(data.data.content)) {
                    for (const group of data.data.content) {
                        if (group.productList && Array.isArray(group.productList)) {
                            products.push(...group.productList);
                        }
                    }
                } else if (Array.isArray(data.data)) {
                    products = data.data;
                } else if (data.data.list && Array.isArray(data.data.list)) {
                    products = data.data.list;
                }
            }

            if (products.length === 0) break;

            // Process each product
            for (const p of products) {
                try {
                    const cjPid = p.pid || p.id;
                    if (!cjPid) continue;

                    // Fetch full details for description and variants
                    let details = p;
                    let variants = [];
                    try {
                        const detailRes = await getProductDetails(cjPid);
                        if (detailRes.data) {
                            details = detailRes.data;
                            variants = details.variants || [];
                        }
                    } catch (e) {
                        // Use list data if detail fetch fails
                    }

                    // If no variants from details, try fetching separately
                    if (variants.length === 0) {
                        try {
                            const varRes = await getProductVariants(cjPid);
                            variants = varRes.data || [];
                        } catch (e) {
                            // Continue without variants
                        }
                    }

                    // Upsert product
                    const { data: dbProduct, error: prodError } = await supabase
                        .from('products')
                        .upsert({
                            cj_product_id: String(cjPid),
                            title: details.productNameEn || details.nameEn || 'Untitled',
                            description: details.description || details.productDescription || '',
                            image_url: parseImageUrl(details.productImage || details.bigImage || ''),
                            category: details.categoryName || details.threeCategoryName || details.oneCategoryName || '',
                            sell_price: parseFloat(details.sellPrice || details.nowPrice || 0),
                            is_active: true,
                        }, { onConflict: 'cj_product_id' })
                        .select()
                        .single();

                    if (prodError) {
                        errors.push({ cjPid, error: prodError.message });
                        continue;
                    }

                    // Upsert variants
                    if (variants.length > 0 && dbProduct) {
                        for (const v of variants) {
                            const vid = v.vid || v.variantId;
                            if (!vid) continue;

                            await supabase
                                .from('product_variants')
                                .upsert({
                                    product_id: dbProduct.id,
                                    cj_variant_id: String(vid),
                                    name: v.variantNameEn || v.variantName || '',
                                    image_url: parseImageUrl(v.variantImage || ''),
                                    sell_price: parseFloat(v.sellPrice || 0),
                                    stock: parseInt(v.variantStock || v.stock || 0),
                                }, { onConflict: 'cj_variant_id' });
                        }
                    }

                    totalSynced++;
                } catch (itemErr) {
                    errors.push({ product: p.pid || p.id, error: itemErr.message });
                }
            }
        }

        // Update sync log
        if (logId) {
            await supabase
                .from('sync_logs')
                .update({
                    status: errors.length > 0 ? 'completed_with_errors' : 'completed',
                    products_synced: totalSynced,
                    details: { keyword, pages, errors: errors.slice(0, 20) },
                    completed_at: new Date().toISOString(),
                })
                .eq('id', logId);
        }

        return { success: true, synced: totalSynced, errors: errors.length };
    } catch (err) {
        if (logId) {
            await supabase
                .from('sync_logs')
                .update({
                    status: 'failed',
                    error_message: err.message,
                    completed_at: new Date().toISOString(),
                })
                .eq('id', logId);
        }
        throw err;
    }
}

// ─── Price & Stock Sync ──────────────────────────────────────

/**
 * Refresh prices and stock for all active local products from CJ.
 */
export async function syncPricesAndStock() {
    const { data: log } = await supabase
        .from('sync_logs')
        .insert({ type: 'price_update', status: 'started' })
        .select()
        .single();

    const logId = log?.id;
    let updated = 0;
    const errors = [];

    try {
        // Get all active products
        const { data: products } = await supabase
            .from('products')
            .select('id, cj_product_id')
            .eq('is_active', true);

        if (!products || products.length === 0) {
            if (logId) {
                await supabase.from('sync_logs').update({
                    status: 'completed', products_synced: 0,
                    completed_at: new Date().toISOString(),
                }).eq('id', logId);
            }
            return { success: true, updated: 0 };
        }

        for (const prod of products) {
            try {
                const detailRes = await getProductDetails(prod.cj_product_id);
                const details = detailRes.data;
                if (!details) continue;

                // Update product price
                await supabase
                    .from('products')
                    .update({
                        sell_price: parseFloat(details.sellPrice || 0),
                        title: details.productNameEn || undefined,
                        image_url: parseImageUrl(details.productImage) || undefined,
                    })
                    .eq('id', prod.id);

                // Update variant prices/stock
                const variants = details.variants || [];
                for (const v of variants) {
                    const vid = v.vid || v.variantId;
                    if (!vid) continue;

                    await supabase
                        .from('product_variants')
                        .update({
                            sell_price: parseFloat(v.sellPrice || 0),
                            stock: parseInt(v.variantStock || v.stock || 0),
                        })
                        .eq('cj_variant_id', String(vid));
                }

                updated++;
            } catch (e) {
                errors.push({ cjPid: prod.cj_product_id, error: e.message });
            }
        }

        if (logId) {
            await supabase.from('sync_logs').update({
                status: 'completed',
                products_synced: updated,
                details: { errors: errors.slice(0, 20) },
                completed_at: new Date().toISOString(),
            }).eq('id', logId);
        }

        return { success: true, updated, errors: errors.length };
    } catch (err) {
        if (logId) {
            await supabase.from('sync_logs').update({
                status: 'failed', error_message: err.message,
                completed_at: new Date().toISOString(),
            }).eq('id', logId);
        }
        throw err;
    }
}

// ─── Tracking Sync ───────────────────────────────────────────

/**
 * Poll CJ for tracking updates on all open orders.
 */
export async function syncTracking() {
    const { data: log } = await supabase
        .from('sync_logs')
        .insert({ type: 'tracking_update', status: 'started' })
        .select()
        .single();

    const logId = log?.id;
    let updated = 0;
    const errors = [];

    try {
        // Get orders that need tracking updates
        const { data: orders } = await supabase
            .from('orders')
            .select('id, cj_order_id, order_number, status')
            .not('status', 'in', '("delivered","cancelled")')
            .not('cj_order_id', 'is', null);

        if (!orders || orders.length === 0) {
            if (logId) {
                await supabase.from('sync_logs').update({
                    status: 'completed', products_synced: 0,
                    completed_at: new Date().toISOString(),
                }).eq('id', logId);
            }
            return { success: true, updated: 0 };
        }

        for (const order of orders) {
            try {
                // Get order details from CJ
                const detailRes = await getOrderDetails(order.cj_order_id);
                const cjOrder = detailRes.data;

                const updateData = {};

                if (cjOrder) {
                    // Map CJ status to local status
                    if (cjOrder.orderStatus) {
                        updateData.status = mapCjStatus(cjOrder.orderStatus);
                    }
                    if (cjOrder.trackNumber) {
                        updateData.tracking_number = cjOrder.trackNumber;
                    }
                }

                // Also try tracking endpoint
                try {
                    const trackRes = await getTrackingInfo(order.cj_order_id);
                    if (trackRes.data && trackRes.data.trackNumber) {
                        updateData.tracking_number = trackRes.data.trackNumber;
                    }
                } catch (e) {
                    // Tracking info may not be available yet
                }

                if (Object.keys(updateData).length > 0) {
                    await supabase
                        .from('orders')
                        .update(updateData)
                        .eq('id', order.id);
                    updated++;
                }
            } catch (e) {
                errors.push({ orderId: order.id, error: e.message });
            }
        }

        if (logId) {
            await supabase.from('sync_logs').update({
                status: 'completed',
                products_synced: updated,
                details: { ordersChecked: orders.length, errors: errors.slice(0, 20) },
                completed_at: new Date().toISOString(),
            }).eq('id', logId);
        }

        return { success: true, updated, errors: errors.length };
    } catch (err) {
        if (logId) {
            await supabase.from('sync_logs').update({
                status: 'failed', error_message: err.message,
                completed_at: new Date().toISOString(),
            }).eq('id', logId);
        }
        throw err;
    }
}

function mapCjStatus(cjStatus) {
    const s = (cjStatus || '').toLowerCase();
    if (s.includes('pend')) return 'pending';
    if (s.includes('process')) return 'processing';
    if (s.includes('dispatch') || s.includes('ship')) return 'shipped';
    if (s.includes('deliver') || s.includes('complet')) return 'delivered';
    if (s.includes('cancel') || s.includes('close')) return 'cancelled';
    return 'pending';
}
