import { syncTracking } from '@/lib/sync-service';
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const result = await syncTracking();
        return NextResponse.json({
            success: true,
            message: `Updated ${result.updated} orders`,
            ...result,
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
