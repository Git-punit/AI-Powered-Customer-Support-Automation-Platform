import React, { useState } from 'react';

const MOCK_TICKETS = [
    { id: 1, ticket_ref: 'TKT-A1B2C3D4', user_query: 'How do I reset my corporate email password?', status: 'bot_resolved', priority: 'medium', confidence_score: 0.87, response_time_seconds: 0.42, is_escalated: false, created_at: '2025-01-20T09:15:00Z' },
    { id: 2, ticket_ref: 'TKT-E5F6G7H8', user_query: 'VPN disconnects every 30 minutes on Windows 11', status: 'escalated', priority: 'high', confidence_score: 0.31, response_time_seconds: 0.22, is_escalated: true, created_at: '2025-01-20T10:30:00Z' },
    { id: 3, ticket_ref: 'TKT-I9J0K1L2', user_query: 'Cannot access SharePoint after AD migration', status: 'escalated', priority: 'critical', confidence_score: 0.28, response_time_seconds: 0.19, is_escalated: true, created_at: '2025-01-20T11:00:00Z' },
    { id: 4, ticket_ref: 'TKT-M3N4O5P6', user_query: 'How many days of annual leave am I entitled to?', status: 'bot_resolved', priority: 'low', confidence_score: 0.93, response_time_seconds: 0.38, is_escalated: false, created_at: '2025-01-20T12:00:00Z' },
    { id: 5, ticket_ref: 'TKT-Q7R8S9T0', user_query: 'Outlook not syncing on mobile device', status: 'bot_resolved', priority: 'medium', confidence_score: 0.79, response_time_seconds: 0.45, is_escalated: false, created_at: '2025-01-21T08:00:00Z' },
    { id: 6, ticket_ref: 'TKT-U1V2W3X4', user_query: 'Software license request for Adobe Acrobat Pro', status: 'open', priority: 'medium', confidence_score: 0.55, response_time_seconds: 0.28, is_escalated: false, created_at: '2025-01-21T09:30:00Z' },
    { id: 7, ticket_ref: 'TKT-Y5Z6A7B8', user_query: 'MFA authenticator lost after phone replacement', status: 'escalated', priority: 'high', confidence_score: 0.44, response_time_seconds: 0.33, is_escalated: true, created_at: '2025-01-21T11:00:00Z' },
    { id: 8, ticket_ref: 'TKT-C9D0E1F2', user_query: 'How to apply for work-from-home arrangement?', status: 'bot_resolved', priority: 'low', confidence_score: 0.88, response_time_seconds: 0.41, is_escalated: false, created_at: '2025-01-21T14:00:00Z' },
];

const STATUS_COLORS = {
    bot_resolved: 'resolved',
    escalated: 'escalated',
    open: 'open',
    closed: 'closed',
};

const STATUS_LABELS = {
    bot_resolved: '🤖 Bot Resolved',
    escalated: '🔺 Escalated',
    open: '🔵 Open',
    closed: '✅ Closed',
};

const PRIORITY_LABELS = {
    critical: '🔴 Critical',
    high: '🟠 High',
    medium: '🟡 Medium',
    low: '🟢 Low',
};

function ConfidencePill({ score }) {
    const cls = score >= 0.75 ? 'high' : score >= 0.55 ? 'medium' : 'low';
    return (
        <span className={`confidence-pill ${cls}`}>
            {(score * 100).toFixed(0)}%
        </span>
    );
}

