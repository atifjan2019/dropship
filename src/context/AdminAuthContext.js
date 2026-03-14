'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AdminAuthContext = createContext();

export function AdminAuthProvider({ children }) {
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load token from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem('velora-admin-token');
            if (saved) {
                // Validate token hasn't expired (check base64 payload)
                try {
                    const payload = JSON.parse(atob(saved));
                    const expiresAt = payload.ts + (24 * 60 * 60 * 1000);
                    if (Date.now() < expiresAt) {
                        setToken(saved);
                    } else {
                        localStorage.removeItem('velora-admin-token');
                    }
                } catch {
                    localStorage.removeItem('velora-admin-token');
                }
            }
        } catch {}
        setIsLoading(false);
    }, []);

    const login = useCallback(async (password) => {
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        });
        const data = await res.json();

        if (!res.ok || !data.result) {
            throw new Error(data.error || 'Login failed');
        }

        setToken(data.token);
        localStorage.setItem('velora-admin-token', data.token);
        return data;
    }, []);

    const logout = useCallback(() => {
        setToken(null);
        localStorage.removeItem('velora-admin-token');
    }, []);

    // Helper to make authenticated API calls
    const adminFetch = useCallback(async (url, options = {}) => {
        return fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers,
            },
        });
    }, [token]);

    const isAuthenticated = !!token;

    return (
        <AdminAuthContext.Provider value={{ token, isAuthenticated, isLoading, login, logout, adminFetch }}>
            {children}
        </AdminAuthContext.Provider>
    );
}

export function useAdminAuth() {
    const ctx = useContext(AdminAuthContext);
    if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
    return ctx;
}
