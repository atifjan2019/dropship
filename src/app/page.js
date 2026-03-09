'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts(keyword = '') {
    setLoading(true);
    try {
      const res = await fetch(`/api/cj/products?keyword=${encodeURIComponent(keyword)}&size=12`);
      const data = await res.json();
      setProducts(data.data?.list || data.data || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setProducts([]);
    }
    setLoading(false);
  }

  function handleSearch(e) {
    e.preventDefault();
    fetchProducts(searchQuery);
  }

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">🇺🇸 Free Shipping to USA</div>
          <h1>
            Discover <span className="gradient-text">Premium Products</span> at Unbeatable Prices
          </h1>
          <p className="hero-subtitle">
            Curated trending products shipped directly to your door. Quality guaranteed.
          </p>

          <div className="search-container">
            <form className="search-bar" onSubmit={handleSearch}>
              <input
                type="text"
                className="search-input"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="hero-search"
              />
              <button type="submit" className="search-btn">
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🚀</div>
            <h3>Fast Shipping</h3>
            <p>7–15 day delivery to anywhere in the USA with full tracking.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Quality Assured</h3>
            <p>Every product is inspected before shipment for premium quality.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Best Prices</h3>
            <p>Direct from manufacturers — no middleman markups.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📦</div>
            <h3>Easy Returns</h3>
            <p>30-day hassle-free return policy on all orders.</p>
          </div>
        </div>
      </section>

      {/* Trending Products */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Trending Products</h2>
          <Link href="/products" className="section-link">View All →</Link>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading products..." />
        ) : products.length > 0 ? (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.pid} product={product} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <h2>No products found</h2>
            <p>Try a different search term or browse all products.</p>
            <Link href="/products" className="btn btn-primary">Browse All</Link>
          </div>
        )}
      </section>
    </>
  );
}
