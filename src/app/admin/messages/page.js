'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth } from '@/context/AdminAuthContext';

export default function AdminMessagesPage() {
    const { isAuthenticated, isLoading, adminFetch, logout } = useAdminAuth();
    const router = useRouter();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) router.push('/admin');
    }, [isLoading, isAuthenticated, router]);

    const fetchMessages = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const res = await adminFetch('/api/admin/messages?size=50');
            if (res.status === 401) { logout(); router.push('/admin'); return; }
            const data = await res.json();
            setMessages(data.data?.list || []);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    }, [isAuthenticated, adminFetch, logout, router]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    if (isLoading || !isAuthenticated) return null;

    return (
        <>
            <div className="page-header">
                <h1>✉️ Contact Messages</h1>
                <p>Messages from the contact form</p>
            </div>

            <div className="section" style={{ maxWidth: 900, margin: '0 auto' }}>
                {/* Admin Navigation */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                    <Link href="/admin/dashboard" className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>📊 Dashboard</Link>
                    <Link href="/admin/orders" className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>📦 Orders</Link>
                    <Link href="/admin/products" className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>🛍️ Products</Link>
                    <Link href="/admin/customers" className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>👥 Customers</Link>
                    <Link href="/admin/messages" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>✉️ Messages</Link>
                    <Link href="/admin/sync" className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>⚙️ Sync</Link>
                    <button onClick={() => { logout(); router.push('/admin'); }} className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '0.82rem', marginLeft: 'auto' }}>🚪 Logout</button>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading messages...</div>
                ) : messages.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📭</div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>No messages yet</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Messages from the contact form will appear here.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {messages.map(msg => (
                            <div key={msg.id} className="card" style={{ padding: '16px 20px', cursor: 'pointer' }}
                                onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                            {!msg.is_read && <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', marginRight: 8 }} />}
                                            {msg.name}
                                            <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8, fontSize: '0.8rem' }}>{msg.email}</span>
                                        </div>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                                            {msg.subject || '(No subject)'}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                        {msg.created_at ? new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                                    </div>
                                </div>
                                {expandedId === msg.id && (
                                    <div style={{
                                        marginTop: 14, padding: '14px 16px', borderRadius: 'var(--radius-md)',
                                        background: 'var(--bg-glass)', border: '1px solid var(--border)',
                                        fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--text-primary)',
                                        whiteSpace: 'pre-wrap',
                                    }}>
                                        {msg.message}
                                        <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                                            <a href={`mailto:${msg.email}?subject=Re: ${msg.subject || 'Your message to Velora'}`}
                                                className="btn btn-primary"
                                                style={{ padding: '6px 16px', fontSize: '0.8rem' }}
                                                onClick={e => e.stopPropagation()}
                                            >
                                                📧 Reply via Email
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
