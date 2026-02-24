import React, { useState, useRef, useEffect } from 'react';
import { queryAPI } from '../api/client';

// ── Mock demo responses when backend is offline ────────────────────────────────
const DEMO_RESPONSES = {
    default: {
        answer: `To reset your enterprise account password:\n\n1. Navigate to the SSO portal at **https://sso.enterprise.com**\n2. Click **"Forgot Password"**\n3. Enter your registered corporate email\n4. Check your inbox for the reset link (valid 15 minutes)\n5. Set a new password meeting policy: min 12 chars, 1 uppercase, 1 number, 1 symbol\n\nIf the issue persists after 3 attempts, contact the IT Helpdesk at **ext. 4000** or **helpdesk@enterprise.com** with your employee ID.`,
        confidence_score: 0.87,
        is_escalated: false,
        response_time_seconds: 0.42,
        retrieved_chunks: [
            { source: 'IT_Password_Policy_v2.pdf', similarity_score: 0.91, content: 'Password reset procedures...', chunk_id: 'c1' },
            { source: 'SSO_Guide_2024.docx', similarity_score: 0.84, content: 'SSO portal access guide...', chunk_id: 'c2' },
        ],
    },
    vpn: {
        answer: `**VPN Connection Troubleshooting:**\n\n1. Ensure **GlobalProtect v5.3+** is installed\n2. Open GlobalProtect → Enter your AD credentials\n3. If connection fails: verify **UDP port 4501** is unblocked\n4. For MFA issues: sync your authenticator app to NTP\n5. Restart GlobalProtect service: \`services.msc → GlobalProtect → Restart\`\n\n**Network Ops Hotline:** +1-800-VPN-HELP\n**Email:** network-ops@enterprise.com`,
        confidence_score: 0.82,
        is_escalated: false,
        response_time_seconds: 0.38,
        retrieved_chunks: [
            { source: 'VPN_Runbook_v3.pdf', similarity_score: 0.88, content: 'VPN troubleshooting steps...', chunk_id: 'c3' },
        ],
    },
    unknown: {
        answer: `I was unable to find a confident answer in the knowledge base for this query. This ticket has been **escalated to a human support agent** who will respond within 4 hours per SLA.\n\n**Ticket Reference:** TKT-A3F8D21B\n**Priority:** Medium\n**SLA:** ITPOL-2024-007 — 4-hour resolution window\n\nYou will receive an email confirmation shortly.`,
        confidence_score: 0.31,
        is_escalated: true,
        response_time_seconds: 0.21,
        retrieved_chunks: [],
    },
};

function getDemoResponse(query) {
    const q = query.toLowerCase();
    if (q.includes('vpn') || q.includes('network')) return DEMO_RESPONSES.vpn;
    if (q.includes('password') || q.includes('login') || q.includes('reset') || q.includes('account')) return DEMO_RESPONSES.default;
    return DEMO_RESPONSES.unknown;
}

// ── TypingIndicator ────────────────────────────────────────────────────────────
function TypingIndicator() {
    return (
        <div className="chat-message">
            <div className="msg-avatar bot">🤖</div>
            <div className="msg-bubble bot" style={{ padding: '16px 20px' }}>
                <div className="typing-indicator">
                    <span /><span /><span />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', marginTop: 6 }}>
                    Searching knowledge base & generating response…
                </div>
            </div>
        </div>
    );
}

