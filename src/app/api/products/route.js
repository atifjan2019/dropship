import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

function parseImageUrl(val) {
    if (!val) return '';
    if (typeof val === 'string' && val.startsWith('[')) {
        try {
            const arr = JSON.parse(val);
            return Array.isArray(arr) && arr.length > 0 ? arr[0] : '';
        } catch { return val; }
    }
    return val;
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || searchParams.get('keyword') || '';
        const category = searchParams.get('category') || searchParams.get('categoryId') || '';
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const size = Math.min(50, parseInt(searchParams.get('size') || '20'));

        const from = (page - 1) * size;
        const to = from + size - 1;

        let query = supabase
            .from('products')
            .select('*, product_variants(*)', { count: 'exact' })
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (search) {
            query = query.ilike('title', `%${search}%`);
        }
        if (category) {
            query = query.ilike('category', `%${category}%`);
        }

        const { data: products, error, count } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Map to frontend-compatible format
        const list = (products || []).map(p => ({
            pid: p.cj_product_id,
            dbId: p.id,
            productNameEn: p.title,
            productImage: parseImageUrl(p.image_url),
            sellPrice: p.sell_price,
            categoryName: p.category,
            description: p.description,
            variants: (p.product_variants || []).map(v => ({
                vid: v.cj_variant_id,
                dbId: v.id,
                variantNameEn: v.name,
                variantImage: parseImageUrl(v.image_url),
                sellPrice: v.sell_price,
                variantStock: v.stock,
            })),
        }));

        const total = count || 0;

        return NextResponse.json({
            code: 200,
            result: true,
            data: {
                list,
                total,
                page,
                totalPages: Math.ceil(total / size),
            },
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
