import { getOrderDetails, getTrackingInfo } from '@/lib/cj-api';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const [details, tracking] = await Promise.all([
            getOrderDetails(id),
            getTrackingInfo(id).catch(() => ({ data: null })),
        ]);

        return NextResponse.json({
            ...details,
            tracking: tracking.data || null,
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