// ── Sources Panel ──────────────────────────────────────────────────────────────
function SourcesPanel({ chunks }) {
    const [open, setOpen] = useState(false);
    if (!chunks || chunks.length === 0) return null;

    return (
        <div className="sources-section">
            <button className="sources-toggle" onClick={() => setOpen(!open)}>
                {open ? '▼' : '▶'} {chunks.length} source chunk{chunks.length !== 1 ? 's' : ''} retrieved
            </button>
            {open && (
                <div className="sources-list">
                    {chunks.map((c, i) => (
                        <div key={c.chunk_id || i} className="source-item">
                            <div className="source-name">📄 {c.source}</div>
                            <div className="source-score">
                                Similarity: <strong style={{ color: 'var(--clr-accent-green)' }}>
                                    {(c.similarity_score * 100).toFixed(1)}%
                                </strong>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Message Bubble ─────────────────────────────────────────────────────────────
function Message({ msg }) {
    const isUser = msg.role === 'user';
    const confidence = msg.confidence_score;
    const confClass = confidence >= 0.75 ? 'high' : confidence >= 0.55 ? 'medium' : 'low';

    const formatAnswer = (text) =>
        text.split('\n').map((line, i) => {
            const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            const mono = bold.replace(/`(.*?)`/g, '<code style="font-family:var(--font-mono);background:rgba(0,0,0,0.3);padding:1px 5px;border-radius:3px;font-size:0.85em">$1</code>');
            return <div key={i} dangerouslySetInnerHTML={{ __html: mono || '&nbsp;' }} />;
        });

    return (
        <div className={`chat-message ${isUser ? 'user' : ''}`}>
            <div className={`msg-avatar ${isUser ? 'user' : 'bot'}`}>
                {isUser ? '👤' : '🤖'}
            </div>
            <div>
                <div className={`msg-bubble ${isUser ? 'user' : 'bot'} ${msg.is_escalated ? 'escalated' : ''}`}>
                    {isUser ? msg.content : (
                        <div style={{ lineHeight: 1.7 }}>{formatAnswer(msg.content)}</div>
                    )}
                </div>

                {!isUser && (
                    <div className="msg-meta">
                        <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                        {confidence !== undefined && (
                            <span className={`confidence-pill ${confClass}`}>
                                Confidence: {(confidence * 100).toFixed(0)}%
                            </span>
                        )}
                        {msg.response_time !== undefined && (
                            <span>⚡ {msg.response_time}s</span>
                        )}
                        {msg.is_escalated && (
                            <span style={{ color: 'var(--clr-accent-orange)', fontWeight: 600 }}>
                                🔺 Escalated to human agent
                            </span>
                        )}
                    </div>
                )}

                {!isUser && msg.chunks && <SourcesPanel chunks={msg.chunks} />}
            </div>
        </div>
    );
}

// ── Suggested Queries ──────────────────────────────────────────────────────────
const SUGGESTIONS = [
    'How do I reset my corporate password?',
    'VPN connection is failing, how to fix?',
    'How to set up Outlook for new employees?',
    'What is the leave application process?',
];

// ── Main Chat Component ────────────────────────────────────────────────────────
export default function ChatInterface() {
    const [messages, setMessages] = useState([
        {
            id: 'welcome',
            role: 'bot',
            content: `Hello! I'm your **Enterprise AI Support Assistant**, powered by Retrieval-Augmented Generation (RAG).\n\nI can help with:\n• Password & account issues\n• VPN & network troubleshooting\n• Software installation & access\n• HR policies & leave requests\n• IT infrastructure questions\n\nAsk me anything from the knowledge base!`,
            timestamp: new Date().toISOString(),
            confidence_score: 1,
            response_time: 0,
            is_escalated: false,
            chunks: [],
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId] = useState(() => `sess-${Date.now()}`);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const sendMessage = async (queryText) => {
        const text = (queryText || input).trim();
        if (!text || loading) return;
        setInput('');

        const userMsg = {
            id: `u-${Date.now()}`,
            role: 'user',
            content: text,
            timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setLoading(true);

        try {
            const res = await queryAPI.ask(text, sessionId);
            const data = res.data;
            setMessages((prev) => [
                ...prev,
                {
                    id: `b-${Date.now()}`,
                    role: 'bot',
                    content: data.answer,
                    timestamp: new Date().toISOString(),
                    confidence_score: data.confidence_score,
                    response_time: data.response_time_seconds,
                    is_escalated: data.is_escalated,
                    chunks: data.retrieved_chunks,
                },
            ]);
        } catch {
            // Demo mode fallback
            await new Promise((r) => setTimeout(r, 900));
            const demo = getDemoResponse(text);
            setMessages((prev) => [
                ...prev,
                {
                    id: `b-${Date.now()}`,
                    role: 'bot',
                    content: demo.answer,
                    timestamp: new Date().toISOString(),
                    confidence_score: demo.confidence_score,
                    response_time: demo.response_time_seconds,
                    is_escalated: demo.is_escalated,
                    chunks: demo.retrieved_chunks,
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div>
            <div className="topbar">
                <div>
                    <h2>AI Support Assistant</h2>
                    <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.82rem', marginTop: 4 }}>
                        RAG-powered · Semantic Search · Auto-escalation
                    </p>
                </div>
                <div className="status-badge online">
                    <span className="dot" /> System Online
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* RAG Pipeline Banner */}
                <div style={{
                    background: 'rgba(59,130,246,0.06)',
                    borderBottom: '1px solid var(--clr-border)',
                    padding: '10px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: '0.75rem',
                    color: 'var(--clr-text-muted)',
                    flexWrap: 'wrap',
                }}>
                    <span style={{ color: 'var(--clr-accent-cyan)', fontWeight: 700 }}>RAG Pipeline:</span>
                    {['Query Embedding', 'FAISS Vector Search', 'Top-K Retrieval', 'Confidence Scoring', 'LLM Generation'].map((step, i, arr) => (
                        <React.Fragment key={step}>
                            <span>{step}</span>
                            {i < arr.length - 1 && <span style={{ color: 'var(--clr-accent-blue)' }}>→</span>}
                        </React.Fragment>
                    ))}
                </div>

                {/* Messages */}
                <div className="chat-messages" style={{ padding: '24px', height: 480 }}>
                    {messages.map((msg) => <Message key={msg.id} msg={msg} />)}
                    {loading && <TypingIndicator />}
                    <div ref={bottomRef} />
                </div>

                {/* Suggestions */}
                {messages.length <= 1 && (
                    <div style={{
                        padding: '0 24px 16px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 8,
                    }}>
                        {SUGGESTIONS.map((s) => (
                            <button
                                key={s}
                                className="btn btn-outline btn-sm"
                                onClick={() => sendMessage(s)}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input */}
                <div className="chat-input-area" style={{ padding: '16px 24px 24px' }}>
                    <textarea
                        id="chat-input"
                        className="chat-input"
                        rows={2}
                        placeholder="Ask a support question… (Enter to send, Shift+Enter for new line)"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                    />
                    <button
                        id="chat-send-btn"
                        className="btn btn-primary"
                        onClick={() => sendMessage()}
                        disabled={loading || !input.trim()}
                        style={{ alignSelf: 'flex-end', padding: '14px 20px' }}
                    >
                        {loading ? '⏳' : '➤'}
                    </button>
                </div>
            </div>
        </div>
    );
}
