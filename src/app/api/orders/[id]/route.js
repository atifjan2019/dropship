import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    try {
        const { id } = await params;

        const { data: order, error } = await supabase
            .from('orders')
            .select('*, order_items(*), customers(email, first_name, last_name)')
            .eq('id', id)
            .single();

        if (error || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({
            code: 200,
            result: true,
            data: {
                orderId: order.id,
                orderNum: order.order_number,
                cjOrderId: order.cj_order_id,
                orderStatus: order.status,
                trackNumber: order.tracking_number,
                createDate: order.created_at,
                shippingName: order.shipping_name,
                shippingAddress: order.shipping_address,
                shippingCity: order.shipping_city,
                shippingState: order.shipping_state,
                shippingZip: order.shipping_zip,
                total: order.total,
                customer: order.customers,
                productList: (order.order_items || []).map(item => ({
                    productNameEn: item.product_title,
                    productImage: item.image_url,
                    quantity: item.quantity,
                    unitPrice: item.unit_price,
                    variantName: item.variant_name,
                })),
            },
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
