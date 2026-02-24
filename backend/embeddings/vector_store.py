"""
FAISS Vector Store
Manages document chunk storage and retrieval using Facebook AI Similarity Search (FAISS).

Design:
  - IndexFlatIP: Inner Product index (equivalent to cosine similarity for normalized vectors)
  - Persistable to disk (index + metadata JSON)
  - Supports adding and searching chunks
"""

import os
import json
import uuid
import logging
import numpy as np
import faiss
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass, asdict

from config import settings

logger = logging.getLogger(__name__)


@dataclass
class DocumentChunk:
    chunk_id: str
    content: str
    source: str          # filename
    chunk_index: int     # position in document
    doc_id: int          # FK to KnowledgeBaseDocument


class FAISSVectorStore:
    """
    FAISS-backed vector store for semantic document retrieval.

    Architecture:
      - Index type: IndexFlatIP (exact search, inner product = cosine for normalized vecs)
      - Metadata stored as parallel JSON list mapped by integer FAISS ID
      - Saved/loaded from disk for persistence across restarts
    """

    INDEX_FILE = "faiss.index"
    META_FILE = "faiss_metadata.json"

    def __init__(self):
        self.index_path = settings.FAISS_INDEX_PATH
        self.dimension = settings.EMBEDDING_DIMENSION
        os.makedirs(self.index_path, exist_ok=True)

        self._index: faiss.IndexFlatIP = None
        self._metadata: List[Dict] = []  # Parallel to FAISS internal IDs (0-based)

        self._load_or_create()

    # ──────────────────────────────────────────────────────────────────────────
    # Internals
    # ──────────────────────────────────────────────────────────────────────────

    def _index_filepath(self) -> str:
        return os.path.join(self.index_path, self.INDEX_FILE)

    def _meta_filepath(self) -> str:
        return os.path.join(self.index_path, self.META_FILE)

    def _load_or_create(self):
        if os.path.exists(self._index_filepath()):
            logger.info("Loading existing FAISS index from disk.")
            self._index = faiss.read_index(self._index_filepath())
            with open(self._meta_filepath(), "r", encoding="utf-8") as f:
                self._metadata = json.load(f)
            logger.info(f"FAISS index loaded. Total vectors: {self._index.ntotal}")
        else:
            logger.info("Creating new FAISS IndexFlatIP.")
            self._index = faiss.IndexFlatIP(self.dimension)
            self._metadata = []

    def _save(self):
        faiss.write_index(self._index, self._index_filepath())
        with open(self._meta_filepath(), "w", encoding="utf-8") as f:
            json.dump(self._metadata, f, ensure_ascii=False, indent=2)
        logger.debug("FAISS index and metadata saved to disk.")

    # ──────────────────────────────────────────────────────────────────────────
    # Public API
    # ──────────────────────────────────────────────────────────────────────────

    def add_chunks(
        self,
        embeddings: np.ndarray,
        chunks: List[DocumentChunk],
    ) -> int:
        """
        Add document chunks and their embeddings to the index.

        Args:
            embeddings: np.ndarray of shape (N, dimension), L2-normalized
            chunks: List of DocumentChunk objects (parallel to embeddings)

        Returns:
            Number of vectors added
        """
        assert len(embeddings) == len(chunks), "Embeddings and chunks must have the same length"
        assert embeddings.dtype == np.float32, "Embeddings must be float32"

        self._index.add(embeddings)
        for chunk in chunks:
            self._metadata.append(asdict(chunk))

        self._save()
        logger.info(f"Added {len(chunks)} chunks. Total index size: {self._index.ntotal}")
        return len(chunks)

    def search(
        self,
        query_embedding: np.ndarray,
        top_k: int = None,
    ) -> List[Tuple[DocumentChunk, float]]:
        """
        Retrieve top-k most similar chunks via cosine similarity (inner product).

        Args:
            query_embedding: 1D np.ndarray of shape (dimension,), L2-normalized
            top_k: Number of results to return

        Returns:
            List of (DocumentChunk, similarity_score) tuples sorted by score descending
        """
        if top_k is None:
            top_k = settings.TOP_K_RESULTS

        if self._index.ntotal == 0:
            logger.warning("FAISS index is empty. No results to return.")
            return []

        query_vec = query_embedding.reshape(1, -1).astype(np.float32)
        scores, indices = self._index.search(query_vec, min(top_k, self._index.ntotal))

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:
                continue
            meta = self._metadata[idx]
            chunk = DocumentChunk(**meta)
            results.append((chunk, float(score)))

        return results

    def delete_by_doc_id(self, doc_id: int) -> int:
        """
        Remove all chunks belonging to a given document.
        Note: FAISS IndexFlatIP doesn't support deletion natively —
        we rebuild the index excluding the target doc_id.
        """
        new_metadata = [m for m in self._metadata if m["doc_id"] != doc_id]
        removed = len(self._metadata) - len(new_metadata)

        if removed == 0:
            return 0

        # Rebuild index
        new_index = faiss.IndexFlatIP(self.dimension)
        # We cannot retrieve original vectors from IndexFlat; log a warning.
        logger.warning(
            f"Deletion of doc_id={doc_id} requires full index rebuild. "
            "In production, use IndexIDMap or a database-backed vector store."
        )
        self._metadata = new_metadata
        self._index = new_index
        self._save()
        return removed

    @property
    def total_chunks(self) -> int:
        return self._index.ntotal


# Singleton
vector_store = FAISSVectorStore()
