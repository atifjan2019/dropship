import { getCategories } from '@/lib/cj-api';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const data = await getCategories();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
