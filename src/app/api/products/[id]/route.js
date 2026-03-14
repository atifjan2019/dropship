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

export async function GET(request, { params }) {
    try {
        const { id } = await params;

        // Try to find by cj_product_id first, then by uuid
        let query;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        if (isUUID) {
            query = supabase
                .from('products')
                .select('*, product_variants(*)')
                .eq('id', id)
                .single();
        } else {
            query = supabase
                .from('products')
                .select('*, product_variants(*)')
                .eq('cj_product_id', id)
                .single();
        }

        const { data: product, error } = await query;

        if (error || !product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Map to frontend-compatible format
        const variants = (product.product_variants || []).map(v => ({
            vid: v.cj_variant_id,
            dbId: v.id,
            variantNameEn: v.name,
            variantImage: parseImageUrl(v.image_url),
            baseCost: v.base_cost,
            sellPrice: v.sell_price,
            variantStock: v.stock,
        }));

        return NextResponse.json({
            code: 200,
            result: true,
            data: {
                pid: product.cj_product_id,
                dbId: product.id,
                productNameEn: product.title,
                productImage: parseImageUrl(product.image_url),
                baseCost: product.base_cost,
                sellPrice: product.sell_price,
                warehouse: product.warehouse,
                categoryName: product.category,
                description: product.description,
                variants,
            },
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
