'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProductCard from '@/components/ProductCard';
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
    const [activeTab, setActiveTab] = useState('description');
    const [relatedProducts, setRelatedProducts] = useState([]);

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

            // Fetch related products
            fetchRelated();
        } catch (err) {
            console.error('Failed to fetch product:', err);
        }
        setLoading(false);
    }

    async function fetchRelated() {
        try {
            const res = await fetch(`/api/products?size=5`);
            const data = await res.json();
            setRelatedProducts(data.data?.list || data.data || []);
        } catch (err) {
            console.error('Failed to fetch related:', err);
        }
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

    // Collect all images (main + variant images)
    function getAllImages() {
        const imgs = [];
        if (product?.productImage) imgs.push(product.productImage);
        variants.forEach(v => {
            if (v.variantImage && !imgs.includes(v.variantImage)) {
                imgs.push(v.variantImage);
            }
        });
        return imgs;
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

    const allImages = getAllImages();
    const price = Number(selectedVariant?.sellPrice || product.sellPrice || 0).toFixed(2);

    return (
        <div className="fade-in">
            {/* Breadcrumbs */}
            <div className="pdp-breadcrumbs">
                <div className="pdp-breadcrumbs-inner">
                    <Link href="/">Home</Link>
                    <span className="pdp-breadcrumb-sep">/</span>
                    <Link href="/products">Shop</Link>
                    <span className="pdp-breadcrumb-sep">/</span>
                    <span className="pdp-breadcrumb-current">{product.productNameEn}</span>
                </div>
            </div>

            {/* Product Detail Grid */}
            <div className="product-detail">
                {/* Left: Image Gallery */}
                <div>
                    <div className="product-images">
                        <img src={mainImage || '/placeholder.png'} alt={product.productNameEn} />
                    </div>

                    {/* Thumbnails */}
                    {allImages.length > 1 && (
                        <div className="pdp-thumbnails">
                            {allImages.map((img, i) => (
                                <button
                                    key={i}
                                    className={`pdp-thumb ${mainImage === img ? 'active' : ''}`}
                                    onClick={() => setMainImage(img)}
                                >
                                    <img src={img} alt={`View ${i + 1}`} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Product Info */}
                <div className="product-info">
                    <h1>{product.productNameEn}</h1>

                    <div className="product-price-tag">${price}</div>

                    {/* Short meta */}
                    <div className="product-meta">
                        <span className="product-meta-item">🇺🇸 Ships to USA</span>
                        {product.categoryName && (
                            <span className="product-meta-item">📂 {product.categoryName.split('>').pop().trim()}</span>
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

                    {/* Quantity + Add to Cart Row */}
                    <div className="pdp-add-row">
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
                        <button className="btn btn-primary btn-lg" onClick={handleAddToCart} style={{ flex: 1 }}>
                            {added ? '✓ ADDED!' : 'ADD TO CART'}
                        </button>
                    </div>

                    {/* SKU / Category / Tags — Ebbe style */}
                    <div className="pdp-meta-list">
                        {product.pid && (
                            <div className="pdp-meta-row">
                                <span className="pdp-meta-label">SKU:</span>
                                <span>{product.pid.slice(0, 12)}</span>
                            </div>
                        )}
                        {product.categoryName && (
                            <div className="pdp-meta-row">
                                <span className="pdp-meta-label">Category:</span>
                                <span>{product.categoryName.split('>').pop().trim()}</span>
                            </div>
                        )}
                    </div>

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
                </div>
            </div>

            {/* Tabs Section — Ebbe style */}
            <div className="pdp-tabs-section">
                <div className="pdp-tabs-container">
                    <div className="pdp-tabs">
                        <button
                            className={`pdp-tab ${activeTab === 'description' ? 'active' : ''}`}
                            onClick={() => setActiveTab('description')}
                        >
                            DESCRIPTION
                        </button>
                        <button
                            className={`pdp-tab ${activeTab === 'additional' ? 'active' : ''}`}
                            onClick={() => setActiveTab('additional')}
                        >
                            ADDITIONAL INFORMATION
                        </button>
                        <button
                            className={`pdp-tab ${activeTab === 'reviews' ? 'active' : ''}`}
                            onClick={() => setActiveTab('reviews')}
                        >
                            REVIEWS (0)
                        </button>
                    </div>

                    <div className="pdp-tab-content">
                        {activeTab === 'description' && (
                            <div>
                                {product.description ? (
                                    <div
                                        className="product-description"
                                        dangerouslySetInnerHTML={{ __html: product.description }}
                                    />
                                ) : (
                                    <p style={{ color: 'var(--text-secondary)' }}>
                                        No description available for this product.
                                    </p>
                                )}
                            </div>
                        )}
                        {activeTab === 'additional' && (
                            <div>
                                <table className="pdp-info-table">
                                    <tbody>
                                        {product.categoryName && (
                                            <tr>
                                                <td className="pdp-info-label">Category</td>
                                                <td>{product.categoryName}</td>
                                            </tr>
                                        )}
                                        {product.pid && (
                                            <tr>
                                                <td className="pdp-info-label">Product ID</td>
                                                <td>{product.pid}</td>
                                            </tr>
                                        )}
                                        <tr>
                                            <td className="pdp-info-label">Shipping</td>
                                            <td>USA (7–15 business days)</td>
                                        </tr>
                                        {variants.length > 0 && (
                                            <tr>
                                                <td className="pdp-info-label">Variants</td>
                                                <td>{variants.length} option{variants.length > 1 ? 's' : ''}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {activeTab === 'reviews' && (
                            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                                <p>There are no reviews yet.</p>
                                <p style={{ fontSize: '0.85rem', marginTop: 8 }}>Be the first to review this product!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <div className="section">
                    <div className="section-header">
                        <h2 className="section-title">Related Products</h2>
                        <Link href="/products" className="section-link">View All →</Link>
                    </div>
                    <div className="product-grid">
                        {relatedProducts.filter(p => p.pid !== product.pid).slice(0, 5).map((p) => (
                            <ProductCard key={p.pid} product={p} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
