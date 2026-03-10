import Link from 'next/link';

export const metadata = {
    title: 'About Us — Velora',
    description: 'Learn about Velora, your trusted premium dropshipping store.',
};

export default function AboutPage() {
    return (
        <>
            <div className="page-header">
                <h1>About Velora</h1>
                <p>Your trusted destination for premium products</p>
            </div>

            <div className="section">
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                    {/* Mission */}
                    <div className="card" style={{ marginBottom: 24 }}>
                        <div className="card-title">🎯 Our Mission</div>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>
                            At Velora, we believe everyone deserves access to quality products at fair prices.
                            We partner directly with manufacturers around the world to bring you a curated selection
                            of trending electronics, accessories, and lifestyle products — all shipped straight to
                            your door in the USA.
                        </p>
                    </div>

                    {/* Values Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 24 }}>
                        <div className="card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🌍</div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>Global Sourcing</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                                We source products from trusted manufacturers worldwide, ensuring quality and competitive pricing.
                            </p>
                        </div>
                        <div className="card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚡</div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>Fast Processing</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                                Orders are processed within 24 hours and shipped with reliable logistics for 7–15 day delivery.
                            </p>
                        </div>
                        <div className="card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🛡️</div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>Quality Guarantee</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                                Every product is quality-checked. Not satisfied? Our 30-day return policy has you covered.
                            </p>
                        </div>
                    </div>

                    {/* Why Choose */}
                    <div className="card" style={{ marginBottom: 24 }}>
                        <div className="card-title">💎 Why Choose Velora?</div>
                        <ul style={{ color: 'var(--text-secondary)', lineHeight: 2, fontSize: '0.95rem', paddingLeft: 20 }}>
                            <li>Curated selection of trending and high-quality products</li>
                            <li>Competitive prices — direct from manufacturers</li>
                            <li>Free shipping on orders over $30</li>
                            <li>Secure checkout and encrypted payment processing</li>
                            <li>Real-time order tracking from warehouse to your door</li>
                            <li>Dedicated customer support team available 24/7</li>
                        </ul>
                    </div>

                    {/* CTA */}
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>Ready to Shop?</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                            Explore our catalog and find your next favorite product.
                        </p>
                        <Link href="/products" className="btn btn-primary btn-lg">Browse Products</Link>
                    </div>
                </div>
            </div>
        </>
    );
}
