'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth } from '@/context/AdminAuthContext';

const STATUS_COLORS = {
    pending: '#f59e0b',
    processing: '#3b82f6',
    shipped: '#8b5cf6',
    delivered: '#10b981',
    cancelled: '#ef4444',
    failed: '#ef4444',
};

function MonthlySalesChart({ revenueByDay }) {
    const canvasRef = useRef(null);
    const [chartRange, setChartRange] = useState('month');

    const drawChart = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !revenueByDay) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        // Determine data range
        const now = new Date();
        let daysBack = 30;
        if (chartRange === 'year') daysBack = 365;
        else if (chartRange === 'lastMonth') {
            const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lmEnd = new Date(now.getFullYear(), now.getMonth(), 0);
            daysBack = Math.ceil((lmEnd - lm) / (1000 * 60 * 60 * 24));
        }

        // Build data points
        const labels = [];
        const values = [];
        for (let i = daysBack; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            labels.push(d.getDate().toString());
            values.push(revenueByDay[key] || 0);
        }

        const w = canvas.parentElement.clientWidth;
        const h = 260;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        const padL = 55, padR = 20, padT = 20, padB = 35;
        const chartW = w - padL - padR;
        const chartH = h - padT - padB;
        const maxVal = Math.max(...values, 1);
        const stepX = chartW / Math.max(values.length - 1, 1);

        // Y-axis grid lines
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.fillStyle = '#888';
        ctx.font = '11px Jost, sans-serif';
        ctx.textAlign = 'right';
        const ySteps = 5;
        for (let i = 0; i <= ySteps; i++) {
            const y = padT + (chartH / ySteps) * i;
            const val = (maxVal - (maxVal / ySteps) * i).toFixed(2);
            ctx.beginPath();
            ctx.setLineDash([3, 3]);
            ctx.moveTo(padL, y);
            ctx.lineTo(w - padR, y);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillText(val, padL - 8, y + 4);
        }

        // X-axis labels (show every Nth label to avoid crowding)
        ctx.textAlign = 'center';
        ctx.fillStyle = '#888';
        const labelEvery = Math.max(1, Math.floor(values.length / 15));
        for (let i = 0; i < values.length; i += labelEvery) {
            const x = padL + i * stepX;
            ctx.fillText(labels[i], x, h - 10);
        }

        // Gradient fill
        const gradient = ctx.createLinearGradient(0, padT, 0, padT + chartH);
        gradient.addColorStop(0, 'rgba(37, 74, 165, 0.25)');
        gradient.addColorStop(1, 'rgba(37, 74, 165, 0.02)');

        ctx.beginPath();
        ctx.moveTo(padL, padT + chartH);
        for (let i = 0; i < values.length; i++) {
            const x = padL + i * stepX;
            const y = padT + chartH - (values[i] / maxVal) * chartH;
            if (i === 0) ctx.lineTo(x, y);
            else {
                // Smooth curve
                const prevX = padL + (i - 1) * stepX;
                const prevY = padT + chartH - (values[i - 1] / maxVal) * chartH;
                const cpx = (prevX + x) / 2;
                ctx.bezierCurveTo(cpx, prevY, cpx, y, x, y);
            }
        }
        ctx.lineTo(padL + (values.length - 1) * stepX, padT + chartH);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Line
        ctx.beginPath();
        for (let i = 0; i < values.length; i++) {
            const x = padL + i * stepX;
            const y = padT + chartH - (values[i] / maxVal) * chartH;
            if (i === 0) ctx.moveTo(x, y);
            else {
                const prevX = padL + (i - 1) * stepX;
                const prevY = padT + chartH - (values[i - 1] / maxVal) * chartH;
                const cpx = (prevX + x) / 2;
                ctx.bezierCurveTo(cpx, prevY, cpx, y, x, y);
            }
        }
        ctx.strokeStyle = '#254aa5';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Dots at data points (only show if < 35 points)
        if (values.length < 35) {
            for (let i = 0; i < values.length; i++) {
                const x = padL + i * stepX;
                const y = padT + chartH - (values[i] / maxVal) * chartH;
                ctx.beginPath();
                ctx.arc(x, y, 3.5, 0, Math.PI * 2);
                ctx.fillStyle = '#254aa5';
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
    }, [revenueByDay, chartRange]);

    useEffect(() => {
        drawChart();
        const handleResize = () => drawChart();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [drawChart]);

    return (
        <div className="admin-chart-card">
            <div className="admin-chart-header">
                <h3 className="admin-chart-title">Monthly Sales</h3>
                <div className="admin-chart-tabs">
                    {[
                        { key: 'month', label: 'This Month' },
                        { key: 'lastMonth', label: 'Last Month' },
                        { key: 'year', label: 'Last 12M' },
                    ].map(t => (
                        <button
                            key={t.key}
                            className={`admin-chart-tab${chartRange === t.key ? ' active' : ''}`}
                            onClick={() => setChartRange(t.key)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>
            <div style={{ width: '100%' }}>
                <canvas ref={canvasRef} />
            </div>
        </div>
    );
}

function ConversionsDonut({ stats }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !stats) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const size = 160;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
        ctx.scale(dpr, dpr);

        const cx = size / 2, cy = size / 2, r = 60, lw = 20;
        const returning = stats.returningCustomers || 0;
        const total = stats.totalCustomers || 1;
        const pct = total > 0 ? returning / total : 0;

        // Background arc
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = lw;
        ctx.stroke();

        // Filled arc
        ctx.beginPath();
        ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
        ctx.strokeStyle = '#254aa5';
        ctx.lineWidth = lw;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Center text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 24px Jost, sans-serif';
        ctx.fillStyle = '#1a1a2e';
        ctx.fillText(`${Math.round(pct * 100)}%`, cx, cy);
    }, [stats]);

    return (
        <div className="admin-conversion-card">
            <h3 className="admin-conversion-title">Conversions</h3>
            <div className="admin-conversion-chart">
                <canvas ref={canvasRef} />
            </div>
            <div className="admin-conversion-label">Returning Customer</div>
        </div>
    );
}

export default function AdminDashboardPage() {
    const { isAuthenticated, isLoading, adminFetch, logout } = useAdminAuth();
    const router = useRouter();
    const [stats, setStats] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [revenueByDay, setRevenueByDay] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/admin');
        }
    }, [isLoading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) fetchDashboard();
    }, [isAuthenticated]);

    async function fetchDashboard() {
        setLoading(true);
        try {
            const res = await adminFetch('/api/admin/dashboard');
            if (res.status === 401) { logout(); router.push('/admin'); return; }
            const data = await res.json();
            setStats(data.data?.stats || null);
            setRecentOrders(data.data?.recentOrders || []);
            setRevenueByDay(data.data?.revenueByDay || {});
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    }

    if (isLoading || !isAuthenticated) return null;

    const statCards = stats ? [
        {
            label: 'Total Orders',
            value: stats.totalOrders,
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#254aa5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
            ),
            bg: 'rgba(37, 74, 165, 0.1)',
            link: '/admin/orders',
        },
        {
            label: "Today's Orders",
            value: stats.ordersToday,
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            ),
            bg: 'rgba(139, 92, 246, 0.1)',
            link: '/admin/orders',
        },
        {
            label: 'Pending Orders',
            value: stats.ordersByStatus?.pending || 0,
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
            ),
            bg: 'rgba(245, 158, 11, 0.1)',
            link: '/admin/orders',
        },
        {
            label: 'Total Revenue',
            value: `$${stats.totalRevenue?.toLocaleString()}`,
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
            ),
            bg: 'rgba(16, 185, 129, 0.1)',
            link: '/admin/orders',
        },
    ] : [];

    return (
        <>
            {/* Welcome Bar */}
            <div className="admin-welcome-bar">
                <h1>WELCOME!</h1>
                <div className="admin-welcome-avatar">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                </div>
            </div>

            <div className="admin-dashboard-content">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
                        Loading dashboard...
                    </div>
                ) : stats && (
                    <>
                        {/* Stat Cards */}
                        <div className="admin-stats-grid">
                            {statCards.map(s => (
                                <div key={s.label} className="admin-stat-card">
                                    <div className="admin-stat-icon" style={{ background: s.bg }}>
                                        {s.icon}
                                    </div>
                                    <div className="admin-stat-info">
                                        <div className="admin-stat-label">{s.label}</div>
                                        <div className="admin-stat-value">{s.value}</div>
                                        <div className="admin-stat-footer">
                                            <span></span>
                                            <Link href={s.link} className="admin-stat-link">View More</Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Monthly Sales Chart */}
                        <div className="admin-charts-row">
                            <MonthlySalesChart revenueByDay={revenueByDay} />
                        </div>

                        {/* Bottom Grid: Conversions + Top Selling */}
                        <div className="admin-bottom-grid">
                            <ConversionsDonut stats={stats} />

                            <div className="admin-top-card">
                                <div className="admin-top-header">
                                    <h3 className="admin-top-title">Top Selling Items</h3>
                                    <Link href="/admin/orders" className="admin-top-viewall">View All</Link>
                                </div>
                                <table className="admin-top-table">
                                    <thead>
                                        <tr>
                                            <th>Item Name</th>
                                            <th>Status</th>
                                            <th>Total</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentOrders.slice(0, 5).map(o => (
                                            <tr key={o.orderId}>
                                                <td style={{ fontWeight: 500 }}>
                                                    {o.shippingName || o.customerEmail || `Order #${o.orderNum}`}
                                                </td>
                                                <td>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '3px 10px',
                                                        borderRadius: 12,
                                                        background: (STATUS_COLORS[o.status] || '#6b7280') + '18',
                                                        color: STATUS_COLORS[o.status] || '#6b7280',
                                                        fontWeight: 600,
                                                        fontSize: '0.75rem',
                                                        textTransform: 'capitalize',
                                                    }}>
                                                        {(o.status || 'unknown').replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: 600, color: 'var(--accent)' }}>
                                                    ${Number(o.total || 0).toFixed(2)}
                                                </td>
                                                <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                    {o.date ? new Date(o.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                        {recentOrders.length === 0 && (
                                            <tr>
                                                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
                                                    No orders yet
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
