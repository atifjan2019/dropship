'use client';

import { useState, useEffect } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [searchEmail, setSearchEmail] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    async function fetchOrders(filterEmail = '') {
        setLoading(true);
        try {
            const params = new URLSearchParams({ size: '50' });
            if (filterEmail) params.set('email', filterEmail);
            const res = await fetch(`/api/orders?${params.toString()}`);
            const data = await res.json();
            setOrders(data.data?.list || data.data || []);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        }
        setLoading(false);
    }

    function handleSearch(e) {
        e.preventDefault();
        setSearchEmail(email);
        fetchOrders(email);
    }

    function getStatusClass(status) {
        const s = (status || '').toLowerCase();
        if (s.includes('pend')) return 'pending';
        if (s.includes('process')) return 'processing';
        if (s.includes('dispatch') || s.includes('ship')) return 'dispatched';
        if (s.includes('complet') || s.includes('deliver')) return 'completed';
        if (s.includes('close') || s.includes('cancel')) return 'closed';
        return 'pending';
    }

    function getStatusLabel(status) {
        const s = (status || '').toLowerCase();
        if (s.includes('ship'))  return '🚚 Shipped';
        if (s.includes('deliver') || s.includes('complet')) return '✅ Delivered';
        if (s.includes('process')) return '⚙️ Processing';
        if (s.includes('cancel') || s.includes('close')) return '❌ Cancelled';
        if (s.includes('cj_submission_failed')) return '⚠️ CJ Submission Failed';
        return '⏳ Pending';
    }

    if (loading) return <LoadingSpinner text="Loading orders..." />;

    return (
        <>
            <div className="page-header">
                <h1>Your Orders</h1>
                <p>Track and manage your orders</p>
            </div>

            {/* Email filter */}
            <div className="section" style={{ paddingBottom: 0, paddingTop: 0 }}>
                <div style={{ maxWidth: 700, margin: '0 auto' }}>
                    <form
                        onSubmit={handleSearch}
                        style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}
                    >
                        <input
                            className="form-input"
                            type="email"
                            placeholder="Enter your email to find your orders"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            style={{ flex: 1, minWidth: 220 }}
                            id="orders-email-filter"
                        />
                        <button type="submit" className="btn btn-primary">
                            Find Orders
                        </button>
                        {searchEmail && (
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => { setEmail(''); setSearchEmail(''); fetchOrders(); }}
                            >
                                Clear
                            </button>
                        )}
                    </form>
                </div>
            </div>

            {orders.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <h2>{searchEmail ? `No orders found for ${searchEmail}` : 'No orders yet'}</h2>
                    <p>When you place an order, it will appear here with tracking information.</p>
                    <Link href="/products" className="btn btn-primary">Start Shopping</Link>
                </div>
            ) : (
                <div className="orders-list fade-in">
                    {orders.map((order) => (
                        <div className="order-card" key={order.orderId}>
                            <div className="order-header">
                                <div>
                                    <div className="order-id">Order #{order.orderNum}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                        {order.createDate
                                            ? new Date(order.createDate).toLocaleDateString('en-US', {
                                                year: 'numeric', month: 'long', day: 'numeric',
                                            })
                                            : ''}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span className={`order-status ${getStatusClass(order.orderStatus)}`}>
                                        {getStatusLabel(order.orderStatus)}
                                    </span>
                                    {order.total > 0 && (
                                        <span style={{ fontWeight: 700, color: 'var(--accent)' }}>
                                            ${Number(order.total).toFixed(2)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Order items */}
                            {order.productList && order.productList.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                                    {order.productList.map((p, i) => (
                                        <div className="checkout-order-item" key={i}>
                                            {p.productImage && (
                                                <div className="checkout-item-img">
                                                    <img src={p.productImage} alt="" />
                                                </div>
                                            )}
                                            <span className="checkout-item-name">
                                                {p.productNameEn || 'Product'}
                                                {p.variantName && (
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>
                                                        {p.variantName}
                                                    </span>
                                                )}
                                            </span>
                                            <span className="checkout-item-qty">×{p.quantity || 1}</span>
                                            {p.unitPrice > 0 && (
                                                <span className="checkout-item-price">
                                                    ${(Number(p.unitPrice) * (p.quantity || 1)).toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Tracking number */}
                            {order.trackNumber && (
                                <div style={{
                                    marginTop: 16, padding: '12px 16px', borderRadius: 'var(--radius-md)',
                                    background: 'var(--bg-glass)', border: '1px solid var(--border)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
                                }}>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 2 }}>
                                            🚚 Tracking Number
                                        </div>
                                        <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                                            {order.trackNumber}
                                        </div>
                                    </div>
                                    <Link href="/track" className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
                                        Track Package →
                                    </Link>
                                </div>
                            )}

                            {/* CJ Submission Error - help admin debug */}
                            {order.cjError && order.orderStatus?.includes('failed') && (
                                <div style={{
                                    marginTop: 10, padding: '10px 14px',
                                    background: 'var(--error-bg)',
                                    border: '1px solid rgba(220, 38, 38, 0.2)',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '0.8rem',
                                    color: 'var(--error)',
                                }}>
                                    <strong>⚠️ CJ Error:</strong> {order.cjError}
                                </div>
                            )}

                            {/* CJ order reference */}
                            {order.cjOrderId && (
                                <div style={{
                                    marginTop: 10, fontSize: '0.75rem', color: 'var(--text-muted)',
                                }}>
                                    ✅ CJ Order: {order.cjOrderId}
                                </div>
                            )}
                        </div>

                    ))}
                </div>
            )}
        </>
    );
}
