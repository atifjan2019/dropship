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
      const res = await fetch(`/api/products?search=${encodeURIComponent(keyword)}&size=12`);
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
      {/* Hero Section — Ebbe-style with side image */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge">ELECTRONICS</div>
            <h1>
              Latest Finds<br />
              <span className="gradient-text">in Dropshipping</span>
            </h1>
            <p className="hero-subtitle">
              -20% for Desktop PC, Laptops, VR Headsets and more. Discover premium products at unbeatable prices.
            </p>
            <Link href="/products" className="btn btn-primary btn-lg">Check Deals</Link>
          </div>
          <div className="hero-image">
            <img
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=500&fit=crop"
              alt="Latest dropshipping finds"
            />
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="features-bar">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🚚</div>
            <div>
              <h3>Free Shipping</h3>
              <p>From orders totalling $30</p>
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌐</div>
            <div>
              <h3>Variety Products</h3>
              <p>Select from +200 items</p>
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <div>
              <h3>Return & Refund</h3>
              <p>Money Back Guarantee</p>
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📞</div>
            <div>
              <h3>Support 24/7</h3>
              <p>Always Online Feedback</p>
            </div>
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
