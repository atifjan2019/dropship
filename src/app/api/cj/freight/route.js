import { calculateFreight } from '@/lib/cj-api';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { products, endCountryCode = 'US' } = body;

        if (!products || !Array.isArray(products) || products.length === 0) {
            return NextResponse.json({ error: 'Products array is required' }, { status: 400 });
        }

        const data = await calculateFreight({
            startCountryCode: 'CN',
            endCountryCode,
            products,
        });

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
