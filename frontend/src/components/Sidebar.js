import React from 'react';

const navItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard', badge: null },
    { id: 'chat', icon: '🤖', label: 'AI Assistant', badge: 'LIVE' },
    { id: 'knowledge', icon: '📚', label: 'Knowledge Base', badge: null },
    { id: 'tickets', icon: '🎫', label: 'Tickets', badge: null },
    { id: 'analytics', icon: '📈', label: 'Analytics', badge: null },
];

export default function Sidebar({ activePage, onNavigate }) {
    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <div className="logo-icon">🧠</div>
                <h1>Enterprise AI<br />Support Platform</h1>
                <p>RAG-Powered Automation</p>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                        onClick={() => onNavigate(item.id)}
                        style={{ background: 'none', width: '100%', textAlign: 'left' }}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span>{item.label}</span>
                        {item.badge && (
                            <span className="nav-badge">{item.badge}</span>
                        )}
                    </button>
                ))}
            </nav>

            {/* System Status */}
            <div style={{ padding: '0 16px' }}>
                <div style={{
                    background: 'rgba(16,185,129,0.07)',
                    border: '1px solid rgba(16,185,129,0.2)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>
                        SYSTEM STATUS
                    </div>
                    {[
                        { name: 'FastAPI Service', ok: true },
                        { name: 'FAISS Index', ok: true },
                        { name: 'LLM (Demo Mode)', ok: true },
                        { name: 'PostgreSQL', ok: true },
                    ].map((s) => (
                        <div key={s.name} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            marginBottom: 4, fontSize: '0.72rem',
                        }}>
                            <span style={{ color: '#94a3b8' }}>{s.name}</span>
                            <span style={{ color: s.ok ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                                {s.ok ? '● ON' : '● OFF'}
                            </span>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: 16, fontSize: '0.65rem', color: '#475569', textAlign: 'center' }}>
                    v1.0.0 · RAG Architecture · EPAM Project
                </div>
            </div>
        </aside>
    );
}
