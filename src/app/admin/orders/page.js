'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth } from '@/context/AdminAuthContext';

const STATUS_COLORS = {
    pending:              '#f59e0b',
    processing:           '#3b82f6',
    shipped:              '#8b5cf6',
    delivered:            '#10b981',
    cancelled:            '#ef4444',
    cj_submission_failed: '#ef4444',
};

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

function StatusBadge({ status }) {
    const color = STATUS_COLORS[status] || '#6b7280';
    const label = (status || 'unknown').replace(/_/g, ' ');
    return (
        <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: 12,
            background: color + '18', color, fontWeight: 600,
            fontSize: '0.75rem', textTransform: 'capitalize', whiteSpace: 'nowrap',
        }}>
            {label}
        </span>
    );
}

export default function AdminOrdersPage() {
    const { isAuthenticated, isLoading, adminFetch, logout } = useAdminAuth();
    const router = useRouter();
    const [orders, setOrders]     = useState([]);
    const [loading, setLoading]   = useState(true);
    const [page, setPage]         = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal]       = useState(0);
    const [filter, setFilter]     = useState('active');
    const [refreshingId, setRefreshingId] = useState(null);
    const [syncing, setSyncing]   = useState(false);
    const [syncMsg, setSyncMsg]   = useState('');
    const [editingStatusId, setEditingStatusId] = useState(null);
    const [approvingId, setApprovingId] = useState(null);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) router.push('/admin');
    }, [isLoading, isAuthenticated, router]);

    const fetchOrders = useCallback(async (p = 1) => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: p, size: 20 });
            const res  = await adminFetch(`/api/admin/orders?${params}`);
            if (res.status === 401) { logout(); router.push('/admin'); return; }
            const data = await res.json();
            setOrders(data.data?.list || []);
            setTotal(data.data?.total || 0);
            setTotalPages(data.data?.totalPages || 1);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    }, [isAuthenticated, adminFetch, logout, router]);

    useEffect(() => { fetchOrders(page); }, [page, fetchOrders]);

    const filtered = orders.filter(o => {
        if (filter === 'active')    return !['delivered', 'cancelled', 'cj_submission_failed'].includes(o.orderStatus);
        if (filter === 'delivered') return o.orderStatus === 'delivered';
        if (filter === 'failed')    return o.orderStatus === 'cj_submission_failed';
        return true;
    });

    async function refreshOne(orderId) {
        setRefreshingId(orderId);
        try {
            await fetch(`/api/orders/${orderId}/refresh`, { method: 'POST' });
            await fetchOrders(page);
        } catch {}
        setRefreshingId(null);
    }

    async function syncAll() {
        setSyncing(true);
        setSyncMsg('');
        try {
            const res  = await fetch('/api/sync/tracking', { method: 'POST' });
            const data = await res.json();
            setSyncMsg(`✅ Done: checked ${data.checked || '?'} orders, updated ${data.updated || 0}`);
            await fetchOrders(page);
        } catch (err) {
            setSyncMsg('❌ Sync failed: ' + err.message);
        }
        setSyncing(false);
    }

    async function updateOrderStatus(orderId, newStatus) {
        try {
            await adminFetch(`/api/admin/orders/${orderId}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus }),
            });
            setEditingStatusId(null);
            await fetchOrders(page);
        } catch {}
    }

    async function approveOrder(orderId) {
        if (!confirm('Approve this order and submit to CJ Dropshipping?')) return;
        setApprovingId(orderId);
        try {
            const res = await fetch(`/api/orders/${orderId}/retry-cj`, { method: 'POST' });
            const data = await res.json();
            if (data.result) {
                setSyncMsg(`Order approved and sent to CJ`);
            } else {
                setSyncMsg(`CJ error: ${data.error || 'unknown'}`);
            }
            await fetchOrders(page);
        } catch (err) {
            setSyncMsg(`Approve failed: ${err.message}`);
        }
        setApprovingId(null);
    }

    if (isLoading || !isAuthenticated) return null;

    return (
        <>
            <div className="admin-page-header">
                <h1>Orders Dashboard</h1>
                <p>Track and manage all customer orders</p>
            </div>

            <div className="admin-page-body">

                {/* Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {['all', 'active', 'delivered', 'failed'].map(f => (
                            <button
                                key={f}
                                id={`filter-${f}`}
                                onClick={() => setFilter(f)}
                                style={{
                                    padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                                    fontWeight: 600, fontSize: '0.8rem', textTransform: 'capitalize',
                                    background: filter === f ? 'var(--accent)' : 'var(--bg-glass)',
                                    color: filter === f ? 'white' : 'var(--text-secondary)',
                                    transition: 'all var(--transition)',
                                }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {syncMsg && <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{syncMsg}</span>}
                        <button
                            id="sync-all-tracking-btn"
                            onClick={syncAll}
                            disabled={syncing}
                            className="btn btn-primary"
                            style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                        >
                            {syncing ? '⏳ Syncing...' : '🔄 Sync All Tracking'}
                        </button>
                    </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
                    {[
                        { label: 'Total Orders',    value: total,                             color: '#3b82f6' },
                        { label: 'Active',          value: orders.filter(o => !['delivered','cancelled','cj_submission_failed'].includes(o.orderStatus)).length, color: '#8b5cf6' },
                        { label: 'Delivered',       value: orders.filter(o => o.orderStatus === 'delivered').length, color: '#10b981' },
                        { label: 'Failed',          value: orders.filter(o => o.orderStatus === 'cj_submission_failed').length, color: '#ef4444' },
                    ].map(s => (
                        <div key={s.label} style={{
                            flex: '1 1 140px', padding: '12px 16px', borderRadius: 'var(--radius-md)',
                            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                        }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                {['Order #', 'Date', 'Customer', 'Status', 'Tracking', 'Courier', 'Total', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading
                                ? Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}><td colSpan={8} style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</td></tr>
                                ))
                                : filtered.length === 0
                                    ? <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No orders found</td></tr>
                                    : filtered.map((o) => (
                                        <tr key={o.orderId} style={{ borderBottom: '1px solid var(--border)', transition: 'background var(--transition)' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-glass)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '10px 12px', fontWeight: 600, fontFamily: 'monospace' }}>
                                                {o.orderNum}
                                            </td>
                                            <td style={{ padding: '10px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                {new Date(o.createDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td style={{ padding: '10px 12px' }}>
                                                {o.customerEmail || '—'}
                                            </td>
                                            <td style={{ padding: '10px 12px' }}>
                                                {editingStatusId === o.orderId ? (
                                                    <select
                                                        defaultValue={o.orderStatus}
                                                        onChange={e => updateOrderStatus(o.orderId, e.target.value)}
                                                        onBlur={() => setEditingStatusId(null)}
                                                        autoFocus
                                                        style={{
                                                            padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                                                            border: '1px solid var(--border)', background: 'var(--bg-primary)',
                                                            color: 'var(--text-primary)', fontSize: '0.78rem',
                                                        }}
                                                    >
                                                        {STATUSES.map(s => (
                                                            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span onClick={() => setEditingStatusId(o.orderId)} style={{ cursor: 'pointer' }} title="Click to change status">
                                                        <StatusBadge status={o.orderStatus} />
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                                                {o.trackNumber ? (
                                                    <a
                                                        href={`https://t.17track.net/en#nums=${encodeURIComponent(o.trackNumber)}`}
                                                        target="_blank" rel="noopener noreferrer"
                                                        style={{ color: 'var(--accent)', fontWeight: 500 }}
                                                    >
                                                        {o.trackNumber}
                                                    </a>
                                                ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                            </td>
                                            <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                                                {o.courier || '—'}
                                            </td>
                                            <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--accent)' }}>
                                                ${Number(o.total || 0).toFixed(2)}
                                            </td>
                                            <td style={{ padding: '10px 12px' }}>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    {(o.orderStatus === 'pending' || o.orderStatus === 'cj_submission_failed') && !o.cjOrderId && (
                                                        <button
                                                            onClick={() => approveOrder(o.orderId)}
                                                            disabled={approvingId === o.orderId}
                                                            title="Approve & submit to CJ"
                                                            style={{
                                                                padding: '4px 10px', borderRadius: 'var(--radius-sm)',
                                                                border: '1px solid var(--accent)', background: 'var(--accent)',
                                                                cursor: 'pointer', fontSize: '0.72rem', color: '#fff',
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {approvingId === o.orderId ? 'Sending...' : 'Approve'}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => refreshOne(o.orderId)}
                                                        disabled={refreshingId === o.orderId}
                                                        title="Refresh tracking from CJ"
                                                        style={{
                                                            padding: '4px 10px', borderRadius: 'var(--radius-sm)',
                                                            border: '1px solid var(--border)', background: 'none',
                                                            cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-secondary)',
                                                        }}
                                                    >
                                                        {refreshingId === o.orderId ? '⏳' : '🔄'}
                                                    </button>
                                                    <Link
                                                        href={`/track?order=${o.orderNum}`}
                                                        style={{
                                                            padding: '4px 10px', borderRadius: 'var(--radius-sm)',
                                                            border: '1px solid var(--border)', background: 'none',
                                                            fontSize: '0.75rem', color: 'var(--text-secondary)',
                                                            textDecoration: 'none',
                                                        }}
                                                    >
                                                        👁
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                            }
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                        >← Prev</button>
                        <span style={{ padding: '6px 14px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                        >Next →</button>
                    </div>
                )}
            </div>
        </>
    );
}
