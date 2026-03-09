'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useState } from 'react';

export default function Header() {
    const { totalItems } = useCart();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="header">
            <div className="header-inner">
                <Link href="/" className="logo">
                    <span className="logo-icon">◆</span>
                    <span className="logo-text">VELORA</span>
                </Link>

                <nav className={`nav ${menuOpen ? 'nav-open' : ''}`}>
                    <Link href="/" className="nav-link" onClick={() => setMenuOpen(false)}>Home</Link>
                    <Link href="/products" className="nav-link" onClick={() => setMenuOpen(false)}>Products</Link>
                    <Link href="/orders" className="nav-link" onClick={() => setMenuOpen(false)}>Orders</Link>
                </nav>

                <div className="header-actions">
                    <Link href="/cart" className="cart-btn" aria-label="Cart">
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

            {menuOpen && <div className="nav-overlay" onClick={() => setMenuOpen(false)} />}
        </header>
    );
}
