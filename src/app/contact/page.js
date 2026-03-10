'use client';

import { useState } from 'react';

export default function ContactPage() {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [submitted, setSubmitted] = useState(false);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    function handleSubmit(e) {
        e.preventDefault();
        setSubmitted(true);
    }

    return (
        <>
            <div className="page-header">
                <h1>Contact Us</h1>
                <p>We&apos;re here to help with any questions</p>
            </div>

            <div className="section">
                <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                    {/* Contact Info */}
                    <div>
                        <div className="card" style={{ marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📧</div>
                                <div>
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 2 }}>Email</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>support@velora.store</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📞</div>
                                <div>
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 2 }}>Phone</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>+1 (800) 555-0199</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>⏰</div>
                                <div>
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 2 }}>Business Hours</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Mon–Fri, 9AM – 6PM EST</p>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-title">📍 Our Location</div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                                Velora LLC<br />
                                123 Commerce Drive, Suite 200<br />
                                New York, NY 10001<br />
                                United States 🇺🇸
                            </p>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="card">
                        <div className="card-title">Send us a Message</div>

                        {submitted ? (
                            <div style={{ textAlign: 'center', padding: '24px 0' }}>
                                <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8 }}>Message Sent!</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    We&apos;ll get back to you within 24 hours.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Name *</label>
                                        <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="Your name" required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email *</label>
                                        <input className="form-input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@email.com" required />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Subject</label>
                                    <input className="form-input" name="subject" value={form.subject} onChange={handleChange} placeholder="How can we help?" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Message *</label>
                                    <textarea
                                        className="form-input"
                                        name="message"
                                        value={form.message}
                                        onChange={handleChange}
                                        placeholder="Tell us more..."
                                        rows={5}
                                        required
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary btn-full">Send Message</button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
