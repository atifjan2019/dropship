'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';

export default function ProductDetailPage() {
    const { id } = useParams();
    const { addItem } = useCart();

    const [product, setProduct] = useState(null);
    const [variants, setVariants] = useState([]);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [shipping, setShipping] = useState([]);
    const [shippingLoading, setShippingLoading] = useState(false);
    const [added, setAdded] = useState(false);
    const [mainImage, setMainImage] = useState('');

    useEffect(() => {
        fetchProduct();
    }, [id]);

    async function fetchProduct() {
        setLoading(true);
        try {
            const res = await fetch(`/api/products/${id}`);
            const data = await res.json();
            const prod = data.data || data;
            setProduct(prod);
            setMainImage(prod.productImage || '');

            const vars = data.variants || prod.variants || [];
            setVariants(vars);
            if (vars.length > 0) setSelectedVariant(vars[0]);
        } catch (err) {
            console.error('Failed to fetch product:', err);
        }
        setLoading(false);
    }

    async function fetchShipping() {
        if (!selectedVariant) return;
        setShippingLoading(true);
        try {
            const res = await fetch('/api/cj/freight', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    endCountryCode: 'US',
                    products: [{ quantity, vid: selectedVariant.vid }],
                }),
            });
            const data = await res.json();
            setShipping(data.data || []);
        } catch (err) {
            console.error('Failed to calc shipping:', err);
        }
        setShippingLoading(false);
    }

    useEffect(() => {
        if (selectedVariant) fetchShipping();
    }, [selectedVariant, quantity]);

    function handleAddToCart() {
        if (!product) return;
        addItem({
            pid: product.pid,
            vid: selectedVariant?.vid || null,
            productNameEn: product.productNameEn,
            productImage: mainImage,
            sellPrice: selectedVariant?.sellPrice || product.sellPrice,
            variantName: selectedVariant?.variantNameEn || '',
            quantity,
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    }

    if (loading) return <LoadingSpinner text="Loading product..." />;
    if (!product) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">😕</div>
                <h2>Product not found</h2>
                <p>This product may no longer be available.</p>
                <Link href="/products" className="btn btn-primary">Browse Products</Link>
            </div>
        );
    }

    return (
        <div className="product-detail fade-in">
            {/* Images */}
            <div className="product-images">
                <img src={mainImage || '/placeholder.png'} alt={product.productNameEn} />
            </div>

            {/* Info */}
            <div className="product-info">
                <div>
                    <Link href="/products" className="btn btn-ghost" style={{ marginBottom: 12, padding: '6px 0' }}>
                        ← Back to Products
                    </Link>
                    <h1>{product.productNameEn}</h1>
                </div>

                <div className="product-price-tag">
                    ${Number(selectedVariant?.sellPrice || product.sellPrice || 0).toFixed(2)}
                </div>

                <div className="product-meta">
                    <span className="product-meta-item">🇺🇸 Ships to USA</span>
                    {product.categoryName && (
                        <span className="product-meta-item">📂 {product.categoryName}</span>
                    )}
                </div>

                {/* Variants */}
                {variants.length > 0 && (
                    <div className="variant-section">
                        <span className="variant-label">Options</span>
                        <div className="variant-options">
                            {variants.map((v) => (
                                <button
                                    key={v.vid}
                                    className={`variant-btn ${selectedVariant?.vid === v.vid ? 'selected' : ''}`}
                                    onClick={() => {
                                        setSelectedVariant(v);
                                        if (v.variantImage) setMainImage(v.variantImage);
                                    }}
                                >
                                    {v.variantNameEn || v.variantName || `Option ${v.vid}`}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quantity */}
                <div className="variant-section">
                    <span className="variant-label">Quantity</span>
                    <div className="qty-selector">
                        <button className="qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                        <input
                            type="number"
                            className="qty-value"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            min="1"
                        />
                        <button className="qty-btn" onClick={() => setQuantity(q => q + 1)}>+</button>
                    </div>
                </div>

                {/* Add to Cart */}
                <button className="btn btn-primary btn-lg btn-full" onClick={handleAddToCart}>
                    {added ? '✓ Added to Cart!' : 'Add to Cart'}
                </button>

                {/* Shipping Estimate */}
                <div className="shipping-estimate">
                    <h4>🚚 Estimated Shipping to USA</h4>
                    {shippingLoading ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Calculating...</p>
                    ) : shipping.length > 0 ? (
                        shipping.slice(0, 4).map((opt, i) => (
                            <div className="shipping-option" key={i}>
                                <div>
                                    <div className="shipping-name">{opt.logisticName}</div>
                                    <div className="shipping-time">{opt.logisticAging || 'Est. 7-15 days'}</div>
                                </div>
                                <span className="shipping-price">
                                    ${Number(opt.logisticPrice || 0).toFixed(2)}
                                </span>
                            </div>
                        ))
                    ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            Select a variant to see shipping options
                        </p>
                    )}
                </div>

                {/* Description */}
                {product.description && (
                    <div className="variant-section">
                        <span className="variant-label">Description</span>
                        <div
                            className="product-description"
                            dangerouslySetInnerHTML={{ __html: product.description }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
