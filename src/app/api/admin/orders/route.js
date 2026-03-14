import { supabase } from '@/lib/supabase';
import { getTrackingUrl } from '@/lib/sync-service';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/orders
 * Lists all orders with customer email, courier, tracking, and CJ error.
 * For admin use — no email filtering required.
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const size = Math.min(100, parseInt(searchParams.get('size') || '20'));
        const status = searchParams.get('status') || '';

        const from = (page - 1) * size;
        const to   = from + size - 1;

        let query = supabase
            .from('orders')
            .select('*, order_items(*), customers(email, first_name, last_name)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (status) query = query.eq('status', status);

        const { data: orders, error, count } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const list = (orders || []).map(o => ({
            orderId:       o.id,
            orderNum:      o.order_number,
            cjOrderId:     o.cj_order_id,
            orderStatus:   o.status,
            trackNumber:   o.tracking_number,
            courier:       o.courier,
            trackingUrl:   getTrackingUrl(o.tracking_number, o.courier),
            createDate:    o.created_at,
            lastUpdated:   o.tracking_updated_at,
            shippingName:  o.shipping_name,
            shippingCity:  o.shipping_city,
            shippingState: o.shipping_state,
            total:         o.total,
            cjError:       o.cj_error,
            customerEmail: o.customers?.email,
            customerName:  o.customers
                ? `${o.customers.first_name || ''} ${o.customers.last_name || ''}`.trim()
                : null,
            itemCount: (o.order_items || []).length,
        }));

        return NextResponse.json({
            code: 200,
            result: true,
            data: {
                list,
                total: count || 0,
                page,
                totalPages: Math.ceil((count || 0) / size),
            },
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
