import Link from 'next/link';

export const metadata = {
    title: 'Shipping & Returns — Velora',
    description: 'Learn about Velora shipping times, costs, and our hassle-free return policy.',
};

export default function ShippingPage() {
    return (
        <>
            <div className="page-header">
                <h1>Shipping & Returns</h1>
                <p>Everything you need to know about delivery and returns</p>
            </div>

            <div className="section">
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                    {/* Shipping Info */}
                    <div className="card" style={{ marginBottom: 24 }}>
                        <div className="card-title">🚚 Shipping Information</div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Method</th>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Delivery Time</th>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '12px 16px' }}>Standard Shipping</td>
                                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>7–15 business days</td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{ color: 'var(--success)', fontWeight: 600 }}>FREE</span>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}> (orders $30+)</span>
                                    </td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '12px 16px' }}>Standard Shipping</td>
                                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>7–15 business days</td>
                                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>$4.99</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '12px 16px' }}>Express Shipping</td>
                                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>5–8 business days</td>
                                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>$12.99</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Shipping Details */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                        <div className="card">
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12 }}>📦 Processing Time</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                                Orders are processed within 1–3 business days. During peak seasons (holidays, sales events), processing may take an additional 1–2 days.
                            </p>
                        </div>
                        <div className="card">
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12 }}>📍 Delivery Area</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                                We currently ship to all 50 US states including Alaska and Hawaii. International shipping is coming soon.
                            </p>
                        </div>
                    </div>

                    {/* Returns */}
                    <div className="card" style={{ marginBottom: 24 }}>
                        <div className="card-title">🔄 Return Policy</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.8 }}>
                            <p style={{ marginBottom: 16 }}>
                                We want you to be completely satisfied with your purchase. If something isn't right,
                                we offer a <strong style={{ color: 'var(--text-primary)' }}>30-day return window</strong> from the date of delivery.
                            </p>
                            <h4 style={{ color: 'var(--text-primary)', marginBottom: 8, fontSize: '0.95rem' }}>Eligible for Returns:</h4>
                            <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
                                <li>Items in original, unused condition with tags attached</li>
                                <li>Defective or damaged products (we cover return shipping)</li>
                                <li>Wrong item received</li>
                            </ul>
                            <h4 style={{ color: 'var(--text-primary)', marginBottom: 8, fontSize: '0.95rem' }}>Not Eligible:</h4>
                            <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
                                <li>Items used, washed, or altered</li>
                                <li>Items without original packaging</li>
                                <li>Sale items marked as final sale</li>
                            </ul>
                            <h4 style={{ color: 'var(--text-primary)', marginBottom: 8, fontSize: '0.95rem' }}>How to Return:</h4>
                            <ol style={{ paddingLeft: 20 }}>
                                <li>Contact us at <strong>support@velora.store</strong> with your order number</li>
                                <li>Receive a Return Authorization (RA) number within 24 hours</li>
                                <li>Ship the item back with the RA number on the package</li>
                                <li>Refund processed within 5–7 business days of receipt</li>
                            </ol>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="card" style={{ textAlign: 'center' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8 }}>Need Help?</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>
                            Our support team can help with shipping questions and return requests.
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link href="/contact" className="btn btn-primary">Contact Support</Link>
                            <Link href="/track" className="btn btn-secondary">Track Your Order</Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
