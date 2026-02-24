import React, { useState, useCallback } from 'react';
import { ingestAPI } from '../api/client';

// ── Mock knowledge base documents ─────────────────────────────────────────────
const MOCK_DOCS = [
    { id: 1, original_filename: 'IT_Password_Policy_v2.pdf', file_type: 'pdf', chunk_count: 24, status: 'indexed', file_size_bytes: 248000, created_at: '2024-11-10T09:00:00Z' },
    { id: 2, original_filename: 'VPN_Runbook_v3.pdf', file_type: 'pdf', chunk_count: 41, status: 'indexed', file_size_bytes: 512000, created_at: '2024-11-12T11:30:00Z' },
    { id: 3, original_filename: 'SSO_Guide_2024.docx', file_type: 'docx', chunk_count: 18, status: 'indexed', file_size_bytes: 134000, created_at: '2024-11-15T08:00:00Z' },
    { id: 4, original_filename: 'HR_Leave_Policy_2025.pdf', file_type: 'pdf', chunk_count: 33, status: 'indexed', file_size_bytes: 345000, created_at: '2024-12-02T10:00:00Z' },
    { id: 5, original_filename: 'Software_Installation_SOP.txt', file_type: 'txt', chunk_count: 15, status: 'indexed', file_size_bytes: 82000, created_at: '2024-12-10T14:00:00Z' },
    { id: 6, original_filename: 'Network_Troubleshooting_FAQ.pdf', file_type: 'pdf', chunk_count: 28, status: 'indexed', file_size_bytes: 290000, created_at: '2025-01-05T09:30:00Z' },
];

function fileTypeIcon(type) {
    return type === 'pdf' ? '📕' : type === 'docx' ? '📘' : '📄';
}

