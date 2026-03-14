'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';

export default function AdminLoginPage() {
    const { login, isAuthenticated, isLoading } = useAdminAuth();
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Redirect if already logged in
    if (!isLoading && isAuthenticated) {
        router.push('/admin/dashboard');
        return null;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(password);
            router.push('/admin/dashboard');
        } catch (err) {
            setError(err.message || 'Invalid password');
        }
        setLoading(false);
    }

    if (isLoading) return null;

    return (
        <div className="section" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div className="card" style={{ maxWidth: 400, width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔐</div>
                    <h1 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 4 }}>Admin Login</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Enter your admin password to continue</p>
                </div>

                {error && (
                    <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠️ {error}</div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            className="form-input"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter admin password"
                            autoFocus
                            required
                            id="admin-password"
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={loading}
                        id="admin-login-btn"
                    >
                        {loading ? '⏳ Logging in...' : '🔓 Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}
