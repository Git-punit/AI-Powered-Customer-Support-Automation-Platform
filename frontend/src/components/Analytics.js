import React, { useState } from 'react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

// ── Mock Data ──────────────────────────────────────────────────────────────────
const DAILY_DATA = [
    { date: 'Jan 13', total: 38, resolved: 10, escalated: 16, avg_confidence: 0.71 },
    { date: 'Jan 14', total: 52, resolved: 15, escalated: 20, avg_confidence: 0.74 },
    { date: 'Jan 15', total: 44, resolved: 12, escalated: 18, avg_confidence: 0.69 },
    { date: 'Jan 16', total: 61, resolved: 18, escalated: 24, avg_confidence: 0.76 },
    { date: 'Jan 17', total: 35, resolved: 10, escalated: 14, avg_confidence: 0.72 },
    { date: 'Jan 18', total: 27, resolved: 7, escalated: 11, avg_confidence: 0.68 },
    { date: 'Jan 19', total: 20, resolved: 6, escalated: 8, avg_confidence: 0.73 },
    { date: 'Jan 20', total: 70, resolved: 20, escalated: 28, avg_confidence: 0.78 },
    { date: 'Jan 21', total: 65, resolved: 18, escalated: 26, avg_confidence: 0.75 },
    { date: 'Jan 22', total: 58, resolved: 16, escalated: 23, avg_confidence: 0.77 },
    { date: 'Jan 23', total: 80, resolved: 22, escalated: 32, avg_confidence: 0.79 },
    { date: 'Jan 24', total: 72, resolved: 20, escalated: 29, avg_confidence: 0.74 },
    { date: 'Jan 25', total: 41, resolved: 12, escalated: 16, avg_confidence: 0.71 },
    { date: 'Jan 26', total: 33, resolved: 9, escalated: 13, avg_confidence: 0.70 },
];

const CATEGORY_DATA = [
    { category: 'Password & Access', count: 312, resolution_rate: 68 },
    { category: 'VPN & Network', count: 228, resolution_rate: 22 },
    { category: 'Software & Licenses', count: 185, resolution_rate: 41 },
    { category: 'HR & Policies', count: 156, resolution_rate: 78 },
    { category: 'Email & Outlook', count: 143, resolution_rate: 54 },
    { category: 'Hardware Issues', count: 98, resolution_rate: 15 },
    { category: 'Other', count: 78, resolution_rate: 30 },
];

const PIE_DATA = [
    { name: 'Bot Resolved', value: 280, color: '#10b981' },
    { name: 'Escalated', value: 400, color: '#f59e0b' },
    { name: 'Open', value: 220, color: '#3b82f6' },
    { name: 'Closed', value: 100, color: '#475569' },
];

const TOOLTIP_STYLE = {
    backgroundColor: '#0a1628',
    border: '1px solid rgba(59,130,246,0.2)',
    borderRadius: 8,
    color: '#f0f4ff',
    fontSize: '0.8rem',
};

// ── Performance Metric Calculation Banner ──────────────────────────────────────
function MetricBanner() {
    return (
        <div className="card" style={{ marginBottom: 24, background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <div className="card-title" style={{ marginBottom: 16 }}>📐 Performance Metric Calculations</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                {[
                    {
                        title: 'Auto Resolution Rate',
                        formula: '(Bot Resolved ÷ Total) × 100',
                        calc: '(280 ÷ 1,000) × 100',
                        result: '= 28%',
                        color: '#10b981',
                    },
                    {
                        title: 'Response Time Reduction',
                        formula: '((Manual - Bot) ÷ Manual) × 100',
                        calc: '((360s − 20s) ÷ 360s) × 100',
                        result: '= 94.4%',
                        color: '#06b6d4',
                    },
                    {
                        title: 'Repetitive Ticket Reduction',
                        formula: 'KB Coverage × Resolution Rate',
                        calc: '~40% of tickets are pattern-matched',
                        result: '≈ 40% reduction',
                        color: '#8b5cf6',
                    },
                ].map(m => (
                    <div key={m.title} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 16 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: m.color, marginBottom: 8 }}>{m.title}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--clr-text-muted)', marginBottom: 4 }}>{m.formula}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--clr-text-secondary)', marginBottom: 4 }}>{m.calc}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 800, color: m.color }}>{m.result}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Main Analytics Page ────────────────────────────────────────────────────────
