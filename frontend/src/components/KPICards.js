import React, { useEffect, useState } from 'react';
import { analyticsAPI } from '../api/client';

const MOCK_KPIS = [
    {
        label: 'Auto Resolution Rate',
        value: '28%',
        raw: 28,
        desc: 'Tickets resolved without human intervention',
        trend: 'up',
        color: 'green',
        icon: '⚡',
    },
    {
        label: 'Response Time Reduction',
        value: '94.4%',
        raw: 94.4,
        desc: 'vs 6-min manual baseline (avg bot: ~20s)',
        trend: 'up',
        color: 'green',
        icon: '🚀',
    },
    {
        label: 'Total Tickets',
        value: '1,000',
        raw: 1000,
        desc: '280 bot-resolved · 720 escalated or open',
        trend: 'neutral',
        color: 'default',
        icon: '🎫',
    },
    {
        label: 'Avg Confidence Score',
        value: '0.73',
        raw: 0.73,
        desc: 'Mean RAG retrieval cosine similarity (0–1)',
        trend: 'up',
        color: 'purple',
        icon: '🧠',
    },
    {
        label: 'Escalation Rate',
        value: '40%',
        raw: 40,
        desc: 'Queries routed to human agents',
        trend: 'down',
        color: 'orange',
        icon: '⚠️',
    },
];

export default function KPICards() {
    const [kpis, setKpis] = useState(MOCK_KPIS);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchKpis = async () => {
            setLoading(true);
            try {
                const res = await analyticsAPI.getKPISummary();
                if (res.data?.kpis?.length) {
                    const mapped = res.data.kpis.map((k, i) => ({
                        ...MOCK_KPIS[i],
                        value: k.value,
                        desc: k.description,
                        trend: k.trend,
                    }));
                    setKpis(mapped);
                }
            } catch {
                // Use mock data if API unavailable (demo mode)
            } finally {
                setLoading(false);
            }
        };
        fetchKpis();
    }, []);

    return (
        <div className="kpi-grid">
            {kpis.map((kpi) => (
                <div key={kpi.label} className={`kpi-card ${kpi.color}`} id={`kpi-${kpi.label.toLowerCase().replace(/\s+/g, '-')}`}>
                    <div style={{ fontSize: '1.6rem', marginBottom: 10 }}>{kpi.icon}</div>
                    <div className="kpi-label">{kpi.label}</div>
                    <div className="kpi-value">{kpi.value}</div>
                    <div className="kpi-desc">{kpi.desc}</div>
                    {kpi.trend !== 'neutral' && (
                        <div className={`kpi-trend ${kpi.trend}`}>
                            {kpi.trend === 'up' ? '↑ Improved' : '↓ Monitor'}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
