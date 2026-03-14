'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useState } from 'react';

export default function ProductCard({ product }) {
    const { pid, productNameEn, productImage, sellPrice, variants } = product;
    const { addItem } = useCart();
    const [added, setAdded] = useState(false);

    const imgSrc = productImage || '/placeholder.png';
    const price = sellPrice ? `$${Number(sellPrice).toFixed(2)}` : 'N/A';

    function handleQuickAdd(e) {
        e.preventDefault();
        e.stopPropagation();
        // Use first variant if available, otherwise add as simple product
        const firstVariant = variants?.[0];
        addItem({
            pid,
            vid: firstVariant?.vid || null,
            productNameEn,
            productImage: imgSrc,
            sellPrice: firstVariant?.sellPrice || sellPrice,
            variantName: firstVariant?.variantNameEn || '',
            quantity: 1,
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    }

    return (
        <Link href={`/products/${pid}`} className="product-card" id={`product-${pid}`}>
            <div className="product-card-img-wrap">
                <img
                    src={imgSrc}
                    alt={productNameEn || 'Product'}
                    className="product-card-img"
                    loading="lazy"
                />
                {/* Hover overlay — click ADD TO CART without navigating */}
                <div className="product-card-hover">
                    <button
                        className={`product-card-cart-btn ${added ? 'added' : ''}`}
                        onClick={handleQuickAdd}
                        aria-label="Add to cart"
                    >
                        {added ? (
                            <>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                ADDED!
                            </>
                        ) : (
                            <>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                </svg>
                                ADD TO CART
                            </>
                        )}
                    </button>
                </div>
            </div>
            <div className="product-card-body">
                <h3 className="product-card-title">{productNameEn || 'Unnamed Product'}</h3>
                <div className="product-card-footer">
                    <span className="product-card-price">{price}</span>
                    <span className="product-card-action">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                        </svg>
                    </span>
                </div>
            </div>
        </Link>
    );
}
