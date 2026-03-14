'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth } from '@/context/AdminAuthContext';

export default function AdminCustomersPage() {
    const { isAuthenticated, isLoading, adminFetch, logout } = useAdminAuth();
    const router = useRouter();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!isLoading && !isAuthenticated) router.push('/admin');
    }, [isLoading, isAuthenticated, router]);

    const fetchCustomers = useCallback(async (p = 1) => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: p, size: 20 });
            if (search) params.set('search', search);
            const res = await adminFetch(`/api/admin/customers?${params}`);
            if (res.status === 401) { logout(); router.push('/admin'); return; }
            const data = await res.json();
            setCustomers(data.data?.list || []);
            setTotal(data.data?.total || 0);
            setTotalPages(data.data?.totalPages || 1);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    }, [isAuthenticated, adminFetch, search, logout, router]);

    useEffect(() => {
        fetchCustomers(page);
    }, [page, fetchCustomers]);

    function handleSearch(e) {
        e.preventDefault();
        setPage(1);
        fetchCustomers(1);
    }

    if (isLoading || !isAuthenticated) return null;

    return (
        <>
            <div className="page-header">
                <h1>👥 Customers</h1>
                <p>View and manage your customer base</p>
            </div>

            <div className="section" style={{ maxWidth: 1100, margin: '0 auto' }}>
                {/* Admin Navigation */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                    <Link href="/admin/dashboard" className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>📊 Dashboard</Link>
                    <Link href="/admin/orders" className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>📦 Orders</Link>
                    <Link href="/admin/products" className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>🛍️ Products</Link>
                    <Link href="/admin/customers" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>👥 Customers</Link>
                    <Link href="/admin/messages" className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>✉️ Messages</Link>
                    <Link href="/admin/sync" className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>⚙️ Sync</Link>
                    <button onClick={() => { logout(); router.push('/admin'); }} className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '0.82rem', marginLeft: 'auto' }}>🚪 Logout</button>
                </div>

                {/* Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{total} customers total</div>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
                        <input
                            className="form-input"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ width: 240 }}
                        />
                        <button type="submit" className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.82rem' }}>Search</button>
                    </form>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                {['Customer', 'Email', 'Phone', 'Orders', 'Total Spent', 'Joined'].map(h => (
                                    <th key={h} style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</td></tr>
                            ) : customers.length === 0 ? (
                                <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No customers found</td></tr>
                            ) : customers.map(c => (
                                <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-glass)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                                        {c.firstName || ''} {c.lastName || ''}
                                    </td>
                                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{c.email}</td>
                                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{c.phone || '—'}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                        <span style={{
                                            display: 'inline-block', padding: '3px 10px', borderRadius: 12,
                                            background: '#3b82f618', color: '#3b82f6',
                                            fontWeight: 600, fontSize: '0.75rem',
                                        }}>
                                            {c.orderCount}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--accent)' }}>
                                        ${c.totalSpent.toFixed(2)}
                                    </td>
                                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>← Prev</button>
                        <span style={{ padding: '6px 14px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Page {page} of {totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>Next →</button>
                    </div>
                )}
            </div>
        </>
    );
}
