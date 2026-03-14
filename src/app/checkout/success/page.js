'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

export default function CheckoutSuccess() {
    const confettiRef = useRef(false);

    // Simple confetti burst on mount
    useEffect(() => {
        if (confettiRef.current) return;
        confettiRef.current = true;

        const el = document.querySelector('.success-icon');
        if (el) {
            el.classList.add('success-icon-pop');
        }
    }, []);

    return (
        <div className="success-page fade-in">
            <div className="success-icon">✓</div>
            <h1>Order Placed Successfully!</h1>
            <p className="success-subtitle">
                Thank you for your purchase. Your order has been submitted to our fulfilment
                partner and is being prepared for shipment.
            </p>

            <div className="success-info-grid">
                <div className="success-info-card">
                    <div className="success-info-icon">📦</div>
                    <div className="success-info-label">Processing Time</div>
                    <div className="success-info-value">1–3 business days</div>
                </div>
                <div className="success-info-card">
                    <div className="success-info-icon">🚚</div>
                    <div className="success-info-label">Estimated Delivery</div>
                    <div className="success-info-value">7–15 business days</div>
                </div>
                <div className="success-info-card">
                    <div className="success-info-icon">🇺🇸</div>
                    <div className="success-info-label">Shipping To</div>
                    <div className="success-info-value">United States</div>
                </div>
            </div>

            <div className="success-note">
                <strong>📧 Tracking Info:</strong> Once your order ships you will be able to
                track it using your order number in the <Link href="/track">Track Order</Link> page.
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 32 }}>
                <Link href="/orders" className="btn btn-primary btn-lg">
                    View My Orders
                </Link>
                <Link href="/products" className="btn btn-secondary btn-lg">
                    Continue Shopping
                </Link>
            </div>
        </div>
    );
}
