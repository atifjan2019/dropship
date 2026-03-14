'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';

/* ─── Status helpers ──────────────────────────────────────────── */
const STATUS_META = {
    pending:               { label: 'Pending',            emoji: '⏳', color: '#f59e0b', step: 0 },
    processing:            { label: 'Processing',         emoji: '⚙️', color: '#3b82f6', step: 1 },
    shipped:               { label: 'Shipped',            emoji: '🚚', color: '#8b5cf6', step: 2 },
    delivered:             { label: 'Delivered',          emoji: '✅', color: '#10b981', step: 3 },
    cancelled:             { label: 'Cancelled',          emoji: '❌', color: '#ef4444', step: -1 },
    cj_submission_failed:  { label: 'Submission Failed',  emoji: '⚠️', color: '#ef4444', step: -1 },
};

function getMeta(status) {
    return STATUS_META[(status || '').toLowerCase()] || STATUS_META.pending;
}

const STEPS = ['pending', 'processing', 'shipped', 'delivered'];

export default function TrackOrderPage() {
    const [orderId, setOrderId]   = useState('');
    const [email, setEmail]       = useState('');
    const [order, setOrder]       = useState(null);
    const [loading, setLoading]   = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError]       = useState('');
    const [searched, setSearched] = useState(false);
    const [refreshMsg, setRefreshMsg] = useState('');
    const [refreshOk, setRefreshOk]     = useState(true);  // true=success, false=error

    /* ── Fetch order from Supabase via our API ── */
    const handleTrack = useCallback(async (e) => {
        if (e) e.preventDefault();
        setError('');
        setOrder(null);
        setSearched(true);
        setRefreshMsg('');

        if (!orderId.trim() && !email.trim()) {
            setError('Please enter an order number or email address.');
            return;
        }

        setLoading(true);
        try {
            // Try the public tracking endpoint first (uses order_number)
            if (orderId.trim()) {
                const emailQ = email.trim() ? `?email=${encodeURIComponent(email.trim())}` : '';
                const res = await fetch(`/api/tracking/${encodeURIComponent(orderId.trim())}${emailQ}`);
                const data = await res.json();
                if (res.ok && data.result) {
                    setOrder(data.data);
                } else {
                    setError(data.error || 'Order not found.');
                }
            } else if (email.trim()) {
                // Email-only search — get most recent order
                const res = await fetch(`/api/orders?email=${encodeURIComponent(email.trim())}&size=1`);
                const data = await res.json();
                const first = data?.data?.list?.[0];
                if (first) {
                    // Normalize to tracking-endpoint shape
                    setOrder({
                        orderNumber:     first.orderNum,
                        status:          first.orderStatus,
                        trackingNumber:  first.trackNumber,
                        courier:         first.cjLogistic,
                        trackingUrl:     null,
                        shippingName:    first.shippingName || '',
                        total:           first.total,
                        createdAt:       first.createDate,
                        lastUpdated:     null,
                        _orderId:        first.orderId,   // for refresh
                    });
                } else {
                    setError('No orders found for that email.');
                }
            }
        } catch (err) {
            setError('Failed to look up order. Please try again.');
        }
        setLoading(false);
    }, [orderId, email]);

    /* ── On-demand live refresh — re-fetches from /api/tracking ── */
    const handleRefresh = useCallback(async () => {
        const num = order?.orderNumber;
        if (!num) return;
        setRefreshing(true);
        setRefreshMsg('');
        setRefreshOk(true);
        try {
            const emailQ = email.trim() ? `?email=${encodeURIComponent(email.trim())}` : '';
            const res  = await fetch(`/api/tracking/${encodeURIComponent(num)}${emailQ}`);
            const data = await res.json();

            if (res.ok && data.result) {
                setOrder(data.data);
                setRefreshOk(true);
                setRefreshMsg('✓ Status refreshed!');
            } else {
                setRefreshOk(false);
                setRefreshMsg('⚠️ ' + (data.error || 'Could not refresh. Try again.'));
            }
        } catch {
            setRefreshOk(false);
            setRefreshMsg('⚠️ Network error — please try again.');
        }
        setRefreshing(false);
    }, [order, email]);

    const meta = getMeta(order?.status);

    const statusStep = meta.step;

    return (
        <>
            <div className="page-header">
                <h1>Track Your Order</h1>
                <p>Enter your order number or email to see real-time shipping status</p>
            </div>

            <div className="section">
                <div style={{ maxWidth: 720, margin: '0 auto' }}>

                    {/* ── Search Form ── */}
                    <div className="card" style={{ marginBottom: 28 }}>
                        <form onSubmit={handleTrack} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Order Number</label>
                                    <input
                                        className="form-input"
                                        id="track-order-number"
                                        value={orderId}
                                        onChange={(e) => setOrderId(e.target.value)}
                                        placeholder="e.g. VLR-1234567890"
                                        autoComplete="off"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email Address</label>
                                    <input
                                        className="form-input"
                                        id="track-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@email.com"
                                    />
                                </div>
                            </div>
                            <button id="track-submit-btn" type="submit" className="btn btn-primary btn-full" disabled={loading}>
                                {loading ? '⏳ Looking up...' : '🔍 Track Order'}
                            </button>
                        </form>
                    </div>

                    {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>⚠️ {error}</div>}

                    {/* ── Order Result ── */}
                    {order && (
                        <div className="card fade-in" style={{ marginBottom: 24 }}>

                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                        Order #{order.orderNumber}
                                    </div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 4 }}>
                                        Placed {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                        padding: '5px 14px', borderRadius: 20,
                                        background: meta.color + '18',
                                        color: meta.color,
                                        fontWeight: 600, fontSize: '0.82rem', letterSpacing: '0.5px',
                                    }}>
                                        {meta.emoji} {meta.label}
                                    </span>
                                    <button
                                        id="track-refresh-btn"
                                        onClick={handleRefresh}
                                        disabled={refreshing}
                                        style={{
                                            background: 'none', border: '1px solid var(--border)',
                                            borderRadius: 'var(--radius-sm)', padding: '4px 12px',
                                            fontSize: '0.78rem', color: 'var(--text-secondary)',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                                        }}
                                    >
                                        {refreshing ? '⏳ Refreshing...' : '🔄 Refresh'}
                                    </button>
                                </div>
                            </div>

                            {refreshMsg && (
                                <div style={{
                                    padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 16,
                                    background: refreshOk ? '#10b98112' : '#f59e0b12',
                                    border: `1px solid ${refreshOk ? '#10b98140' : '#f59e0b40'}`,
                                    fontSize: '0.82rem',
                                    color: refreshOk ? '#10b981' : '#d97706',
                                }}>
                                    {refreshMsg}
                                </div>
                            )}

                            {/* Progress Stepper */}
                            {statusStep >= 0 && (
                                <div style={{ marginBottom: 28 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', padding: '0 8px' }}>
                                        {/* Track line background */}
                                        <div style={{
                                            position: 'absolute', top: 14, left: 24, right: 24, height: 3,
                                            background: 'var(--border)', borderRadius: 2, zIndex: 0,
                                        }} />
                                        {/* Track line fill */}
                                        <div style={{
                                            position: 'absolute', top: 14, left: 24, height: 3,
                                            background: `linear-gradient(90deg, var(--accent), ${meta.color})`,
                                            borderRadius: 2, zIndex: 1,
                                            width: `${(statusStep / 3) * (100 - 8)}%`,
                                            transition: 'width 0.6s ease',
                                        }} />
                                        {STEPS.map((step, i) => {
                                            const active = i <= statusStep;
                                            const current = i === statusStep;
                                            return (
                                                <div key={step} style={{ textAlign: 'center', zIndex: 2, flex: 1 }}>
                                                    <div style={{
                                                        width: 30, height: 30, borderRadius: '50%',
                                                        background: active ? (current ? meta.color : 'var(--accent)') : 'var(--bg-tertiary)',
                                                        border: `2px solid ${active ? (current ? meta.color : 'var(--accent)') : 'var(--border)'}`,
                                                        color: active ? 'white' : 'var(--text-muted)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        margin: '0 auto 8px', fontSize: '0.75rem', fontWeight: 700,
                                                        boxShadow: current ? `0 0 0 4px ${meta.color}30` : 'none',
                                                        transition: 'all 0.3s ease',
                                                    }}>
                                                        {active ? '✓' : i + 1}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '0.72rem', fontWeight: current ? 700 : 500,
                                                        color: active ? (current ? meta.color : 'var(--accent)') : 'var(--text-muted)',
                                                        textTransform: 'capitalize',
                                                    }}>
                                                        {step}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Tracking Number & Courier */}
                            {order.trackingNumber ? (
                                <div style={{
                                    padding: '16px 18px', background: 'var(--bg-glass)',
                                    borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                                    marginBottom: 16,
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                                        <div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                                                📦 {order.courier ? `Via ${order.courier}` : 'Tracking Number'}
                                            </div>
                                            <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                                                {order.trackingNumber}
                                            </div>
                                        </div>
                                        {order.trackingUrl && (
                                            <a
                                                id="track-carrier-link"
                                                href={order.trackingUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-primary"
                                                style={{ padding: '8px 18px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                                            >
                                                Track on Carrier →
                                            </a>
                                        )}
                                    </div>
                                    {/* Fallback 17track link always */}
                                    <div style={{ marginTop: 10, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        Also track on:{' '}
                                        <a
                                            href={`https://t.17track.net/en#nums=${encodeURIComponent(order.trackingNumber)}`}
                                            target="_blank" rel="noopener noreferrer"
                                            style={{ color: 'var(--accent)', fontWeight: 500 }}
                                        >
                                            17track.net
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div style={{
                                    padding: '14px 18px', background: 'var(--bg-glass)',
                                    borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                                    marginBottom: 16, fontSize: '0.88rem', color: 'var(--text-muted)',
                                }}>
                                    🕐 Tracking number will appear once your order ships (usually 2–5 business days after placement).
                                </div>
                            )}

                            {/* Order details row */}
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
                                {order.shippingLocation && (
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                        📍 Shipping to: <strong>{order.shippingLocation}</strong>
                                    </div>
                                )}
                                {order.lastUpdated && (
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        Last checked: {new Date(order.lastUpdated).toLocaleString()}
                                    </div>
                                )}
                            </div>

                            {/* Total */}
                            {order.total > 0 && (
                                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Order Total</span>
                                    <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--accent)' }}>
                                        ${Number(order.total).toFixed(2)}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {searched && !loading && !order && !error && (
                        <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>No Order Found</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                We couldn't find an order matching that information. Double-check your order number or email.
                            </p>
                        </div>
                    )}

                    <div style={{ textAlign: 'center', marginTop: 32, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Need help?{' '}
                        <Link href="/contact" style={{ color: 'var(--accent)', fontWeight: 500 }}>
                            Contact our support team
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
