"""
RAG Query Router - POST /api/query
Processes user support queries through the full RAG pipeline
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from models.schemas import QueryRequest, QueryResponse
from models.db_models import SupportTicket, TicketStatus
from services.rag_engine import rag_engine
from database import get_db

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/", response_model=QueryResponse, summary="Process a support query via RAG")
async def process_query(request: QueryRequest, db: Session = Depends(get_db)):
    """
    Execute the RAG pipeline:
    1. Embed user query
    2. Retrieve top-k relevant KB chunks via FAISS cosine similarity
    3. Compute confidence score
    4. Generate LLM response OR escalate if confidence < threshold
    5. Persist ticket to PostgreSQL
    """
    try:
        result = await rag_engine.query(
            user_query=request.query,
            session_id=request.session_id,
        )

        # Persist to DB
        ticket_ref = result.ticket_ref or f"TKT-{result.session_id[:8].upper()}"
        status = TicketStatus.ESCALATED if result.is_escalated else TicketStatus.BOT_RESOLVED

        ticket = SupportTicket(
            ticket_ref=ticket_ref,
            user_query=request.query,
            bot_response=result.answer,
            confidence_score=result.confidence_score,
            status=status,
            category=request.category,
            response_time_seconds=result.response_time_seconds,
            is_escalated=result.is_escalated,
            escalation_reason=(
                f"Confidence score {result.confidence_score:.4f} below threshold"
                if result.is_escalated else None
            ),
            resolved_at=datetime.utcnow() if not result.is_escalated else None,
        )
        db.add(ticket)
        db.commit()

        logger.info(f"Query processed: {ticket_ref} | Escalated: {result.is_escalated}")
        return result

    except Exception as e:
        logger.error(f"Query processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Query processing error: {str(e)}")
