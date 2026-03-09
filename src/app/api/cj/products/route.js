import { searchProducts } from '@/lib/cj-api';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const keyword = searchParams.get('keyword') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const size = parseInt(searchParams.get('size') || '20');
        const categoryId = searchParams.get('categoryId') || '';

        const data = await searchProducts({ keyword, page, size, categoryId, countryCode: 'US' });
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
