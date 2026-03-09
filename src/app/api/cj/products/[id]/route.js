import { getProductDetails, getProductVariants } from '@/lib/cj-api';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    try {
        const { id } = await params;

        // Product Details endpoint already returns variants[] inside data
        const details = await getProductDetails(id);
        const product = details.data || {};

        // If variants not included in details, fetch separately
        let variants = product.variants || [];
        if (!variants.length) {
            try {
                const variantRes = await getProductVariants(id);
                variants = variantRes.data || [];
            } catch (e) {
                // Variant fetch may fail for some products, continue without
            }
        }

        return NextResponse.json({
            code: details.code,
            result: details.result,
            data: {
                ...product,
                variants,
            },
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