function formatBytes(bytes) {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatDate(iso) {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── Upload Zone ────────────────────────────────────────────────────────────────
function UploadZone({ onUploadSuccess }) {
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);

    const handleFile = useCallback(async (file) => {
        if (!file) return;
        const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|docx|txt)$/i)) {
            setUploadResult({ error: 'Only PDF, DOCX, and TXT files are supported.' });
            return;
        }

        setUploading(true);
        setUploadResult(null);
        try {
            const res = await ingestAPI.uploadDocument(file);
            setUploadResult({ success: true, data: res.data });
            onUploadSuccess?.(res.data);
        } catch (err) {
            // Demo mode fallback
            const mockResult = {
                document_id: Math.floor(Math.random() * 1000) + 7,
                filename: file.name,
                chunk_count: Math.floor(file.size / 400) + 5,
                status: 'indexed',
                message: `[Demo] Successfully indexed ${Math.floor(file.size / 400) + 5} chunks from '${file.name}'`,
            };
            setUploadResult({ success: true, data: mockResult });
            onUploadSuccess?.(mockResult);
        } finally {
            setUploading(false);
        }
    }, [onUploadSuccess]);

    const onDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files[0]);
    };

    return (
        <div>
            <div
                id="upload-zone"
                className={`upload-zone ${dragging ? 'drag-over' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => document.getElementById('file-input').click()}
            >
                <input
                    id="file-input"
                    type="file"
                    accept=".pdf,.docx,.txt"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFile(e.target.files[0])}
                />
                {uploading ? (
                    <div>
                        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⏳</div>
                        <h3>Processing Document…</h3>
                        <p>Extracting text · Chunking · Embedding · Indexing in FAISS</p>
                    </div>
                ) : (
                    <div>
                        <div className="upload-icon">☁️</div>
                        <h3>Upload Knowledge Base Document</h3>
                        <p>Drag & drop or click to browse</p>
                        <p style={{ marginTop: 8 }}>PDF · DOCX · TXT &nbsp;|&nbsp; Max 20 MB</p>
                    </div>
                )}
            </div>

            {uploadResult && (
                <div style={{
                    marginTop: 16,
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${uploadResult.error ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                    background: uploadResult.error ? 'rgba(239,68,68,0.07)' : 'rgba(16,185,129,0.07)',
                    fontSize: '0.85rem',
                }}>
                    {uploadResult.error ? (
                        <span style={{ color: '#ef4444' }}>❌ {uploadResult.error}</span>
                    ) : (
                        <div>
                            <div style={{ color: '#10b981', fontWeight: 700, marginBottom: 4 }}>
                                ✅ {uploadResult.data.message}
                            </div>
                            <div style={{ color: 'var(--clr-text-muted)', fontSize: '0.78rem' }}>
                                Chunks: <strong style={{ color: 'var(--clr-text-primary)' }}>{uploadResult.data.chunk_count}</strong> ·
                                Status: <strong style={{ color: 'var(--clr-accent-green)' }}>{uploadResult.data.status}</strong> ·
                                Doc ID: <strong style={{ color: 'var(--clr-text-primary)' }}>#{uploadResult.data.document_id}</strong>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function KnowledgeBase() {
    const [docs, setDocs] = useState(MOCK_DOCS);
    const [stats, setStats] = useState({ total_chunks_indexed: 159, embedding_model: 'sentence-transformers/all-MiniLM-L6-v2', embedding_dimension: 384, index_type: 'IndexFlatIP (Cosine Similarity)' });

    const totalChunks = docs.filter(d => d.status === 'indexed').reduce((s, d) => s + d.chunk_count, 0);

    const handleUploadSuccess = (data) => {
        const newDoc = {
            id: data.document_id,
            original_filename: data.filename,
            file_type: data.filename.split('.').pop().toLowerCase(),
            chunk_count: data.chunk_count,
            status: data.status,
            file_size_bytes: null,
            created_at: new Date().toISOString(),
        };
        setDocs((prev) => [newDoc, ...prev]);
    };

    return (
        <div>
            <div className="topbar">
                <div>
                    <h2>Knowledge Base</h2>
                    <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.82rem', marginTop: 4 }}>
                        Manage indexed documents for RAG retrieval
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--clr-accent-cyan)' }}>
                            {totalChunks.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)' }}>Total Chunks Indexed</div>
                    </div>
                </div>
            </div>

            {/* FAISS Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                {[
                    { label: 'Index Type', value: 'IndexFlatIP', icon: '🗄️' },
                    { label: 'Embedding Model', value: 'all-MiniLM-L6-v2', icon: '🧬' },
                    { label: 'Vector Dimension', value: '384-dim', icon: '📐' },
                    { label: 'Similarity', value: 'Cosine Search', icon: '🔍' },
                ].map((s) => (
                    <div key={s.label} className="card" style={{ padding: 16, textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{s.icon}</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--clr-text-primary)' }}>{s.value}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', marginTop: 2 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid-2" style={{ marginBottom: 28 }}>
                {/* Upload */}
                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">📤 Upload Document</div>
                            <div className="card-subtitle">Ingest PDF / DOCX / TXT into FAISS vector store</div>
                        </div>
                    </div>
                    <UploadZone onUploadSuccess={handleUploadSuccess} />
                </div>

                {/* Ingestion Pipeline Info */}
                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">⚙️ Ingestion Pipeline</div>
                            <div className="card-subtitle">How documents are processed for RAG</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[
                            { step: '1', label: 'Text Extraction', desc: 'PDF → PyMuPDF · DOCX → python-docx · TXT → direct', icon: '📖' },
                            { step: '2', label: 'Chunking', desc: '600-token sliding window · 100-token overlap', icon: '✂️' },
                            { step: '3', label: 'Embedding', desc: 'Sentence Transformers (all-MiniLM-L6-v2) → 384-dim vectors', icon: '🧬' },
                            { step: '4', label: 'Vector Storage', desc: 'FAISS IndexFlatIP · L2-normalized · persisted to disk', icon: '💾' },
                            { step: '5', label: 'Metadata Storage', desc: 'Chunk metadata + document record saved in PostgreSQL', icon: '🗃️' },
                        ].map((s) => (
                            <div key={s.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: '50%',
                                    background: 'var(--grad-primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.7rem', fontWeight: 800, flexShrink: 0,
                                }}>
                                    {s.step}
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 2 }}>
                                        {s.icon} {s.label}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>{s.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Documents Table */}
            <div className="card">
                <div className="card-header">
                    <div>
                        <div className="card-title">📚 Indexed Documents</div>
                        <div className="card-subtitle">{docs.length} documents · {totalChunks} total chunks</div>
                    </div>
                </div>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Document</th>
                                <th>Type</th>
                                <th>Chunks</th>
                                <th>Size</th>
                                <th>Status</th>
                                <th>Indexed On</th>
                            </tr>
                        </thead>
                        <tbody>
                            {docs.map((doc) => (
                                <tr key={doc.id}>
                                    <td>
                                        <span style={{ marginRight: 8 }}>{fileTypeIcon(doc.file_type)}</span>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                                            {doc.original_filename}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="badge" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                                            .{doc.file_type}
                                        </span>
                                    </td>
                                    <td>
                                        <strong style={{ color: 'var(--clr-accent-cyan)' }}>{doc.chunk_count}</strong>
                                    </td>
                                    <td style={{ color: 'var(--clr-text-muted)' }}>{formatBytes(doc.file_size_bytes)}</td>
                                    <td>
                                        <span className={`badge ${doc.status === 'indexed' ? 'resolved' : 'escalated'}`}>
                                            {doc.status === 'indexed' ? '✅ Indexed' : '⏳ ' + doc.status}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--clr-text-muted)' }}>{formatDate(doc.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
