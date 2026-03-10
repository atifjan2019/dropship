import { importProducts } from '@/lib/sync-service';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json().catch(() => ({}));
        const keyword = body.keyword || '';
        const pages = Math.min(parseInt(body.pages) || 1, 10); // Cap at 10 pages
        const size = Math.min(parseInt(body.size) || 20, 50);

        const result = await importProducts({ keyword, pages, size });

        return NextResponse.json({
            success: true,
            message: `Imported ${result.synced} products${result.errors > 0 ? ` (${result.errors} errors)` : ''}`,
            ...result,
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
