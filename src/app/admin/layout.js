'use client';

import { usePathname } from 'next/navigation';
import { AdminAuthProvider, useAdminAuth } from '@/context/AdminAuthContext';
import AdminSidebar from '@/components/AdminSidebar';

function AdminShell({ children }) {
    const pathname = usePathname();
    const { isAuthenticated, isLoading } = useAdminAuth();

    // Login page — no sidebar
    const isLoginPage = pathname === '/admin';

    if (isLoginPage || isLoading || !isAuthenticated) {
        return <>{children}</>;
    }

    return (
        <div className="admin-layout">
            <AdminSidebar />
            <main className="admin-main">
                {children}
            </main>
        </div>
    );
}

export default function AdminLayout({ children }) {
    return (
        <AdminAuthProvider>
            <AdminShell>{children}</AdminShell>
        </AdminAuthProvider>
    );
}
