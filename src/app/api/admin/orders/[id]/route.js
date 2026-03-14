import { supabase } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

/**
 * PATCH /api/admin/orders/[id]
 * Update order status manually.
 */
export async function PATCH(request, { params }) {
    const auth = verifyAdmin(request);
    if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await request.json();

        const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'cj_submission_failed'];
        const updateData = {};

        if (body.status) {
            if (!allowedStatuses.includes(body.status)) {
                return NextResponse.json({ error: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` }, { status: 400 });
            }
            updateData.status = body.status;
        }

        if (body.trackingNumber !== undefined) {
            updateData.tracking_number = body.trackingNumber;
        }

        if (body.courier !== undefined) {
            updateData.courier = body.courier;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            result: true,
            message: 'Order updated successfully',
            data,
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
