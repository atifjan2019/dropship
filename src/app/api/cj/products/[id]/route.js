import { getProductDetails, getProductVariants } from '@/lib/cj-api';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const [details, variants] = await Promise.all([
            getProductDetails(id),
            getProductVariants(id),
        ]);

        return NextResponse.json({
            ...details,
            variants: variants.data || [],
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
