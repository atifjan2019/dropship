import { supabase } from '@/lib/supabase';
import { getTrackingUrl } from '@/lib/sync-service';
import { NextResponse } from 'next/server';

/**
 * GET /api/tracking/[orderNumber]?email=xxx
 *
 * Public-facing tracking endpoint.
 * Email param is optional — if provided it must match the order's customer email.
 * Returns: status, tracking number, courier, tracking URL.
 */
export async function GET(request, { params }) {
    try {
        const { orderNumber } = await params;
        const { searchParams } = new URL(request.url);
        const email = (searchParams.get('email') || '').toLowerCase().trim();

        if (!orderNumber) {
            return NextResponse.json({ error: 'Order number required' }, { status: 400 });
        }

        // Select only the original columns guaranteed to exist in the DB.
        // After running the migration SQL, courier + tracking_updated_at will be available.
        const { data: order, error } = await supabase
            .from('orders')
            .select(`
                id, order_number, status, tracking_number,
                created_at, total, shipping_name,
                shipping_city, shipping_state, shipping_zip,
                customers(email, first_name, last_name)
            `)
            .eq('order_number', orderNumber)
            .single();

        if (error) {
            console.error('[Tracking] Supabase error:', error.message);
            // Return the actual DB error in development for easier debugging
            return NextResponse.json(
                { error: 'Order not found', detail: error.message },
                { status: 404 }
            );
        }
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Email verification — if email is provided it must match
        if (email) {
            const customerEmail = (order.customers?.email || '').toLowerCase();
            if (customerEmail !== email) {
                return NextResponse.json({ error: 'Email does not match this order' }, { status: 403 });
            }
        }

        // courier and trackingUrl will be null until migration runs and tracking syncs
        const courier = null; // populated after: ALTER TABLE orders ADD COLUMN courier TEXT
        const trackingUrl = getTrackingUrl(order.tracking_number, courier);

        return NextResponse.json({
            result: true,
            code: 200,
            data: {
                orderId:         order.id,              // UUID — used by refresh button
                orderNumber:     order.order_number,
                status:          order.status,
                trackingNumber:  order.tracking_number || null,
                courier,
                trackingUrl,
                shippingName:    order.shipping_name || null,
                shippingLocation: [order.shipping_city, order.shipping_state, order.shipping_zip]
                    .filter(Boolean).join(', '),
                total:           order.total,
                createdAt:       order.created_at,
                lastUpdated:     null, // populated after: ALTER TABLE orders ADD COLUMN tracking_updated_at
            },
        });
    } catch (error) {
        console.error('[Tracking] Unexpected error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

