import { supabase } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/dashboard
 * Returns aggregate stats: revenue, order counts, product counts, recent orders.
 */
export async function GET(request) {
    const auth = verifyAdmin(request);
    if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    try {
        // Run queries in parallel
        const [
            ordersResult,
            productsResult,
            customersResult,
            recentOrdersResult,
        ] = await Promise.all([
            // All orders with totals
            supabase.from('orders').select('id, status, total, created_at'),
            // Product counts
            supabase.from('products').select('id, is_active', { count: 'exact' }),
            // Customer count
            supabase.from('customers').select('id', { count: 'exact' }),
            // Recent 10 orders
            supabase
                .from('orders')
                .select('id, order_number, status, total, created_at, shipping_name, customers(email)')
                .order('created_at', { ascending: false })
                .limit(10),
        ]);

        const orders = ordersResult.data || [];
        const products = productsResult.data || [];

        // Calculate stats
        const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        const processingOrders = orders.filter(o => o.status === 'processing').length;
        const shippedOrders = orders.filter(o => o.status === 'shipped').length;
        const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
        const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
        const failedOrders = orders.filter(o => o.status === 'cj_submission_failed').length;

        const totalProducts = products.length;
        const activeProducts = products.filter(p => p.is_active).length;
        const totalCustomers = customersResult.count || 0;

        // Revenue by day (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const revenueByDay = {};
        orders.forEach(o => {
            const date = new Date(o.created_at);
            if (date >= thirtyDaysAgo) {
                const key = date.toISOString().split('T')[0];
                revenueByDay[key] = (revenueByDay[key] || 0) + (parseFloat(o.total) || 0);
            }
        });

        // Orders today
        const today = new Date().toISOString().split('T')[0];
        const ordersToday = orders.filter(o => o.created_at?.startsWith(today)).length;
        const revenueToday = orders
            .filter(o => o.created_at?.startsWith(today))
            .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

        return NextResponse.json({
            result: true,
            data: {
                stats: {
                    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                    totalOrders,
                    ordersToday,
                    revenueToday: parseFloat(revenueToday.toFixed(2)),
                    totalProducts,
                    activeProducts,
                    totalCustomers,
                    ordersByStatus: {
                        pending: pendingOrders,
                        processing: processingOrders,
                        shipped: shippedOrders,
                        delivered: deliveredOrders,
                        cancelled: cancelledOrders,
                        failed: failedOrders,
                    },
                },
                revenueByDay,
                recentOrders: (recentOrdersResult.data || []).map(o => ({
                    orderId: o.id,
                    orderNum: o.order_number,
                    status: o.status,
                    total: o.total,
                    date: o.created_at,
                    shippingName: o.shipping_name,
                    customerEmail: o.customers?.email,
                })),
            },
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
