import { supabase } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/products
 * Lists all products (including inactive) for admin management.
 */
export async function GET(request) {
    const auth = verifyAdmin(request);
    if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const size = Math.min(100, parseInt(searchParams.get('size') || '20'));
        const search = searchParams.get('search') || '';
        const active = searchParams.get('active'); // 'true', 'false', or null (all)

        const from = (page - 1) * size;
        const to = from + size - 1;

        let query = supabase
            .from('products')
            .select('*, product_variants(*)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (search) {
            query = query.ilike('title', `%${search}%`);
        }
        if (active === 'true') query = query.eq('is_active', true);
        if (active === 'false') query = query.eq('is_active', false);

        const { data: products, error, count } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const list = (products || []).map(p => ({
            id: p.id,
            cjProductId: p.cj_product_id,
            title: p.title,
            imageUrl: p.image_url,
            category: p.category,
            warehouse: p.warehouse,
            baseCost: p.base_cost,
            sellPrice: p.sell_price,
            isActive: p.is_active,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
            variantCount: (p.product_variants || []).length,
        }));

        return NextResponse.json({
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
