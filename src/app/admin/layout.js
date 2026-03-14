'use client';

import { AdminAuthProvider } from '@/context/AdminAuthContext';

export default function AdminLayout({ children }) {
    return (
        <AdminAuthProvider>
            {children}
        </AdminAuthProvider>
    );
}