function formatDate(iso) {
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Tickets() {
    const [filter, setFilter] = useState('all');
    const [selected, setSelected] = useState(null);

    const filtered = filter === 'all'
        ? MOCK_TICKETS
        : filter === 'escalated'
            ? MOCK_TICKETS.filter(t => t.is_escalated)
            : MOCK_TICKETS.filter(t => t.status === filter);

    const counts = {
        all: MOCK_TICKETS.length,
        bot_resolved: MOCK_TICKETS.filter(t => t.status === 'bot_resolved').length,
        escalated: MOCK_TICKETS.filter(t => t.is_escalated).length,
        open: MOCK_TICKETS.filter(t => t.status === 'open').length,
    };

    return (
        <div>
            <div className="topbar">
                <div>
                    <h2>Support Tickets</h2>
                    <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.82rem', marginTop: 4 }}>
                        All queries processed by the AI support system
                    </p>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                    FAISS · {MOCK_TICKETS.length} tickets · Demo dataset
                </div>
            </div>

            {/* Summary Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {[
                    { label: 'Total', value: counts.all, color: '#3b82f6', icon: '📋' },
                    { label: 'Bot Resolved', value: counts.bot_resolved, color: '#10b981', icon: '🤖' },
                    { label: 'Escalated', value: counts.escalated, color: '#f59e0b', icon: '🔺' },
                    { label: 'Open', value: counts.open, color: '#06b6d4', icon: '🔵' },
                ].map(s => (
                    <div key={s.label} className="card" style={{ padding: '16px 20px', borderTop: `3px solid ${s.color}` }}>
                        <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>{s.icon}</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {[
                    { key: 'all', label: `All (${counts.all})` },
                    { key: 'bot_resolved', label: `Bot Resolved (${counts.bot_resolved})` },
                    { key: 'escalated', label: `Escalated (${counts.escalated})` },
                    { key: 'open', label: `Open (${counts.open})` },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`btn ${filter === tab.key ? 'btn-primary' : 'btn-outline'} btn-sm`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid-2">
                {/* Tickets Table */}
                <div className="card" style={{ gridColumn: selected ? '1' : '1 / -1' }}>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Ticket Ref</th>
                                    <th>Query</th>
                                    <th>Status</th>
                                    <th>Priority</th>
                                    <th>Confidence</th>
                                    <th>Response</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(t => (
                                    <tr
                                        key={t.id}
                                        onClick={() => setSelected(t)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td>
                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--clr-accent-cyan)' }}>
                                                {t.ticket_ref}
                                            </span>
                                        </td>
                                        <td style={{ maxWidth: 240 }}>
                                            <span style={{ fontSize: '0.82rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {t.user_query}
                                            </span>
                                        </td>
                                        <td><span className={`badge ${STATUS_COLORS[t.status]}`}>{STATUS_LABELS[t.status]}</span></td>
                                        <td><span className={`badge ${t.priority}`}>{PRIORITY_LABELS[t.priority]}</span></td>
                                        <td><ConfidencePill score={t.confidence_score} /></td>
                                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--clr-accent-green)' }}>
                                            {t.response_time_seconds}s
                                        </td>
                                        <td style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>{formatDate(t.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Ticket Detail */}
                {selected && (
                    <div className="card" style={{ alignSelf: 'flex-start' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div className="card-title">Ticket Detail</div>
                            <button className="btn btn-outline btn-sm" onClick={() => setSelected(null)}>✕ Close</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Reference</div>
                                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--clr-accent-cyan)' }}>{selected.ticket_ref}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>User Query</div>
                                <div style={{ fontSize: '0.88rem', lineHeight: 1.5 }}>{selected.user_query}</div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Status</div>
                                    <span className={`badge ${STATUS_COLORS[selected.status]}`}>{STATUS_LABELS[selected.status]}</span>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Priority</div>
                                    <span className={`badge ${selected.priority}`}>{PRIORITY_LABELS[selected.priority]}</span>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Confidence</div>
                                    <ConfidencePill score={selected.confidence_score} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Response Time</div>
                                    <span style={{ color: 'var(--clr-accent-green)', fontWeight: 700 }}>{selected.response_time_seconds}s</span>
                                </div>
                            </div>
                            {selected.is_escalated && (
                                <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem', color: '#f59e0b' }}>
                                    🔺 Escalated — Confidence below threshold (0.65). Routed to human agent.
                                </div>
                            )}
                            <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
                                Created: {formatDate(selected.created_at)}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
