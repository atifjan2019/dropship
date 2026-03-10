'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';

const US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY',
    'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND',
    'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export default function CheckoutPage() {
    const { items, subtotal, clearCart } = useCart();
    const router = useRouter();

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        // Validation
        const required = ['firstName', 'lastName', 'email', 'address', 'city', 'state', 'zip'];
        for (const field of required) {
            if (!form[field].trim()) {
                setError(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
                return;
            }
        }

        if (items.length === 0) {
            setError('Your cart is empty');
            return;
        }

        setSubmitting(true);
        try {
            const checkoutData = {
                customer: {
                    firstName: form.firstName,
                    lastName: form.lastName,
                    email: form.email,
                    phone: form.phone,
                    address: form.address,
                    city: form.city,
                    state: form.state,
                    zip: form.zip,
                },
                items: items.map(item => ({
                    vid: item.vid,
                    quantity: item.quantity,
                    productNameEn: item.productNameEn,
                    productImage: item.productImage,
                    sellPrice: item.sellPrice,
                    variantName: item.variantName || '',
                    dbProductId: item.dbProductId || null,
                    dbVariantId: item.dbVariantId || null,
                })),
            };

            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(checkoutData),
            });

            const data = await res.json();

            if (data.result || data.code === 200) {
                clearCart();
                router.push('/checkout/success');
            } else {
                setError(data.message || data.error || 'Failed to place order. Please try again.');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        }
        setSubmitting(false);
    }

    if (items.length === 0) {
        return (
            <div className="empty-state fade-in">
                <div className="empty-state-icon">🛒</div>
                <h2>Your cart is empty</h2>
                <p>Add some products before checking out.</p>
                <Link href="/products" className="btn btn-primary">Browse Products</Link>
            </div>
        );
    }

    return (
        <>
            <div className="page-header">
                <h1>Checkout</h1>
                <p>Complete your order</p>
            </div>

            <div className="checkout-layout fade-in">
                {/* Shipping Form */}
                <form className="checkout-form" onSubmit={handleSubmit}>
                    <div className="card">
                        <div className="card-title">📍 Shipping Address</div>

                        {error && (
                            <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠️ {error}</div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">First Name *</label>
                                    <input
                                        className="form-input"
                                        name="firstName"
                                        value={form.firstName}
                                        onChange={handleChange}
                                        placeholder="John"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Last Name *</label>
                                    <input
                                        className="form-input"
                                        name="lastName"
                                        value={form.lastName}
                                        onChange={handleChange}
                                        placeholder="Doe"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Email *</label>
                                    <input
                                        className="form-input"
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="john@example.com"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input
                                        className="form-input"
                                        name="phone"
                                        type="tel"
                                        value={form.phone}
                                        onChange={handleChange}
                                        placeholder="(555) 123-4567"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Street Address *</label>
                                <input
                                    className="form-input"
                                    name="address"
                                    value={form.address}
                                    onChange={handleChange}
                                    placeholder="123 Main St, Apt 4"
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">City *</label>
                                    <input
                                        className="form-input"
                                        name="city"
                                        value={form.city}
                                        onChange={handleChange}
                                        placeholder="Los Angeles"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">State *</label>
                                    <select
                                        className="form-select"
                                        name="state"
                                        value={form.state}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select State</option>
                                        {US_STATES.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">ZIP Code *</label>
                                    <input
                                        className="form-input"
                                        name="zip"
                                        value={form.zip}
                                        onChange={handleChange}
                                        placeholder="90001"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Country</label>
                                    <input
                                        className="form-input"
                                        value="United States 🇺🇸"
                                        disabled
                                        style={{ opacity: 0.6 }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg btn-full"
                        disabled={submitting}
                    >
                        {submitting ? 'Placing Order...' : `Place Order — $${subtotal.toFixed(2)}`}
                    </button>
                </form>

                {/* Order Summary */}
                <div className="cart-summary">
                    <div className="card">
                        <div className="card-title">Order Summary</div>
                        {items.map((item) => (
                            <div className="checkout-order-item" key={`${item.pid}-${item.vid}`}>
                                <div className="checkout-item-img">
                                    <img src={item.productImage || '/placeholder.png'} alt="" />
                                </div>
                                <span className="checkout-item-name">{item.productNameEn}</span>
                                <span className="checkout-item-qty">×{item.quantity}</span>
                                <span className="checkout-item-price">
                                    ${(Number(item.sellPrice || 0) * item.quantity).toFixed(2)}
                                </span>
                            </div>
                        ))}
                        <div className="summary-row total" style={{ marginTop: 16 }}>
                            <span className="label">Total</span>
                            <span className="value">${subtotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
