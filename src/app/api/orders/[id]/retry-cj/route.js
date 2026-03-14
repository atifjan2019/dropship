import { supabase } from '@/lib/supabase';
import { createOrder, getBestLogistic, COUNTRY_NAMES } from '@/lib/cj-api';
import { NextResponse } from 'next/server';

/**
 * POST /api/orders/[id]/retry-cj
 *
 * Re-submits an existing order to CJ Dropshipping.
 * Used when the original CJ submission failed (cj_order_id is null).
 * Reads all required data from Supabase (order + order_items).
 */
export async function POST(request, { params }) {
    try {
        const { id } = await params;

        // 1. Fetch the order with its items and customer
        const { data: order, error: orderErr } = await supabase
            .from('orders')
            .select(`
                id, order_number, status, cj_order_id,
                shipping_name, shipping_address, shipping_city,
                shipping_state, shipping_zip, shipping_phone,
                customers(email, first_name, last_name),
                order_items(id, product_title, variant_name, quantity, unit_price,
                    product_variants(cj_variant_id))
            `)
            .eq('id', id)
            .single();

        if (orderErr || !order) {
            return NextResponse.json({ result: false, error: 'Order not found' }, { status: 404 });
        }

        // 2. If already has a CJ order ID, no need to re-submit
        if (order.cj_order_id) {
            return NextResponse.json({
                result: false,
                error: `Order already submitted to CJ (ID: ${order.cj_order_id}). Use Refresh to check tracking instead.`,
            }, { status: 400 });
        }

        // 3. Check we have items with CJ variant IDs
        const items = (order.order_items || []);
        if (items.length === 0) {
            return NextResponse.json({ result: false, error: 'No order items found' }, { status: 400 });
        }

        const cjProducts = items.map(item => ({
            vid:      item.product_variants?.cj_variant_id || null,
            quantity: item.quantity || 1,
        })).filter(p => p.vid); // only items that have a CJ variant ID

        if (cjProducts.length === 0) {
            return NextResponse.json({
                result: false,
                error: 'No valid CJ variant IDs found on this order. The products may not be linked to CJ.',
            }, { status: 400 });
        }

        // 4. Get best logistic
        const logisticName = await getBestLogistic(cjProducts, 'CN', 'US');

        const shippingCountryCode = 'US';
        const shippingCountry = COUNTRY_NAMES[shippingCountryCode] || 'United States';

        // Parse name from shipping_name or customer
        const customerEmail = order.customers?.email || '';
        const fullName = order.shipping_name ||
            `${order.customers?.first_name || ''} ${order.customers?.last_name || ''}`.trim();

        // 5. Build CJ order payload
        const cjOrderData = {
            orderNumber:          order.order_number,
            shippingCountryCode,
            shippingCountry,
            shippingProvince:     order.shipping_state,
            shippingCity:         order.shipping_city,
            shippingAddress:      order.shipping_address,
            shippingCustomerName: fullName,
            shippingZip:          order.shipping_zip,
            shippingPhone:        order.shipping_phone || '0000000000',
            email:                customerEmail,
            logisticName,
            fromCountryCode:      'CN',
            payType:              '3',
            products:             cjProducts,
        };

        console.log('[Retry CJ] Submitting order:', order.order_number, JSON.stringify(cjOrderData));

        // 6. Submit to CJ
        const cjResponse = await createOrder(cjOrderData);

        console.log('[Retry CJ] CJ response:', JSON.stringify(cjResponse));

        if (cjResponse.result || cjResponse.code === 200) {
            const cjOrderId = cjResponse.data?.orderId || cjResponse.data?.orderNum || null;

            // Update order with CJ ID and processing status
            await supabase
                .from('orders')
                .update({
                    cj_order_id: cjOrderId ? String(cjOrderId) : null,
                    status:      'processing',
                    cj_logistic: logisticName,
                    cj_error:    null, // clear previous error
                })
                .eq('id', id);

            return NextResponse.json({
                result:  true,
                code:    200,
                message: `✅ Order successfully submitted to CJ! CJ Order ID: ${cjOrderId}`,
                data:    { cjOrderId, logisticName, status: 'processing' },
            });
        } else {
            const errMsg = cjResponse.message || JSON.stringify(cjResponse);

            // Save the new error
            await supabase
                .from('orders')
                .update({
                    status:   'cj_submission_failed',
                    cj_error: errMsg,
                })
                .eq('id', id);

            return NextResponse.json({
                result: false,
                error:  `CJ rejected the order: ${errMsg}`,
                raw:    cjResponse,
            }, { status: 422 });
        }
    } catch (error) {
        console.error('[Retry CJ] Error:', error.message);
        return NextResponse.json({ result: false, error: error.message }, { status: 500 });
    }
}
