import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email') || '';
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const size = Math.min(50, parseInt(searchParams.get('size') || '20'));

        const from = (page - 1) * size;
        const to = from + size - 1;

        let query = supabase
            .from('orders')
            .select('*, order_items(*), customers(email, first_name, last_name)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (email) {
            // Find customer first, then filter orders
            const { data: customer } = await supabase
                .from('customers')
                .select('id')
                .eq('email', email)
                .single();

            if (customer) {
                query = query.eq('customer_id', customer.id);
            } else {
                return NextResponse.json({
                    code: 200,
                    result: true,
                    data: { list: [], total: 0, page, totalPages: 0 },
                });
            }
        }

        const { data: orders, error, count } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Map to frontend format
        const list = (orders || []).map(o => ({
            orderId: o.id,
            orderNum: o.order_number,
            cjOrderId: o.cj_order_id,
            orderStatus: o.status,
            trackNumber: o.tracking_number,
            createDate: o.created_at,
            shippingName: o.shipping_name,
            total: o.total,
            productList: (o.order_items || []).map(item => ({
                productNameEn: item.product_title,
                productImage: item.image_url,
                quantity: item.quantity,
                unitPrice: item.unit_price,
                variantName: item.variant_name,
            })),
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
