import { supabase } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/customers
 * Lists all customers with order counts.
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
        const search = searchParams.get('search') || '';

        const from = (page - 1) * size;
        const to = from + size - 1;

        let query = supabase
            .from('customers')
            .select('*, orders(id, total, status)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (search) {
            query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
        }

        const { data: customers, error, count } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const list = (customers || []).map(c => {
            const orders = c.orders || [];
            return {
                id: c.id,
                email: c.email,
                firstName: c.first_name,
                lastName: c.last_name,
                phone: c.phone,
                createdAt: c.created_at,
                orderCount: orders.length,
                totalSpent: parseFloat(orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0).toFixed(2)),
            };
        });

        return NextResponse.json({
            result: true,
            data: {
                list,
                total: count || 0,
                page,
                totalPages: Math.ceil((count || 0) / size),
            },
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
