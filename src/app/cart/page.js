'use client';

import { useCart } from '@/context/CartContext';
import Link from 'next/link';

export default function CartPage() {
    const { items, removeItem, updateQuantity, subtotal, totalItems } = useCart();

    if (items.length === 0) {
        return (
            <div className="empty-state fade-in">
                <div className="empty-state-icon">🛒</div>
                <h2>Your cart is empty</h2>
                <p>Browse our products and add something you love!</p>
                <Link href="/products" className="btn btn-primary">Browse Products</Link>
            </div>
        );
    }

    return (
        <>
            <div className="page-header">
                <h1>Shopping Cart</h1>
                <p>{totalItems} item{totalItems !== 1 ? 's' : ''} in your cart</p>
            </div>

            <div className="cart-layout fade-in">
                {/* Cart Items */}
                <div className="cart-items-list">
                    {items.map((item) => {
                        const key = `${item.pid}-${item.vid || 'default'}`;
                        const price = Number(item.sellPrice || 0);
                        return (
                            <div className="cart-item" key={key}>
                                <div className="cart-item-img">
                                    <img src={item.productImage || '/placeholder.png'} alt={item.productNameEn} />
                                </div>
                                <div className="cart-item-info">
                                    <div className="cart-item-title">{item.productNameEn}</div>
                                    {item.variantName && (
                                        <div className="cart-item-variant">{item.variantName}</div>
                                    )}
                                    <div className="cart-item-bottom">
                                        <div className="qty-selector">
                                            <button
                                                className="qty-btn"
                                                onClick={() => updateQuantity(item.pid, item.vid, item.quantity - 1)}
                                                disabled={item.quantity <= 1}
                                            >
                                                −
                                            </button>
                                            <input
                                                type="number"
                                                className="qty-value"
                                                value={item.quantity}
                                                onChange={(e) => updateQuantity(item.pid, item.vid, parseInt(e.target.value) || 1)}
                                                min="1"
                                            />
                                            <button
                                                className="qty-btn"
                                                onClick={() => updateQuantity(item.pid, item.vid, item.quantity + 1)}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <span className="cart-item-price">${(price * item.quantity).toFixed(2)}</span>
                                            <button
                                                className="cart-remove"
                                                onClick={() => removeItem(item.pid, item.vid)}
                                            >
                                                ✕ Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Summary */}
                <div className="cart-summary">
                    <div className="card">
                        <div className="card-title">Order Summary</div>
                        <div className="summary-row">
                            <span className="label">Subtotal</span>
                            <span className="value">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="summary-row">
                            <span className="label">Shipping</span>
                            <span className="value" style={{ color: 'var(--text-muted)' }}>Calculated at checkout</span>
                        </div>
                        <div className="summary-row total">
                            <span className="label">Estimated Total</span>
                            <span className="value">${subtotal.toFixed(2)}</span>
                        </div>
                        <Link href="/checkout" className="btn btn-primary btn-full" style={{ marginTop: 20 }}>
                            Proceed to Checkout
                        </Link>
                        <Link href="/products" className="btn btn-ghost btn-full" style={{ marginTop: 8 }}>
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
