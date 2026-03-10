'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import LoadingSpinner from '@/components/LoadingSpinner';

function ProductsPageInner() {
    const searchParams = useSearchParams();


    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
    const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
    const [totalPages, setTotalPages] = useState(1);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [page, selectedCategory]);

    async function fetchCategories() {
        try {
            const res = await fetch('/api/products');
            const data = await res.json();
            // Extract unique categories from products
            const cats = [...new Set((data.data?.list || []).map(p => p.categoryName).filter(Boolean))];
            setCategories(cats.map(c => ({ categoryName: c })));
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    }

    async function fetchProducts() {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                search: keyword,
                page: page.toString(),
                size: '20',
            });
            if (selectedCategory) params.set('category', selectedCategory);

            const res = await fetch(`/api/products?${params.toString()}`);
            const data = await res.json();
            const list = data.data?.list || data.data || [];
            setProducts(list);
            const total = data.data?.total || list.length;
            setTotalPages(Math.max(1, Math.ceil(total / 20)));
        } catch (err) {
            console.error('Failed to fetch products:', err);
            setProducts([]);
        }
        setLoading(false);
    }

    function handleSearch(e) {
        e.preventDefault();
        setPage(1);
        fetchProducts();
    }

    return (
        <>
            <div className="page-header">
                <h1>All Products</h1>
                <p>Browse our curated selection of trending products</p>
            </div>

            {/* Filters */}
            <div className="filters-toolbar">
                <form className="search-bar filter-search" onSubmit={handleSearch}>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search products..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        id="products-search"
                    />
                    <button type="submit" className="search-btn">Search</button>
                </form>
            </div>

            {/* Category Pills */}
            {categories.length > 0 && (
                <div className="section" style={{ paddingTop: 0 }}>
                    <div className="category-grid">
                        <button
                            className={`category-pill ${!selectedCategory ? 'active' : ''}`}
                            onClick={() => { setSelectedCategory(''); setPage(1); }}
                        >
                            All
                        </button>
                        {categories.slice(0, 12).map((cat, idx) => {
                            const catName = cat.categoryName || cat.name || `Category ${idx + 1}`;
                            return (
                                <button
                                    key={catName}
                                    className={`category-pill ${selectedCategory === catName ? 'active' : ''}`}
                                    onClick={() => { setSelectedCategory(catName); setPage(1); }}
                                >
                                    {cat.categoryName || cat.name || `Category ${idx + 1}`}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Product Grid */}
            <section className="section" style={{ paddingTop: 0 }}>
                {loading ? (
                    <LoadingSpinner text="Loading products..." />
                ) : products.length > 0 ? (
                    <>
                        <div className="product-grid">
                            {products.map((product) => (
                                <ProductCard key={product.pid} product={product} />
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="pagination">
                            <button
                                className="page-btn"
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                ←
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const start = Math.max(1, page - 2);
                                const num = start + i;
                                if (num > totalPages) return null;
                                return (
                                    <button
                                        key={num}
                                        className={`page-btn ${num === page ? 'active' : ''}`}
                                        onClick={() => setPage(num)}
                                    >
                                        {num}
                                    </button>
                                );
                            })}
                            <button
                                className="page-btn"
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                →
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">🔍</div>
                        <h2>No products found</h2>
                        <p>Try adjusting your search or browse a different category.</p>
                    </div>
                )}
            </section>
        </>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<LoadingSpinner text="Loading..." />}>
            <ProductsPageInner />
        </Suspense>
    );
}
