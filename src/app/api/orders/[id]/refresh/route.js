import { refreshOrderTracking } from '@/lib/sync-service';
import { createOrder, getBestLogistic, COUNTRY_NAMES } from '@/lib/cj-api';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/**
 * POST /api/orders/[id]/refresh
 *
 * Smart refresh endpoint:
 * ┌ If order HAS cj_order_id  → fetch tracking updates from CJ
 * └ If order has NO cj_order_id → re-submit order to CJ (retry failed submission)
 */
export async function POST(request, { params }) {
    try {
        const { id } = await params;

        // Fetch the order with items and customer
        // order_items(*) selects all columns — new ones (cj_vid) appear after migration
        const { data: order, error } = await supabase
            .from('orders')
            .select(`
                id, order_number, status, cj_order_id,
                shipping_name, shipping_address, shipping_city,
                shipping_state, shipping_zip, shipping_phone,
                customers(email, first_name, last_name),
                order_items(*, product_variants(cj_variant_id))
            `)
            .eq('id', id)
            .single();

        if (error || !order) {
            return NextResponse.json({ result: false, error: 'Order not found' }, { status: 404 });
        }

        // ── Route A: Has CJ order ID → fetch tracking ──────────────────
        if (order.cj_order_id) {
            const result = await refreshOrderTracking(id);
            return NextResponse.json({
                result:  true,
                code:    200,
                data:    result,
                message: result.changed
                    ? '🔄 Tracking updated!'
                    : '✓ Checked — no new updates from CJ yet',
            });
        }

        // ── Route B: No CJ order ID → re-submit to CJ ──────────────────
        const items = order.order_items || [];

        // Build CJ products array — three sources for the variant ID (newest to oldest):
        // 1. item.cj_vid — directly stored since the cj_vid migration
        // 2. item.product_variants.cj_variant_id — via FK join
        // 3. Look up from product_variants by variant_name — fallback for old orders
        const cjProducts = [];

        for (const item of items) {
            let vid = item.cj_vid || item.product_variants?.cj_variant_id || null;

            // Fallback: look up by variant_name in product_variants table
            if (!vid && item.variant_name) {
                const { data: pv } = await supabase
                    .from('product_variants')
                    .select('cj_variant_id')
                    .ilike('variant_name', item.variant_name.trim())
                    .not('cj_variant_id', 'is', null)
                    .limit(1)
                    .single();
                vid = pv?.cj_variant_id || null;
            }

            if (vid) {
                cjProducts.push({ vid, quantity: item.quantity || 1 });
            }
        }

        if (cjProducts.length === 0) {
            return NextResponse.json({
                result:  false,
                retried: false,
                error:   'Cannot re-submit: no CJ variant IDs found for this order\'s products. Please contact support.',
            }, { status: 422 });
        }


        console.log('[Refresh→Retry] Re-submitting order to CJ:', order.order_number);

        // Get best logistic
        const logisticName = await getBestLogistic(cjProducts, 'CN', 'US');
        const shippingCountry = COUNTRY_NAMES['US'] || 'United States';
        const fullName = order.shipping_name ||
            `${order.customers?.first_name || ''} ${order.customers?.last_name || ''}`.trim();

        const cjOrderData = {
            orderNumber:          order.order_number,
            shippingCountryCode:  'US',
            shippingCountry,
            shippingProvince:     order.shipping_state,
            shippingCity:         order.shipping_city,
            shippingAddress:      order.shipping_address,
            shippingCustomerName: fullName,
            shippingZip:          order.shipping_zip,
            shippingPhone:        order.shipping_phone || '0000000000',
            email:                order.customers?.email || '',
            logisticName,
            fromCountryCode:      'CN',
            payType:              '3',
            products:             cjProducts,
        };

        console.log('[Refresh→Retry] CJ payload:', JSON.stringify(cjOrderData));

        const cjResponse = await createOrder(cjOrderData);

        console.log('[Refresh→Retry] CJ response:', JSON.stringify(cjResponse));

        if (cjResponse.result || cjResponse.code === 200) {
            const cjOrderId = cjResponse.data?.orderId || cjResponse.data?.orderNum || null;

            await supabase
                .from('orders')
                .update({
                    cj_order_id: cjOrderId ? String(cjOrderId) : null,
                    status:      'processing',
                    cj_logistic: logisticName,
                    cj_error:    null,
                })
                .eq('id', id);

            return NextResponse.json({
                result:  true,
                code:    200,
                retried: true,
                message: `✅ Order submitted to CJ! Now processing. CJ ID: ${cjOrderId}`,
                data:    { cjOrderId, logisticName, status: 'processing' },
            });
        } else {
            const errMsg = cjResponse.message || JSON.stringify(cjResponse);
            console.error('[Refresh→Retry] CJ rejected:', errMsg);

            await supabase
                .from('orders')
                .update({ status: 'cj_submission_failed', cj_error: errMsg })
                .eq('id', id);

            return NextResponse.json({
                result:  false,
                retried: true,
                error:   `CJ rejected the order: ${errMsg}`,
            }, { status: 422 });
        }

    } catch (error) {
        console.error('[Refresh] Error:', error.message);
        return NextResponse.json({ result: false, error: error.message }, { status: 500 });
    }
}
