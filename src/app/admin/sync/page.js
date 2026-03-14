'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth } from '@/context/AdminAuthContext';

export default function AdminSyncPage() {
    const { isAuthenticated, isLoading, logout } = useAdminAuth();
    const router = useRouter();
    const [keyword, setKeyword] = useState('');
    const [pages, setPages] = useState(1);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState({});
    const [results, setResults] = useState({});

    useEffect(() => {
        if (!isLoading && !isAuthenticated) router.push('/admin');
    }, [isLoading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) fetchLogs();
    }, [isAuthenticated]);

    async function fetchLogs() {
        try {
            const res = await fetch('/api/sync/logs');
            const data = await res.json();
            setLogs(data.data || []);
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        }
    }

    async function runSync(type, body = {}) {
        setLoading(prev => ({ ...prev, [type]: true }));
        setResults(prev => ({ ...prev, [type]: null }));
        try {
            const res = await fetch(`/api/sync/${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            setResults(prev => ({ ...prev, [type]: data }));
            fetchLogs();
        } catch (err) {
            setResults(prev => ({ ...prev, [type]: { success: false, error: err.message } }));
        }
        setLoading(prev => ({ ...prev, [type]: false }));
    }

    if (isLoading || !isAuthenticated) return null;

    return (
        <>
            <div className="admin-page-header">
                <h1>Sync Dashboard</h1>
                <p>Manage CJ Dropshipping synchronization</p>
            </div>

            <div className="admin-page-body">

                {/* Product Import */}
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-title">📦 Import Products from CJ</div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
                        Search and import products from CJ Dropshipping into your database.
                    </p>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                        <input
                            className="form-input"
                            placeholder="Keyword (e.g. 'phone case')"
                            value={keyword}
                            onChange={e => setKeyword(e.target.value)}
                            style={{ flex: 1, minWidth: 200 }}
                        />
                        <select
                            className="form-select"
                            value={pages}
                            onChange={e => setPages(parseInt(e.target.value))}
                            style={{ width: 120 }}
                        >
                            {[1, 2, 3, 5, 10].map(n => (
                                <option key={n} value={n}>{n} page{n > 1 ? 's' : ''}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => runSync('products', { keyword, pages })}
                        disabled={loading.products}
                    >
                        {loading.products ? '⏳ Importing...' : '🚀 Import Products'}
                    </button>
                    {results.products && (
                        <div className={`alert ${results.products.success ? 'alert-success' : 'alert-error'}`}
                            style={{ marginTop: 12 }}>
                            {results.products.message || results.products.error}
                        </div>
                    )}
                </div>

                {/* Price & Stock Sync */}
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-title">💰 Sync Prices & Stock</div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
                        Update prices and stock levels for all products in your database.
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={() => runSync('prices')}
                        disabled={loading.prices}
                    >
                        {loading.prices ? '⏳ Syncing...' : '🔄 Sync Prices & Stock'}
                    </button>
                    {results.prices && (
                        <div className={`alert ${results.prices.success ? 'alert-success' : 'alert-error'}`}
                            style={{ marginTop: 12 }}>
                            {results.prices.message || results.prices.error}
                        </div>
                    )}
                </div>

                {/* Tracking Sync */}
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-title">🚚 Sync Tracking</div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
                        Pull tracking numbers and status updates for all open orders.
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={() => runSync('tracking')}
                        disabled={loading.tracking}
                    >
                        {loading.tracking ? '⏳ Syncing...' : '📡 Sync Tracking'}
                    </button>
                    {results.tracking && (
                        <div className={`alert ${results.tracking.success ? 'alert-success' : 'alert-error'}`}
                            style={{ marginTop: 12 }}>
                            {results.tracking.message || results.tracking.error}
                        </div>
                    )}
                </div>

                {/* Sync Logs */}
                <div className="card">
                    <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>📋 Recent Sync Logs</span>
                        <button className="btn btn-ghost" onClick={fetchLogs} style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
                            Refresh
                        </button>
                    </div>
                    {logs.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No sync logs yet. Run a sync to see results here.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {logs.map(log => (
                                <div key={log.id} style={{
                                    padding: '12px 16px',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'var(--bg-glass)',
                                    border: '1px solid var(--border)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: 8,
                                }}>
                                    <div>
                                        <span style={{
                                            fontWeight: 600,
                                            textTransform: 'capitalize',
                                            fontSize: '0.9rem',
                                        }}>
                                            {(log.type || '').replace(/_/g, ' ')}
                                        </span>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: 8 }}>
                                            {log.products_synced != null ? `${log.products_synced} synced` : ''}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span className={`order-status ${log.status === 'completed' ? 'completed' : log.status === 'failed' ? 'closed' : 'processing'}`}>
                                            {log.status}
                                        </span>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                            {log.started_at ? new Date(log.started_at).toLocaleString() : ''}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
