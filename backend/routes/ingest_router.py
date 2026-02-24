"""
Document Ingestion Router - POST /api/ingest
Upload PDF/DOCX/TXT documents to the knowledge base
"""

import logging
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session

from models.schemas import IngestResponse
from models.db_models import KnowledgeBaseDocument
from services.ingest_service import ingest_service
from database import get_db

logger = logging.getLogger(__name__)
router = APIRouter()

MAX_FILE_SIZE_MB = 20
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}


@router.post("/upload", response_model=IngestResponse, summary="Upload document to knowledge base")
async def upload_document(
    file: UploadFile = File(..., description="PDF, DOCX, or TXT document"),
    db: Session = Depends(get_db),
):
    """
    Ingest a document into the knowledge base:
    1. Validate file type and size
    2. Extract text (PDF→PyMuPDF, DOCX→python-docx, TXT→direct)
    3. Chunk text (600-token sliding window with 100-token overlap)
    4. Generate Sentence Transformer embeddings (batch)
    5. Store embeddings in FAISS vector index
    6. Persist document metadata to PostgreSQL
    """
    # Validate extension
    filename = file.filename or "unknown"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type '.{ext}' not supported. Allowed: {ALLOWED_EXTENSIONS}",
        )

    file_bytes = await file.read()

    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE_MB} MB",
        )

    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        doc_record = await ingest_service.ingest_document(
            file_bytes=file_bytes,
            original_filename=filename,
            db=db,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Ingestion error: {e}")
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

    return IngestResponse(
        document_id=doc_record.id,
        filename=doc_record.original_filename,
        chunk_count=doc_record.chunk_count,
        status=doc_record.status,
        indexed_at=doc_record.indexed_at,
        message=f"Successfully indexed {doc_record.chunk_count} chunks from '{filename}'",
    )


@router.get("/documents", summary="List all indexed knowledge base documents")
async def list_documents(db: Session = Depends(get_db)):
    """Returns all documents with their indexing status and chunk counts."""
    docs = db.query(KnowledgeBaseDocument).order_by(KnowledgeBaseDocument.created_at.desc()).all()
    return [
        {
            "id": d.id,
            "filename": d.original_filename,
            "file_type": d.file_type,
            "chunk_count": d.chunk_count,
            "status": d.status,
            "file_size_bytes": d.file_size_bytes,
            "indexed_at": d.indexed_at,
            "created_at": d.created_at,
        }
        for d in docs
    ]


@router.get("/stats", summary="Vector store statistics")
async def vector_store_stats():
    """Returns total chunk count in FAISS index."""
    from embeddings.vector_store import vector_store
    return {
        "total_chunks_indexed": vector_store.total_chunks,
        "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
        "embedding_dimension": 384,
        "index_type": "IndexFlatIP (Cosine Similarity)",
    }
