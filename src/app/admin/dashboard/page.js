'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth } from '@/context/AdminAuthContext';

const STATUS_COLORS = {
    pending: '#f59e0b',
    processing: '#3b82f6',
    shipped: '#8b5cf6',
    delivered: '#10b981',
    cancelled: '#ef4444',
    failed: '#ef4444',
};

export default function AdminDashboardPage() {
    const { isAuthenticated, isLoading, adminFetch, logout } = useAdminAuth();
    const router = useRouter();
    const [stats, setStats] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/admin');
        }
    }, [isLoading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) fetchDashboard();
    }, [isAuthenticated]);

    async function fetchDashboard() {
        setLoading(true);
        try {
            const res = await adminFetch('/api/admin/dashboard');
            if (res.status === 401) { logout(); router.push('/admin'); return; }
            const data = await res.json();
            setStats(data.data?.stats || null);
            setRecentOrders(data.data?.recentOrders || []);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    }

    if (isLoading || !isAuthenticated) return null;

    return (
        <>
            <div className="page-header">
                <h1>📊 Admin Dashboard</h1>
                <p>Overview of your store performance</p>
            </div>

            <div className="section" style={{ maxWidth: 1100, margin: '0 auto' }}>
                {/* Admin Navigation */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                    <Link href="/admin/dashboard" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>📊 Dashboard</Link>
                    <Link href="/admin/orders" className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>📦 Orders</Link>
                    <Link href="/admin/products" className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>🛍️ Products</Link>
                    <Link href="/admin/customers" className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>👥 Customers</Link>
                    <Link href="/admin/messages" className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>✉️ Messages</Link>
                    <Link href="/admin/sync" className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>⚙️ Sync</Link>
                    <button onClick={() => { logout(); router.push('/admin'); }} className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '0.82rem', marginLeft: 'auto' }}>🚪 Logout</button>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading dashboard...</div>
                ) : stats && (
                    <>
                        {/* Stats Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
                            {[
                                { label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, icon: '💰', color: '#10b981' },
                                { label: 'Total Orders', value: stats.totalOrders, icon: '📦', color: '#3b82f6' },
                                { label: 'Today\'s Revenue', value: `$${stats.revenueToday.toFixed(2)}`, icon: '📈', color: '#8b5cf6' },
                                { label: 'Orders Today', value: stats.ordersToday, icon: '🛒', color: '#f59e0b' },
                                { label: 'Active Products', value: `${stats.activeProducts}/${stats.totalProducts}`, icon: '🛍️', color: '#6366f1' },
                                { label: 'Customers', value: stats.totalCustomers, icon: '👥', color: '#ec4899' },
                            ].map(s => (
                                <div key={s.label} className="card" style={{ padding: '18px 20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{s.label}</span>
                                        <span style={{ fontSize: '1.2rem' }}>{s.icon}</span>
                                    </div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Order Status Breakdown */}
                        <div className="card" style={{ marginBottom: 28 }}>
                            <div className="card-title">📊 Orders by Status</div>
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                                    <div key={status} style={{
                                        padding: '10px 18px', borderRadius: 'var(--radius-md)',
                                        background: (STATUS_COLORS[status] || '#6b7280') + '12',
                                        border: `1px solid ${(STATUS_COLORS[status] || '#6b7280')}30`,
                                        textAlign: 'center', minWidth: 100,
                                    }}>
                                        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: STATUS_COLORS[status] || '#6b7280' }}>{count}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: 2 }}>{status.replace(/_/g, ' ')}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Orders */}
                        <div className="card">
                            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>📋 Recent Orders</span>
                                <Link href="/admin/orders" style={{ fontSize: '0.82rem', color: 'var(--accent)' }}>View All →</Link>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                            {['Order #', 'Customer', 'Status', 'Total', 'Date'].map(h => (
                                                <th key={h} style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentOrders.map(o => (
                                            <tr key={o.orderId} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '10px 12px', fontWeight: 600, fontFamily: 'monospace' }}>{o.orderNum}</td>
                                                <td style={{ padding: '10px 12px' }}>{o.customerEmail || o.shippingName || '—'}</td>
                                                <td style={{ padding: '10px 12px' }}>
                                                    <span style={{
                                                        display: 'inline-block', padding: '3px 10px', borderRadius: 12,
                                                        background: (STATUS_COLORS[o.status] || '#6b7280') + '18',
                                                        color: STATUS_COLORS[o.status] || '#6b7280',
                                                        fontWeight: 600, fontSize: '0.75rem', textTransform: 'capitalize',
                                                    }}>
                                                        {(o.status || 'unknown').replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--accent)' }}>${Number(o.total || 0).toFixed(2)}</td>
                                                <td style={{ padding: '10px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                    {o.date ? new Date(o.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
