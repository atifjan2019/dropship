import { syncTracking } from '@/lib/sync-service';
import { NextResponse } from 'next/server';

/**
 * GET /api/cron/sync-tracking
 *
 * Called by Vercel Cron every 6 hours.
 * Protected by CRON_SECRET environment variable.
 */
export async function GET(request) {
    // Verify cron secret to prevent unauthorized calls
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('[Cron] Starting tracking sync at', new Date().toISOString());
        const result = await syncTracking();
        console.log('[Cron] Tracking sync complete:', result);

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            ...result,
        });
    } catch (error) {
        console.error('[Cron] Tracking sync failed:', error.message);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
