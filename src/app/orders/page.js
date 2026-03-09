'use client';

import { useState, useEffect } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    async function fetchOrders() {
        setLoading(true);
        try {
            const res = await fetch('/api/cj/orders?size=50');
            const data = await res.json();
            setOrders(data.data?.list || data.data || []);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        }
        setLoading(false);
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

    if (loading) return <LoadingSpinner text="Loading orders..." />;

    return (
        <>
            <div className="page-header">
                <h1>Your Orders</h1>
                <p>Track and manage your orders</p>
            </div>

            {orders.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <h2>No orders yet</h2>
                    <p>When you place an order, it will appear here with tracking information.</p>
                    <Link href="/products" className="btn btn-primary">Start Shopping</Link>
                </div>
            ) : (
                <div className="orders-list fade-in">
                    {orders.map((order) => (
                        <div className="order-card" key={order.orderId || order.orderNum}>
                            <div className="order-header">
                                <div>
                                    <div className="order-id">Order #{order.orderNum || order.orderId}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                        {order.createDate ? new Date(order.createDate).toLocaleDateString('en-US', {
                                            year: 'numeric', month: 'long', day: 'numeric'
                                        }) : ''}
                                    </div>
                                </div>
                                <span className={`order-status ${getStatusClass(order.orderStatus)}`}>
                                    {order.orderStatus || 'Pending'}
                                </span>
                            </div>

                            {order.productList && order.productList.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {order.productList.map((p, i) => (
                                        <div className="checkout-order-item" key={i}>
                                            {p.productImage && (
                                                <div className="checkout-item-img">
                                                    <img src={p.productImage} alt="" />
                                                </div>
                                            )}
                                            <span className="checkout-item-name">{p.productNameEn || 'Product'}</span>
                                            <span className="checkout-item-qty">×{p.quantity || 1}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {order.trackNumber && (
                                <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-glass)', border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Tracking Number</div>
                                    <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{order.trackNumber}</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
