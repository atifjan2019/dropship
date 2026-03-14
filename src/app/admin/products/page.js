'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth } from '@/context/AdminAuthContext';
import Image from 'next/image';

export default function AdminProductsPage() {
    const { isAuthenticated, isLoading, adminFetch, logout } = useAdminAuth();
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all'); // all | active | inactive
    const [editingId, setEditingId] = useState(null);
    const [editPrice, setEditPrice] = useState('');
    const [actionMsg, setActionMsg] = useState('');

    useEffect(() => {
        if (!isLoading && !isAuthenticated) router.push('/admin');
    }, [isLoading, isAuthenticated, router]);

    const fetchProducts = useCallback(async (p = 1) => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: p, size: 20 });
            if (search) params.set('search', search);
            if (filter === 'active') params.set('active', 'true');
            if (filter === 'inactive') params.set('active', 'false');
            const res = await adminFetch(`/api/admin/products?${params}`);
            if (res.status === 401) { logout(); router.push('/admin'); return; }
            const data = await res.json();
            setProducts(data.data?.list || []);
            setTotal(data.data?.total || 0);
            setTotalPages(data.data?.totalPages || 1);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    }, [isAuthenticated, adminFetch, search, filter, logout, router]);

    useEffect(() => {
        fetchProducts(page);
    }, [page, filter, fetchProducts]);

    async function toggleActive(id, currentlyActive) {
        setActionMsg('');
        try {
            await adminFetch(`/api/admin/products/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ is_active: !currentlyActive }),
            });
            setActionMsg(`Product ${!currentlyActive ? 'activated' : 'deactivated'}`);
            fetchProducts(page);
        } catch {
            setActionMsg('Failed to update product');
        }
    }

    async function updatePrice(id) {
        setActionMsg('');
        const price = parseFloat(editPrice);
        if (isNaN(price) || price < 0) {
            setActionMsg('Invalid price');
            return;
        }
        try {
            await adminFetch(`/api/admin/products/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ sell_price: price }),
            });
            setActionMsg('Price updated');
            setEditingId(null);
            fetchProducts(page);
        } catch {
            setActionMsg('Failed to update price');
        }
    }

    async function deleteProduct(id) {
        if (!confirm('Are you sure? This cannot be undone.')) return;
        setActionMsg('');
        try {
            await adminFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
            setActionMsg('Product deleted');
            fetchProducts(page);
        } catch {
            setActionMsg('Failed to delete product');
        }
    }

    function handleSearch(e) {
        e.preventDefault();
        setPage(1);
        fetchProducts(1);
    }

    if (isLoading || !isAuthenticated) return null;

    return (
        <>
            <div className="admin-page-header">
                <h1>Product Management</h1>
                <p>Manage your product catalog</p>
            </div>

            <div className="admin-page-body">

                {/* Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {['all', 'active', 'inactive'].map(f => (
                            <button
                                key={f}
                                onClick={() => { setFilter(f); setPage(1); }}
                                style={{
                                    padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                                    fontWeight: 600, fontSize: '0.8rem', textTransform: 'capitalize',
                                    background: filter === f ? 'var(--accent)' : 'var(--bg-glass)',
                                    color: filter === f ? 'white' : 'var(--text-secondary)',
                                }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
                        <input
                            className="form-input"
                            placeholder="Search products..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ width: 200 }}
                        />
                        <button type="submit" className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.82rem' }}>Search</button>
                    </form>
                </div>

                {actionMsg && (
                    <div style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-glass)', border: '1px solid var(--border)', marginBottom: 16, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{actionMsg}</div>
                )}

                {/* Stats */}
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                    Showing {products.length} of {total} products
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                {['', 'Product', 'Category', 'Base Cost', 'Sell Price', 'Status', 'Variants', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '10px 10px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</td></tr>
                            ) : products.length === 0 ? (
                                <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No products found</td></tr>
                            ) : products.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '8px 10px', width: 50 }}>
                                        {p.imageUrl && (
                                            <img
                                                src={typeof p.imageUrl === 'string' && p.imageUrl.startsWith('[') ? JSON.parse(p.imageUrl)[0] : p.imageUrl}
                                                alt=""
                                                style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', background: 'var(--bg-glass)' }}
                                            />
                                        )}
                                    </td>
                                    <td style={{ padding: '8px 10px', fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {p.title}
                                    </td>
                                    <td style={{ padding: '8px 10px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{p.category || '—'}</td>
                                    <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>${Number(p.baseCost || 0).toFixed(2)}</td>
                                    <td style={{ padding: '8px 10px' }}>
                                        {editingId === p.id ? (
                                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                                <input
                                                    className="form-input"
                                                    type="number"
                                                    step="0.01"
                                                    value={editPrice}
                                                    onChange={e => setEditPrice(e.target.value)}
                                                    style={{ width: 80, padding: '4px 6px', fontSize: '0.8rem' }}
                                                />
                                                <button onClick={() => updatePrice(p.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>✅</button>
                                                <button onClick={() => setEditingId(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>❌</button>
                                            </div>
                                        ) : (
                                            <span
                                                onClick={() => { setEditingId(p.id); setEditPrice(p.sellPrice || ''); }}
                                                style={{ fontWeight: 600, color: 'var(--accent)', cursor: 'pointer' }}
                                                title="Click to edit"
                                            >
                                                ${Number(p.sellPrice || 0).toFixed(2)}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '8px 10px' }}>
                                        <span style={{
                                            display: 'inline-block', padding: '3px 10px', borderRadius: 12,
                                            background: p.isActive ? '#10b98118' : '#ef444418',
                                            color: p.isActive ? '#10b981' : '#ef4444',
                                            fontWeight: 600, fontSize: '0.72rem',
                                        }}>
                                            {p.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '8px 10px', color: 'var(--text-muted)', textAlign: 'center' }}>{p.variantCount}</td>
                                    <td style={{ padding: '8px 10px' }}>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button
                                                onClick={() => toggleActive(p.id, p.isActive)}
                                                title={p.isActive ? 'Deactivate' : 'Activate'}
                                                style={{
                                                    padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                                                    border: '1px solid var(--border)', background: 'none',
                                                    cursor: 'pointer', fontSize: '0.72rem', color: 'var(--text-secondary)',
                                                }}
                                            >
                                                {p.isActive ? '🚫' : '✅'}
                                            </button>
                                            <button
                                                onClick={() => deleteProduct(p.id)}
                                                title="Delete"
                                                style={{
                                                    padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                                                    border: '1px solid var(--border)', background: 'none',
                                                    cursor: 'pointer', fontSize: '0.72rem', color: '#ef4444',
                                                }}
                                            >
                                                🗑️
                                            </button>
                                        </div>
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
