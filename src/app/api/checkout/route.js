import { supabase } from '@/lib/supabase';
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

        // 5. Order saved — wait for admin approval before submitting to CJ
        // Admin will approve via the orders dashboard, which triggers /api/orders/[id]/retry-cj

        return NextResponse.json({
            result: true,
            code: 200,
            data: {
                orderId: order.id,
                orderNumber: order.order_number,
                status: 'pending',
                total,
            },
            message: 'Order placed successfully! We will process it shortly.',
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
