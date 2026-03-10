'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useState } from 'react';

export default function Header() {
    const { totalItems } = useCart();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="header">
            {/* Top utility bar */}
            <div className="header-topbar">
                <div className="header-topbar-inner">
                    <div className="header-topbar-links">
                        <Link href="/">Home</Link>
                        <Link href="/orders">Track Order</Link>
                    </div>
                    <div className="header-topbar-links">
                        <Link href="/checkout">Checkout</Link>
                        <Link href="/admin/sync">Admin</Link>
                    </div>
                </div>
            </div>

            {/* Main header bar */}
            <div className="header-main">
                <div className="header-inner">
                    <Link href="/" className="logo">
                        <span className="logo-icon">◆</span>
                        <span className="logo-text">Velora</span>
                    </Link>

                    <div className="header-search">
                        <input type="text" placeholder="Search in..." readOnly />
                        <button aria-label="Search">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </button>
                    </div>

                    <div className="header-actions">
                        <Link href="/cart" className="header-action-btn" aria-label="Cart">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                            </svg>
                            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
                        </Link>

                        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
                            <span className={`hamburger ${menuOpen ? 'open' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation bar */}
            <div className="header-nav">
                <div className="header-nav-inner">
                    <nav className={`nav ${menuOpen ? 'nav-open' : ''}`}>
                        <Link href="/" className="nav-link" onClick={() => setMenuOpen(false)}>Home</Link>
                        <Link href="/products" className="nav-link" onClick={() => setMenuOpen(false)}>Shop</Link>
                        <Link href="/orders" className="nav-link" onClick={() => setMenuOpen(false)}>Orders</Link>
                        <Link href="/admin/sync" className="nav-link" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                    </nav>
                    <span className="nav-phone">
                        📞 Support: +1 (800) 555-0199
                    </span>
                </div>
            </div>

            {menuOpen && <div className="nav-overlay" onClick={() => setMenuOpen(false)} />}
        </header>
    );
}
