import { supabase } from '@/lib/supabase';
import { createOrder, getBestLogistic, COUNTRY_NAMES } from '@/lib/cj-api';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { customer, items } = body;

        // Validate input
        if (!customer || !customer.email || !customer.firstName || !customer.lastName) {
            return NextResponse.json({ error: 'Customer info required (email, firstName, lastName)' }, { status: 400 });
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'Order items required' }, { status: 400 });
        }
        if (!customer.address || !customer.city || !customer.state || !customer.zip) {
            return NextResponse.json({ error: 'Shipping address required' }, { status: 400 });
        }

        // 1. Create or find customer
        const { data: existingCustomer } = await supabase
            .from('customers')
            .select('id')
            .eq('email', customer.email)
            .single();

        let customerId;
        if (existingCustomer) {
            customerId = existingCustomer.id;
            // Update customer details
            await supabase
                .from('customers')
                .update({
                    first_name: customer.firstName,
                    last_name: customer.lastName,
                    phone: customer.phone || '',
                })
                .eq('id', customerId);
        } else {
            const { data: newCustomer, error: custError } = await supabase
                .from('customers')
                .insert({
                    email: customer.email,
                    first_name: customer.firstName,
                    last_name: customer.lastName,
                    phone: customer.phone || '',
                })
                .select()
                .single();

            if (custError) {
                return NextResponse.json({ error: 'Failed to create customer: ' + custError.message }, { status: 500 });
            }
            customerId = newCustomer.id;
        }

        // 2. Calculate total
        const total = items.reduce((sum, item) => sum + (parseFloat(item.sellPrice) || 0) * (item.quantity || 1), 0);

        // 3. Create local order
        const orderNumber = `VLR-${Date.now()}`;
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                order_number: orderNumber,
                customer_id: customerId,
                status: 'pending',
                shipping_name: `${customer.firstName} ${customer.lastName}`,
                shipping_address: customer.address,
                shipping_city: customer.city,
                shipping_state: customer.state,
                shipping_zip: customer.zip,
                shipping_country: 'US',
                shipping_phone: customer.phone || '',
                total,
            })
            .select()
            .single();

        if (orderError) {
            return NextResponse.json({ error: 'Failed to create order: ' + orderError.message }, { status: 500 });
        }

        // 4. Create order items — store cj_vid directly for retry purposes
        const orderItems = items.map(item => ({
            order_id:      order.id,
            product_id:    item.dbProductId || null,
            variant_id:    item.dbVariantId || null,
            cj_vid:        item.vid || null,          // CJ variant ID — required for retry
            product_title: item.productNameEn || '',
            variant_name:  item.variantName || '',
            image_url:     item.productImage || '',
            quantity:      item.quantity || 1,
            unit_price:    parseFloat(item.sellPrice) || 0,
        }));

        await supabase.from('order_items').insert(orderItems);

        // 5. Submit to CJ Dropshipping
        let cjOrderId = null;
        let cjResponse = null;
        let cjError = null;
        try {
            // Fetch best (cheapest) shipping method for this order
            const logisticName = await getBestLogistic(
                items.map(item => ({ vid: item.vid, quantity: item.quantity || 1 })),
                'CN',
                'US'
            );

            const shippingCountryCode = 'US';
            const shippingCountry = COUNTRY_NAMES[shippingCountryCode] || 'United States';

            const cjOrderData = {
                // ─── Order identifier ─────────────────────────
                orderNumber: orderNumber,

                // ─── Shipping address (all required by CJ) ────
                shippingCountryCode,                        // 'US'
                shippingCountry,                            // 'United States' — REQUIRED alongside code
                shippingProvince: customer.state,           // e.g. 'California'
                shippingCity:     customer.city,
                shippingAddress:  customer.address,
                shippingCustomerName: `${customer.firstName} ${customer.lastName}`,
                shippingZip:   customer.zip,
                shippingPhone: customer.phone || '0000000000',
                email:         customer.email || '',

                // ─── Logistics (required) ─────────────────────
                logisticName,                               // auto-selected cheapest route
                fromCountryCode: 'CN',                      // ship from China warehouse

                // ─── Payment type ─────────────────────────────
                // payType=3: create order only — no payment/cart flow needed
                // (payType=2 uses CJ balance; payType=1 returns cjPayUrl for web payment)
                payType: '3',

                // ─── Products ─────────────────────────────────
                products: items.map(item => ({
                    vid:      item.vid,           // CJ variant ID (required)
                    quantity: item.quantity || 1,
                })),

                // NOTE: Fields deliberately omitted:
                // - platform   → error 5027 'Platform custom not support'
                // - remark     → causes validation issues when empty
                // - shippingAddress2  → optional, skip unless provided
                // - shippingCounty    → optional US county, skip
                // - taxId, iossNumber → not needed for US orders
            };

            console.log('[Checkout] Submitting to CJ:', JSON.stringify(cjOrderData));

            cjResponse = await createOrder(cjOrderData);

            console.log('[Checkout] CJ response:', JSON.stringify(cjResponse));

            if (cjResponse.result || cjResponse.code === 200) {
                cjOrderId = cjResponse.data?.orderId || cjResponse.data?.orderNum || null;

                // Update order with CJ order ID
                await supabase
                    .from('orders')
                    .update({
                        cj_order_id: cjOrderId ? String(cjOrderId) : null,
                        status: 'processing',
                        cj_logistic: logisticName,
                    })
                    .eq('id', order.id);
            } else {
                cjError = cjResponse.message || 'CJ submission failed';
                console.error('[Checkout] CJ submission failed:', cjError);
                // CJ order failed but local order is saved
                await supabase
                    .from('orders')
                    .update({
                        status: 'cj_submission_failed',
                        cj_error: cjError,
                    })
                    .eq('id', order.id);
            }
        } catch (cjErr) {
            cjError = cjErr.message;
            console.error('[Checkout] CJ exception:', cjErr.message);
            // CJ submission failed — order is saved locally, can retry later
            await supabase
                .from('orders')
                .update({
                    status: 'cj_submission_failed',
                    cj_error: cjErr.message,
                })
                .eq('id', order.id);
        }

        return NextResponse.json({
            result: true,
            code: 200,
            data: {
                orderId: order.id,
                orderNumber: order.order_number,
                cjOrderId,
                cjError: cjError || null,
                status: cjOrderId ? 'processing' : 'cj_submission_failed',
                total,
            },
            message: cjOrderId
                ? 'Order placed successfully'
                : `Order saved locally (CJ error: ${cjError || 'unknown'}). Our team will retry fulfilment.`,
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
