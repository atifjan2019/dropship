'use client';

import { useState } from 'react';
import Link from 'next/link';

const faqs = [
    {
        category: 'Orders & Shipping',
        items: [
            { q: 'How long does shipping take?', a: 'Standard shipping to the USA takes 7–15 business days. Some items may arrive sooner depending on location and warehouse availability.' },
            { q: 'Do you offer free shipping?', a: 'Yes! All orders over $30 qualify for free standard shipping within the United States.' },
            { q: 'Can I track my order?', a: 'Absolutely. Once your order ships, you\'ll receive a tracking number via email. You can also check your order status on our Track Order page.' },
            { q: 'Do you ship internationally?', a: 'Currently, we only ship within the United States. We\'re working on expanding to international markets soon.' },
        ],
    },
    {
        category: 'Returns & Refunds',
        items: [
            { q: 'What is your return policy?', a: 'We offer a 30-day hassle-free return policy. If you\'re not satisfied with your purchase, contact us for a return authorization.' },
            { q: 'How do I request a refund?', a: 'Email our support team at support@velora.store with your order number. Refunds are processed within 5–7 business days after we receive the returned item.' },
            { q: 'Do I have to pay for return shipping?', a: 'Return shipping costs depend on the reason for return. For defective or incorrect items, we cover return shipping. For change-of-mind returns, the customer covers shipping.' },
        ],
    },
    {
        category: 'Products & Quality',
        items: [
            { q: 'Are your products authentic?', a: 'Yes. We work directly with verified manufacturers and distributors. Every product undergoes quality inspection before shipping.' },
            { q: 'Why are your prices lower than retail?', a: 'We source directly from manufacturers, cutting out middlemen and retail markup. This allows us to pass the savings on to you.' },
            { q: 'Can I request a specific product?', a: 'We\'re always expanding our catalog. Email us at support@velora.store with your product request and we\'ll do our best to source it.' },
        ],
    },
    {
        category: 'Account & Payment',
        items: [
            { q: 'What payment methods do you accept?', a: 'We accept Visa, Mastercard, American Express, PayPal, and other major payment methods through our secure checkout.' },
            { q: 'Is my payment information secure?', a: 'Absolutely. All transactions are encrypted with industry-standard SSL/TLS. We never store your full payment details on our servers.' },
        ],
    },
];

export default function FAQPage() {
    const [openIndex, setOpenIndex] = useState(null);

    function toggle(key) {
        setOpenIndex(openIndex === key ? null : key);
    }

    return (
        <>
            <div className="page-header">
                <h1>Frequently Asked Questions</h1>
                <p>Find answers to common questions about our store</p>
            </div>

            <div className="section">
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    {faqs.map((section, si) => (
                        <div key={si} style={{ marginBottom: 32 }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16, color: 'var(--accent)' }}>
                                {section.category}
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {section.items.map((item, qi) => {
                                    const key = `${si}-${qi}`;
                                    const isOpen = openIndex === key;
                                    return (
                                        <div key={key} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                            <button
                                                onClick={() => toggle(key)}
                                                style={{
                                                    width: '100%',
                                                    padding: '16px 20px',
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    fontSize: '0.95rem',
                                                    fontWeight: 500,
                                                    color: 'var(--text-primary)',
                                                    textAlign: 'left',
                                                }}
                                            >
                                                {item.q}
                                                <span style={{
                                                    fontSize: '1.2rem',
                                                    transition: 'transform 0.2s',
                                                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                                                    color: 'var(--text-muted)',
                                                    flexShrink: 0,
                                                    marginLeft: 12,
                                                }}>
                                                    ▾
                                                </span>
                                            </button>
                                            {isOpen && (
                                                <div style={{
                                                    padding: '0 20px 16px',
                                                    color: 'var(--text-secondary)',
                                                    fontSize: '0.9rem',
                                                    lineHeight: 1.7,
                                                    borderTop: '1px solid var(--border)',
                                                    paddingTop: 14,
                                                }}>
                                                    {item.a}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Still need help */}
                    <div className="card" style={{ textAlign: 'center', marginTop: 16 }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8 }}>Still Have Questions?</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>
                            Our support team is happy to help you with anything.
                        </p>
                        <Link href="/contact" className="btn btn-primary">Contact Support</Link>
                    </div>
                </div>
            </div>
        </>
    );
}
