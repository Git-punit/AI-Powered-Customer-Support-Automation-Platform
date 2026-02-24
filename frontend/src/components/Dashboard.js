import React, { useState } from 'react';
import {
    AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import KPICards from './KPICards';

const DAILY_DATA = [
    { date: 'Jan 13', total: 38, resolved: 10, escalated: 16 },
    { date: 'Jan 14', total: 52, resolved: 15, escalated: 20 },
    { date: 'Jan 15', total: 44, resolved: 12, escalated: 18 },
    { date: 'Jan 16', total: 61, resolved: 18, escalated: 24 },
    { date: 'Jan 17', total: 35, resolved: 10, escalated: 14 },
    { date: 'Jan 18', total: 27, resolved: 7, escalated: 11 },
    { date: 'Jan 19', total: 20, resolved: 6, escalated: 8 },
    { date: 'Jan 20', total: 70, resolved: 20, escalated: 28 },
    { date: 'Jan 21', total: 65, resolved: 18, escalated: 26 },
    { date: 'Jan 22', total: 58, resolved: 16, escalated: 23 },
];

// Recent activity feed
const RECENT = [
    { ref: 'TKT-A1B2', query: 'How do I reset my corporate email password?', status: 'bot_resolved', time: '2m ago', conf: 0.87 },
    { ref: 'TKT-E5F6', query: 'VPN disconnects every 30 minutes on Windows 11', status: 'escalated', time: '5m ago', conf: 0.31 },
    { ref: 'TKT-I9J0', query: 'How many annual leave days am I entitled to?', status: 'bot_resolved', time: '9m ago', conf: 0.93 },
    { ref: 'TKT-M3N4', query: 'MFA authenticator lost after phone replacement', status: 'escalated', time: '14m ago', conf: 0.44 },
    { ref: 'TKT-Q7R8', query: 'Outlook not syncing on mobile device', status: 'bot_resolved', time: '18m ago', conf: 0.79 },
];

const TOOLTIP_STYLE = {
    backgroundColor: '#0a1628',
    border: '1px solid rgba(59,130,246,0.2)',
    borderRadius: 8,
    color: '#f0f4ff',
    fontSize: '0.8rem',
};

export default function Dashboard() {
    return (
        <div>
            <div className="topbar">
                <div>
                    <h2>Operations Dashboard</h2>
                    <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.82rem', marginTop: 4 }}>
                        Enterprise RAG-Based AI Support Platform · Live KPIs
                    </p>
                </div>
                <div className="status-badge online">
                    <span className="dot" /> All Systems Operational
                </div>
            </div>

            {/* KPI Cards */}
            <KPICards />

            {/* Architecture overview strip */}
            <div className="card" style={{ marginBottom: 24, padding: '16px 24px', background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.15)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    🏗️ System Architecture Flow
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {[
                        ['👤 User', '#3b82f6'],
                        ['React Frontend', '#06b6d4'],
                        ['FastAPI Gateway', '#3b82f6'],
                        ['Sentence Transformers', '#8b5cf6'],
                        ['FAISS Vector DB', '#10b981'],
                        ['LLM (GPT / Demo)', '#f59e0b'],
                        ['PostgreSQL', '#06b6d4'],
                        ['📊 Dashboard', '#3b82f6'],
                    ].map(([label, color], i, arr) => (
                        <React.Fragment key={label}>
                            <div style={{
                                padding: '5px 12px',
                                background: `${color}15`,
                                border: `1px solid ${color}40`,
                                borderRadius: 20,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: color,
                            }}>
                                {label}
                            </div>
                            {i < arr.length - 1 && (
                                <span style={{ color: 'var(--clr-text-muted)', fontSize: '0.8rem' }}>→</span>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <div className="grid-2" style={{ marginBottom: 24 }}>
                {/* Daily chart */}
                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">📈 Daily Ticket Volume (Last 10 Days)</div>
                            <div className="card-subtitle">Total · Bot resolved · Escalated</div>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={DAILY_DATA} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gResolved" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} />
                            <Legend wrapperStyle={{ fontSize: '0.78rem', color: '#94a3b8' }} />
                            <Area type="monotone" dataKey="total" name="Total" stroke="#3b82f6" fill="url(#gTotal)" strokeWidth={2} />
                            <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" fill="url(#gResolved)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Recent Activity */}
                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">⚡ Recent Ticket Activity</div>
                            <div className="card-subtitle">Last 5 queries processed by AI</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {RECENT.map((t) => (
                            <div
                                key={t.ref}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 12,
                                    padding: '10px 12px',
                                    background: 'rgba(255,255,255,0.02)',
                                    borderRadius: 8,
                                    border: '1px solid var(--clr-border)',
                                }}
                            >
                                <div style={{ fontSize: '1.1rem', marginTop: 1 }}>
                                    {t.status === 'bot_resolved' ? '🤖' : '🔺'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {t.query}
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--clr-accent-cyan)' }}>
                                            {t.ref}
                                        </span>
                                        <span
                                            className={`confidence-pill ${t.conf >= 0.75 ? 'high' : t.conf >= 0.55 ? 'medium' : 'low'}`}
                                        >
                                            {(t.conf * 100).toFixed(0)}%
                                        </span>
                                        <span style={{ fontSize: '0.68rem', color: 'var(--clr-text-muted)' }}>{t.time}</span>
                                    </div>
                                </div>
                                <span className={`badge ${t.status === 'bot_resolved' ? 'resolved' : 'escalated'}`} style={{ fontSize: '0.65rem' }}>
                                    {t.status === 'bot_resolved' ? 'Resolved' : 'Escalated'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tech Stack Footer */}
            <div className="card" style={{ padding: '16px 24px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    ⚙️ Technology Stack
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {[
                        ['🐍 FastAPI', '#3b82f6'],
                        ['🤗 Sentence Transformers', '#8b5cf6'],
                        ['🗄️ FAISS Vector DB', '#10b981'],
                        ['🧠 OpenAI GPT', '#f59e0b'],
                        ['🐘 PostgreSQL', '#06b6d4'],
                        ['⚛️ React.js', '#3b82f6'],
                        ['🐳 Docker', '#06b6d4'],
                        ['☁️ AWS EC2', '#f59e0b'],
                        ['🔁 GitHub Actions', '#8b5cf6'],
                        ['🔐 JWT Auth', '#10b981'],
                    ].map(([tech, color]) => (
                        <span
                            key={tech}
                            style={{
                                padding: '4px 12px',
                                background: `${color}12`,
                                border: `1px solid ${color}35`,
                                borderRadius: 16,
                                fontSize: '0.73rem',
                                fontWeight: 600,
                                color: color,
                            }}
                        >
                            {tech}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
