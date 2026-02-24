"""
Ticket Management Router - /api/tickets
CRUD operations for support tickets with escalation management
"""

import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime

from models.db_models import SupportTicket, TicketStatus, TicketPriority
from models.schemas import TicketResponse, TicketUpdate, FeedbackCreate
from database import get_db

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=List[TicketResponse], summary="List all support tickets")
async def list_tickets(
    status: Optional[TicketStatus] = None,
    priority: Optional[TicketPriority] = None,
    is_escalated: Optional[bool] = None,
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(SupportTicket)
    if status:
        query = query.filter(SupportTicket.status == status)
    if priority:
        query = query.filter(SupportTicket.priority == priority)
    if is_escalated is not None:
        query = query.filter(SupportTicket.is_escalated == is_escalated)
    return query.order_by(SupportTicket.created_at.desc()).offset(offset).limit(limit).all()


@router.get("/{ticket_ref}", response_model=TicketResponse, summary="Get ticket by reference")
async def get_ticket(ticket_ref: str, db: Session = Depends(get_db)):
    ticket = db.query(SupportTicket).filter(SupportTicket.ticket_ref == ticket_ref).first()
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket '{ticket_ref}' not found")
    return ticket


@router.patch("/{ticket_id}", response_model=TicketResponse, summary="Update ticket status / assignment")
async def update_ticket(
    ticket_id: int,
    update: TicketUpdate,
    db: Session = Depends(get_db),
):
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if update.status:
        ticket.status = update.status
        if update.status in (TicketStatus.BOT_RESOLVED, TicketStatus.CLOSED):
            ticket.resolved_at = datetime.utcnow()
    if update.priority:
        ticket.priority = update.priority
    if update.assigned_agent_id is not None:
        ticket.assigned_agent_id = update.assigned_agent_id

    ticket.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(ticket)
    return ticket


@router.post("/feedback", summary="Submit CSAT feedback for a ticket")
async def submit_feedback(feedback: FeedbackCreate, db: Session = Depends(get_db)):
    from models.db_models import TicketFeedback
    ticket = db.query(SupportTicket).filter(SupportTicket.id == feedback.ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    existing = db.query(TicketFeedback).filter(TicketFeedback.ticket_id == feedback.ticket_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Feedback already submitted for this ticket")

    fb = TicketFeedback(
        ticket_id=feedback.ticket_id,
        rating=feedback.rating,
        comment=feedback.comment,
    )
    db.add(fb)
    db.commit()
    return {"message": "Feedback recorded", "rating": feedback.rating}


@router.get("/escalated/pending", summary="List all pending escalated tickets")
async def get_escalated_tickets(db: Session = Depends(get_db)):
    tickets = (
        db.query(SupportTicket)
        .filter(
            SupportTicket.is_escalated == True,
            SupportTicket.status == TicketStatus.ESCALATED,
        )
        .order_by(SupportTicket.created_at.asc())
        .all()
    )
    return {"count": len(tickets), "tickets": tickets}
