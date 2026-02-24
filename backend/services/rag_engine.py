"""
RAG (Retrieval-Augmented Generation) Engine
Core pipeline that powers the AI support assistant.

Pipeline:
  1. Receive user query
  2. Generate query embedding (Sentence Transformers)
  3. Cosine similarity search in FAISS vector store (top-k chunks)
  4. Compute confidence score from retrieved similarities
  5. If confidence < threshold → escalate
  6. Otherwise → build context-augmented prompt → call LLM → return answer
"""

import time
import uuid
import logging
from typing import List, Tuple, Optional

from embeddings.embedding_service import embedding_service
from embeddings.vector_store import vector_store, DocumentChunk
from services.llm_service import LLMService
from models.schemas import QueryResponse, RetrievedChunk
from config import settings

logger = logging.getLogger(__name__)


class RAGEngine:
    """
    Retrieval-Augmented Generation Engine.

    Confidence scoring:
      - Mean of top-k cosine similarity scores (0.0 – 1.0 range for normalized vectors)
      - Threshold from config: CONFIDENCE_THRESHOLD (default 0.65)
      - Below threshold → smart escalation path
    """

    def __init__(self):
        self.llm = LLMService()
        self.top_k = settings.TOP_K_RESULTS
        self.confidence_threshold = settings.CONFIDENCE_THRESHOLD

    def _compute_confidence(self, scores: List[float]) -> float:
        """
        Aggregate top-k similarity scores into a single confidence measure.
        Uses weighted mean: higher-ranked results contribute more.
        """
        if not scores:
            return 0.0
        weights = [1 / (i + 1) for i in range(len(scores))]
        weighted_sum = sum(s * w for s, w in zip(scores, weights))
        return round(weighted_sum / sum(weights), 4)

    def _build_prompt(self, query: str, context_chunks: List[DocumentChunk]) -> str:
        """
        Construct the RAG prompt with retrieved context blocks.
        """
        context_text = "\n\n---\n\n".join(
            [f"[Source: {c.source}]\n{c.content}" for c in context_chunks]
        )
        return f"""You are an expert enterprise IT support assistant.
Use ONLY the following retrieved knowledge base context to answer the support query.
If the context does not contain enough information, say: "I need to escalate this to a human agent."

=== RETRIEVED CONTEXT ===
{context_text}

=== USER QUERY ===
{query}

=== RESPONSE ===
Provide a clear, concise, and technically accurate answer. If steps are needed, use numbered format."""

    async def query(
        self,
        user_query: str,
        session_id: Optional[str] = None,
    ) -> QueryResponse:
        """
        Execute the full RAG pipeline for a user query.

        Returns:
            QueryResponse with answer, confidence, retrieved chunks, escalation flag
        """
        start_time = time.time()
        session_id = session_id or str(uuid.uuid4())

        logger.info(f"[Session {session_id}] Processing query: {user_query[:100]}...")

        # ── Step 1: Embed query ───────────────────────────────────────────────
        query_embedding = embedding_service.encode(user_query).astype("float32")

        # ── Step 2: Vector search ─────────────────────────────────────────────
        search_results: List[Tuple[DocumentChunk, float]] = vector_store.search(
            query_embedding, top_k=self.top_k
        )

        # ── Step 3: Confidence scoring ────────────────────────────────────────
        scores = [score for _, score in search_results]
        confidence = self._compute_confidence(scores)

        retrieved_chunks_response = [
            RetrievedChunk(
                content=chunk.content,
                source=chunk.source,
                similarity_score=round(score, 4),
                chunk_id=chunk.chunk_id,
            )
            for chunk, score in search_results
        ]

        is_escalated = confidence < self.confidence_threshold or len(search_results) == 0

        # ── Step 4: LLM Generation or Escalation ─────────────────────────────
        if is_escalated:
            logger.warning(
                f"[Session {session_id}] Escalating: confidence={confidence:.4f} < threshold={self.confidence_threshold}"
            )
            answer = (
                "I was unable to find a confident answer in the knowledge base. "
                "This query has been escalated to a human support agent who will respond shortly. "
                f"(Confidence score: {confidence:.2f})"
            )
        else:
            context_chunks = [chunk for chunk, _ in search_results]
            prompt = self._build_prompt(user_query, context_chunks)
            answer = await self.llm.generate(prompt)

        elapsed = round(time.time() - start_time, 3)
        logger.info(f"[Session {session_id}] Completed in {elapsed}s | Confidence: {confidence}")

        return QueryResponse(
            query=user_query,
            answer=answer,
            confidence_score=confidence,
            retrieved_chunks=retrieved_chunks_response,
            is_escalated=is_escalated,
            ticket_ref=f"TKT-{session_id[:8].upper()}" if is_escalated else None,
            response_time_seconds=elapsed,
            session_id=session_id,
        )


# Singleton
rag_engine = RAGEngine()
