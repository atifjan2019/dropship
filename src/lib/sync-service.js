/**
 * CJ → Supabase Sync Service
 * Handles importing products, updating prices/stock, and syncing tracking info.
 * Dynamic pricing: ≤$5 → 3x | ≤$10 → 2.5x | >$10 → 2x markup on base cost.
 */

import { supabase } from './supabase';
import { searchProducts, getProductDetails, getProductVariants, getOrderDetails, getTrackingInfo } from './cj-api';
import { calculatePrice, getMarkupRate, calculateProfit } from './pricing';

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

                    // Apply dynamic pricing markup
                    const rawCost = parseFloat(details.sellPrice || details.nowPrice || 0);
                    const markedUpPrice = calculatePrice(rawCost);

                    // Upsert product
                    const { data: dbProduct, error: prodError } = await supabase
                        .from('products')
                        .upsert({
                            cj_product_id: String(cjPid),
                            title: details.productNameEn || details.nameEn || 'Untitled',
                            description: details.description || details.productDescription || '',
                            image_url: parseImageUrl(details.productImage || details.bigImage || ''),
                            category: details.categoryName || details.threeCategoryName || details.oneCategoryName || '',
                            warehouse: details.countryCode || details.warehouseCountry || 'CN',
                            base_cost: rawCost,
                            sell_price: markedUpPrice,
                            is_active: true,
                        }, { onConflict: 'cj_product_id' })
                        .select()
                        .single();

                    if (prodError) {
                        errors.push({ cjPid, error: prodError.message });
                        continue;
                    }

                    // Upsert variants (with per-variant markup)
                    if (variants.length > 0 && dbProduct) {
                        for (const v of variants) {
                            const vid = v.vid || v.variantId;
                            if (!vid) continue;

                            const variantBaseCost = parseFloat(v.sellPrice || rawCost || 0);
                            await supabase
                                .from('product_variants')
                                .upsert({
                                    product_id: dbProduct.id,
                                    cj_variant_id: String(vid),
                                    name: v.variantNameEn || v.variantName || '',
                                    image_url: parseImageUrl(v.variantImage || ''),
                                    base_cost: variantBaseCost,
                                    sell_price: calculatePrice(variantBaseCost),
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

                // Recalculate markup in case CJ base cost changed
                const newBaseCost = parseFloat(details.sellPrice || 0);
                const newSellPrice = calculatePrice(newBaseCost);

                // Update product price
                await supabase
                    .from('products')
                    .update({
                        base_cost: newBaseCost,
                        sell_price: newSellPrice,
                        title: details.productNameEn || undefined,
                        image_url: parseImageUrl(details.productImage) || undefined,
                    })
                    .eq('id', prod.id);

                // Update variant prices/stock with per-variant markup
                const variants = details.variants || [];
                for (const v of variants) {
                    const vid = v.vid || v.variantId;
                    if (!vid) continue;

                    const variantBaseCost = parseFloat(v.sellPrice || newBaseCost || 0);
                    await supabase
                        .from('product_variants')
                        .update({
                            base_cost: variantBaseCost,
                            sell_price: calculatePrice(variantBaseCost),
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
 * Map a CJ status string to a local status slug.
 */
function mapCjStatus(cjStatus) {
    const s = (cjStatus || '').toLowerCase();
    if (s.includes('cancel') || s.includes('close'))        return 'cancelled';
    if (s.includes('deliver') || s.includes('complet'))     return 'delivered';
    if (s.includes('dispatch') || s.includes('ship') || s.includes('transit')) return 'shipped';
    if (s.includes('process') || s.includes('paid') || s.includes('confirm')) return 'processing';
    if (s.includes('pend'))                                 return 'pending';
    return null; // unknown — don't overwrite
}

/**
 * Build the best tracking URL for a known courier.
 */
export function getTrackingUrl(trackingNumber, courier) {
    if (!trackingNumber) return null;
    const tn = encodeURIComponent(trackingNumber);
    const c  = (courier || '').toLowerCase();

    if (c.includes('usps'))       return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tn}`;
    if (c.includes('ups'))        return `https://www.ups.com/track?tracknum=${tn}`;
    if (c.includes('fedex'))      return `https://www.fedex.com/fedextrack/?trknbr=${tn}`;
    if (c.includes('dhl'))        return `https://www.dhl.com/en/express/tracking.html?AWB=${tn}`;
    if (c.includes('yanwen'))     return `https://www.yanwen.com/main/mail_track.html?mailno=${tn}`;
    if (c.includes('cjpacket') || c.includes('cj'))
        return `https://track.cjdropshipping.com/track.html?trackno=${tn}`;
    // Fallback — 17track covers almost everything
    return `https://t.17track.net/en#nums=${tn}`;
}

/**
 * Fetch CJ order details + tracking info for a single order.
 * Returns { status, trackingNumber, courier, trackingUrl, events }
 */
export async function fetchCjTrackingForOrder(cjOrderId) {
    const result = {
        status: null,
        trackingNumber: null,
        courier: null,
        trackingUrl: null,
        events: [],
    };

    // 1. Get order status from order detail endpoint
    try {
        const detailRes = await getOrderDetails(cjOrderId);
        const cjOrder = detailRes?.data;

        if (cjOrder) {
            if (cjOrder.orderStatus)  result.status         = mapCjStatus(cjOrder.orderStatus);
            if (cjOrder.trackNumber)  result.trackingNumber  = cjOrder.trackNumber;
            if (cjOrder.logisticName) result.courier         = cjOrder.logisticName;
        }
    } catch (e) {
        // Will retry via tracking endpoint
    }

    // 2. Get live tracking events from the logistics endpoint
    try {
        const trackRes = await getTrackingInfo(cjOrderId);
        const td = trackRes?.data;

        if (td) {
            if (td.trackNumber)                         result.trackingNumber = td.trackNumber;
            if (td.logisticName || td.courierName)      result.courier        = td.logisticName || td.courierName;
            if (Array.isArray(td.trackDetailList))      result.events         = td.trackDetailList;
            if (Array.isArray(td.details))              result.events         = td.details;

            // The last event usually indicates delivery
            const lastEvent = result.events?.[0]?.context || '';
            if (lastEvent.toLowerCase().includes('deliver') || lastEvent.toLowerCase().includes('delivered')) {
                result.status = 'delivered';
            }
        }
    } catch (e) {
        // Tracking not yet available — that's ok
    }

    // Build tracking URL
    result.trackingUrl = getTrackingUrl(result.trackingNumber, result.courier);

    return result;
}

/**
 * On-demand refresh of tracking info for a single order.
 * Works both before and after the migration SQL has been run.
 */
export async function refreshOrderTracking(orderId) {
    // Only select columns guaranteed to exist in the baseline schema
    const { data: order, error } = await supabase
        .from('orders')
        .select('id, cj_order_id, order_number, status, tracking_number')
        .eq('id', orderId)
        .single();

    if (error) throw new Error(`Order not found: ${error.message}`);
    if (!order) throw new Error('Order not found');
    if (!order.cj_order_id) throw new Error('No CJ order ID — order was not submitted to CJ yet');

    const tracking = await fetchCjTrackingForOrder(order.cj_order_id);

    // Only update fields whose values have actually changed
    const updateData = {};

    if (tracking.status && tracking.status !== order.status)
        updateData.status = tracking.status;
    if (tracking.trackingNumber && tracking.trackingNumber !== order.tracking_number)
        updateData.tracking_number = tracking.trackingNumber;

    // These columns only exist after migration — update them if we can,
    // ignore the error if the column doesn't exist yet
    if (Object.keys(updateData).length > 0 || tracking.courier) {
        const extendedUpdate = { ...updateData };
        if (tracking.courier) extendedUpdate.courier = tracking.courier;

        // Try with extended fields first (post-migration)
        const { error: updateErr } = await supabase
            .from('orders')
            .update(extendedUpdate)
            .eq('id', orderId);

        if (updateErr && updateErr.message.includes('does not exist')) {
            // Fallback: update only baseline columns
            if (Object.keys(updateData).length > 0) {
                await supabase.from('orders').update(updateData).eq('id', orderId);
            }
        }
    }

    return {
        ...tracking,
        orderId:     order.id,
        orderNumber: order.order_number,
        changed:     Object.keys(updateData).length > 0 || !!tracking.courier,
    };
}

/**
 * Batch tracking sync — poll CJ for all open (non-delivered) orders.
 * Runs on a cron schedule. Only updates rows when data has actually changed.
 */
export async function syncTracking() {
    const { data: log } = await supabase
        .from('sync_logs')
        .insert({ type: 'tracking_update', status: 'started' })
        .select()
        .single();

    const logId = log?.id;
    let updated = 0;
    let checked = 0;
    const errors = [];

    try {
        // Only fetch orders that still need tracking (exclude delivered & cancelled)
        const { data: orders } = await supabase
            .from('orders')
            .select('id, cj_order_id, order_number, status, tracking_number, courier')
            .not('status', 'in', '("delivered","cancelled","cj_submission_failed")')
            .not('cj_order_id', 'is', null)
            .order('created_at', { ascending: true }); // oldest first

        if (!orders || orders.length === 0) {
            await supabase.from('sync_logs').update({
                status: 'completed', products_synced: 0,
                details: { message: 'No open orders to track' },
                completed_at: new Date().toISOString(),
            }).eq('id', logId);
            return { success: true, updated: 0, checked: 0 };
        }

        for (const order of orders) {
            checked++;
            try {
                const tracking = await fetchCjTrackingForOrder(order.cj_order_id);

                // Only write to DB if something actually changed
                const updateData = { tracking_updated_at: new Date().toISOString() };

                if (tracking.status && tracking.status !== order.status)
                    updateData.status = tracking.status;
                if (tracking.trackingNumber && tracking.trackingNumber !== order.tracking_number)
                    updateData.tracking_number = tracking.trackingNumber;
                if (tracking.courier && tracking.courier !== order.courier)
                    updateData.courier = tracking.courier;

                if (Object.keys(updateData).length > 1) {
                    await supabase.from('orders').update(updateData).eq('id', order.id);
                    updated++;
                }
            } catch (e) {
                errors.push({ orderId: order.id, orderNum: order.order_number, error: e.message });
            }
        }

        await supabase.from('sync_logs').update({
            status: 'completed',
            products_synced: updated,
            details: { checked, updated, errors: errors.slice(0, 20) },
            completed_at: new Date().toISOString(),
        }).eq('id', logId);

        return { success: true, checked, updated, errors: errors.length };
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


