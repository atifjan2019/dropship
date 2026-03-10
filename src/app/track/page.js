'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function TrackOrderPage() {
    const [orderId, setOrderId] = useState('');
    const [email, setEmail] = useState('');
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);

    async function handleTrack(e) {
        e.preventDefault();
        setError('');
        setOrder(null);
        setSearched(true);

        if (!orderId.trim() && !email.trim()) {
            setError('Please enter an order number or email address.');
            return;
        }

        setLoading(true);
        try {
            let url = '/api/orders';
            if (orderId.trim()) {
                url = `/api/orders/${encodeURIComponent(orderId.trim())}`;
            } else if (email.trim()) {
                url = `/api/orders?email=${encodeURIComponent(email.trim())}&size=1`;
            }

            const res = await fetch(url);
            const data = await res.json();

            if (orderId.trim()) {
                setOrder(data.data || null);
            } else {
                const list = data.data?.list || data.data || [];
                setOrder(list.length > 0 ? list[0] : null);
            }
        } catch (err) {
            setError('Failed to look up order. Please try again.');
        }
        setLoading(false);
    }

    const statusSteps = ['pending', 'processing', 'shipped', 'delivered'];

    function getStatusIndex(status) {
        const s = (status || '').toLowerCase();
        if (s.includes('deliver') || s.includes('complet')) return 3;
        if (s.includes('ship') || s.includes('dispatch')) return 2;
        if (s.includes('process')) return 1;
        return 0;
    }

    return (
        <>
            <div className="page-header">
                <h1>Track Your Order</h1>
                <p>Enter your order number or email to check the status</p>
            </div>

            <div className="section">
                <div style={{ maxWidth: 700, margin: '0 auto' }}>
                    {/* Search Form */}
                    <div className="card" style={{ marginBottom: 32 }}>
                        <form onSubmit={handleTrack} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Order Number</label>
                                    <input
                                        className="form-input"
                                        value={orderId}
                                        onChange={(e) => setOrderId(e.target.value)}
                                        placeholder="e.g. VLR-1234567890"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email Address</label>
                                    <input
                                        className="form-input"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@email.com"
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                                {loading ? 'Looking up...' : 'Track Order'}
                            </button>
                        </form>
                    </div>

                    {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>⚠️ {error}</div>}

                    {/* Order Result */}
                    {order && (
                        <div className="card fade-in" style={{ marginBottom: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                        Order #{order.order_number || order.id?.slice(0, 8)}
                                    </div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
                                        {order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                                    </div>
                                </div>
                                <span className={`order-status ${(order.status || 'pending').toLowerCase()}`}>
                                    {order.status || 'Pending'}
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div style={{ marginBottom: 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', padding: '0 8px' }}>
                                    {/* Track line */}
                                    <div style={{
                                        position: 'absolute', top: 14, left: 24, right: 24, height: 3,
                                        background: 'var(--border)', borderRadius: 2, zIndex: 0,
                                    }} />
                                    <div style={{
                                        position: 'absolute', top: 14, left: 24, height: 3,
                                        background: 'var(--accent)', borderRadius: 2, zIndex: 1,
                                        width: `${(getStatusIndex(order.status) / 3) * (100 - 8)}%`,
                                        transition: 'width 0.5s ease',
                                    }} />

                                    {statusSteps.map((step, i) => {
                                        const active = i <= getStatusIndex(order.status);
                                        return (
                                            <div key={step} style={{ textAlign: 'center', zIndex: 2, flex: 1 }}>
                                                <div style={{
                                                    width: 30, height: 30, borderRadius: '50%',
                                                    background: active ? 'var(--accent)' : 'var(--bg-tertiary)',
                                                    border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                                                    color: active ? 'white' : 'var(--text-muted)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    margin: '0 auto 8px', fontSize: '0.75rem', fontWeight: 700,
                                                }}>
                                                    {active ? '✓' : i + 1}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.75rem', fontWeight: 500,
                                                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                                                    textTransform: 'capitalize',
                                                }}>
                                                    {step}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Tracking Number */}
                            {order.tracking_number && (
                                <div style={{
                                    padding: '14px 18px', background: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                                }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Tracking Number</div>
                                    <div style={{ fontWeight: 600, fontSize: '0.95rem', fontFamily: 'monospace' }}>
                                        {order.tracking_number}
                                    </div>
                                </div>
                            )}

                            {/* Order Total */}
                            {order.total_amount && (
                                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Order Total</span>
                                    <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)' }}>${Number(order.total_amount).toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {searched && !loading && !order && !error && (
                        <div className="card" style={{ textAlign: 'center', padding: '36px 24px' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>No Order Found</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                We couldn't find an order with that information. Double-check your order number or email.
                            </p>
                        </div>
                    )}

                    {/* Help */}
                    <div style={{ textAlign: 'center', marginTop: 32, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Need help? <Link href="/contact" style={{ color: 'var(--accent)', fontWeight: 500 }}>Contact our support team</Link>
                    </div>
                </div>
            </div>
        </>
    );
}