export default function Analytics() {
    const [period, setPeriod] = useState(14);

    return (
        <div>
            <div className="topbar">
                <div>
                    <h2>Analytics Dashboard</h2>
                    <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.82rem', marginTop: 4 }}>
                        Real-time KPI tracking · Simulated enterprise dataset (1,000 tickets)
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {[7, 14, 30].map(d => (
                        <button
                            key={d}
                            onClick={() => setPeriod(d)}
                            className={`btn ${period === d ? 'btn-primary' : 'btn-outline'} btn-sm`}
                        >
                            {d}D
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Calculations */}
            <MetricBanner />

            {/* Daily Ticket Volume Chart */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header">
                    <div>
                        <div className="card-title">📈 Daily Ticket Volume & Resolution</div>
                        <div className="card-subtitle">Tickets processed, bot-resolved, and escalated per day</div>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={DAILY_DATA.slice(-period)} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gradEscalated" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Legend wrapperStyle={{ fontSize: '0.8rem', color: '#94a3b8' }} />
                        <Area type="monotone" dataKey="total" stroke="#3b82f6" fill="url(#gradTotal)" strokeWidth={2} name="Total Tickets" />
                        <Area type="monotone" dataKey="resolved" stroke="#10b981" fill="url(#gradResolved)" strokeWidth={2} name="Bot Resolved" />
                        <Area type="monotone" dataKey="escalated" stroke="#f59e0b" fill="url(#gradEscalated)" strokeWidth={2} name="Escalated" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="grid-2" style={{ marginBottom: 24 }}>
                {/* Category Breakdown */}
                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">🗂️ Category Breakdown</div>
                            <div className="card-subtitle">Ticket volume & bot resolution rate per category</div>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={CATEGORY_DATA} layout="vertical" margin={{ top: 0, right: 20, left: 100, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                            <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="category" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={95} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} />
                            <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Tickets" />
                            <Bar dataKey="resolution_rate" fill="#10b981" radius={[0, 4, 4, 0]} name="Resolution %" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Ticket Status Pie */}
                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">🥧 Ticket Status Distribution</div>
                            <div className="card-subtitle">Overall ticket outcome breakdown</div>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie
                                data={PIE_DATA}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={95}
                                paddingAngle={3}
                                dataKey="value"
                            >
                                {PIE_DATA.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={TOOLTIP_STYLE} />
                            <Legend wrapperStyle={{ fontSize: '0.78rem', color: '#94a3b8' }} />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Center stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                        {PIE_DATA.map(d => (
                            <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                                <span style={{ color: 'var(--clr-text-muted)' }}>{d.name}:</span>
                                <strong style={{ color: d.color }}>{d.value}</strong>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Confidence Score Trend */}
            <div className="card">
                <div className="card-header">
                    <div>
                        <div className="card-title">🧠 Average RAG Confidence Score Trend</div>
                        <div className="card-subtitle">Mean cosine similarity score of top-k retrieved chunks per day (threshold: 0.65)</div>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={DAILY_DATA.slice(-period)} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="gradConf" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0.5, 1.0]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [(v * 100).toFixed(1) + '%', 'Avg Confidence']} />
                        {/* Threshold reference line */}
                        <Area type="monotone" dataKey="avg_confidence" stroke="#8b5cf6" fill="url(#gradConf)" strokeWidth={2} name="Avg Confidence" />
                    </AreaChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 8, fontSize: '0.73rem', color: 'var(--clr-text-muted)' }}>
                    ⚠️ <strong style={{ color: '#f59e0b' }}>Escalation threshold: 0.65</strong> — Queries with confidence below this score are automatically routed to human agents.
                </div>
            </div>
        </div>
    );
}
