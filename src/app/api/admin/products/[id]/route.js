import { supabase } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

/**
 * PATCH /api/admin/products/[id]
 * Update product fields (sell_price, is_active, title, etc.)
 */
export async function PATCH(request, { params }) {
    const auth = verifyAdmin(request);
    if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await request.json();

        // Only allow updating specific fields
        const allowedFields = ['title', 'sell_price', 'is_active', 'category', 'description'];
        const updateData = {};
        for (const key of allowedFields) {
            if (body[key] !== undefined) {
                // Map camelCase to snake_case
                const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
                updateData[dbKey] = body[key];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            result: true,
            message: 'Product updated successfully',
            data,
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/products/[id]
 * Hard-delete a product and its variants.
 */
export async function DELETE(request, { params }) {
    const auth = verifyAdmin(request);
    if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    try {
        const { id } = await params;

        // Variants cascade delete due to FK constraint
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            result: true,
            message: 'Product deleted successfully',
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
