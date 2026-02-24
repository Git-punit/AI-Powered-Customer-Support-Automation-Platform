"""
Pydantic Schemas for request/response validation
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from models.db_models import TicketStatus, TicketPriority, UserRole


# ─── Auth ────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    role: UserRole = UserRole.VIEWER


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Query / RAG ─────────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    query: str = Field(..., min_length=5, max_length=2000, description="User's support query")
    session_id: Optional[str] = None
    user_email: Optional[str] = None
    category: Optional[str] = None


class RetrievedChunk(BaseModel):
    content: str
    source: str
    similarity_score: float
    chunk_id: str


class QueryResponse(BaseModel):
    query: str
    answer: str
    confidence_score: float
    retrieved_chunks: List[RetrievedChunk]
    is_escalated: bool
    ticket_ref: Optional[str] = None
    response_time_seconds: float
    session_id: str


# ─── Ingest ───────────────────────────────────────────────────────────────────

class IngestResponse(BaseModel):
    document_id: int
    filename: str
    chunk_count: int
    status: str
    indexed_at: Optional[datetime]
    message: str


# ─── Tickets ─────────────────────────────────────────────────────────────────

class TicketCreate(BaseModel):
    user_query: str
    category: Optional[str] = None
    priority: TicketPriority = TicketPriority.MEDIUM


class TicketUpdate(BaseModel):
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    assigned_agent_id: Optional[int] = None


class TicketResponse(BaseModel):
    id: int
    ticket_ref: str
    user_query: str
    bot_response: Optional[str]
    confidence_score: Optional[float]
    status: TicketStatus
    priority: TicketPriority
    category: Optional[str]
    is_escalated: bool
    response_time_seconds: Optional[float]
    escalation_reason: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FeedbackCreate(BaseModel):
    ticket_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


# ─── Analytics ────────────────────────────────────────────────────────────────

class AnalyticsOverview(BaseModel):
    total_tickets: int
    bot_resolved: int
    escalated: int
    open_tickets: int
    auto_resolution_rate: float          # % resolved by bot
    avg_response_time_sec: float
    avg_confidence_score: float
    escalation_rate: float
    response_time_reduction_pct: float   # vs. manual baseline (360s)


class DailyStats(BaseModel):
    date: str
    total: int
    resolved: int
    escalated: int
    avg_confidence: float


class CategoryBreakdown(BaseModel):
    category: str
    count: int
    resolution_rate: float
