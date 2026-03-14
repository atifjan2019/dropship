import { supabase } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/messages
 * List all contact form messages.
 */
export async function GET(request) {
    const auth = verifyAdmin(request);
    if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const size = Math.min(100, parseInt(searchParams.get('size') || '20'));
        const from = (page - 1) * size;
        const to = from + size - 1;

        const { data, error, count } = await supabase
            .from('contact_messages')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            result: true,
            data: {
                list: data || [],
                total: count || 0,
                page,
                totalPages: Math.ceil((count || 0) / size),
            },
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
