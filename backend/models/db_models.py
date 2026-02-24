"""
Database Models using SQLAlchemy ORM
PostgreSQL schema for tickets, users, and analytics
"""

from sqlalchemy import (
    Column, Integer, String, Float, Boolean,
    DateTime, Text, Enum as SAEnum, ForeignKey
)
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import enum

Base = declarative_base()


class TicketStatus(str, enum.Enum):
    OPEN = "open"
    BOT_RESOLVED = "bot_resolved"
    ESCALATED = "escalated"
    CLOSED = "closed"


class TicketPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    AGENT = "agent"
    VIEWER = "viewer"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.VIEWER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    tickets = relationship("SupportTicket", back_populates="assigned_agent")


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_ref = Column(String(20), unique=True, nullable=False)
    user_query = Column(Text, nullable=False)
    bot_response = Column(Text, nullable=True)
    confidence_score = Column(Float, nullable=True)
    status = Column(SAEnum(TicketStatus), default=TicketStatus.OPEN)
    priority = Column(SAEnum(TicketPriority), default=TicketPriority.MEDIUM)
    category = Column(String(100), nullable=True)
    response_time_seconds = Column(Float, nullable=True)
    escalation_reason = Column(Text, nullable=True)
    is_escalated = Column(Boolean, default=False)
    assigned_agent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    assigned_agent = relationship("User", back_populates="tickets")
    feedback = relationship("TicketFeedback", back_populates="ticket", uselist=False)


class TicketFeedback(Base):
    __tablename__ = "ticket_feedback"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("support_tickets.id"), unique=True)
    rating = Column(Integer)  # 1-5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("SupportTicket", back_populates="feedback")


class KnowledgeBaseDocument(Base):
    __tablename__ = "knowledge_base_documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_type = Column(String(20), nullable=False)  # pdf, docx, txt
    chunk_count = Column(Integer, default=0)
    status = Column(String(50), default="processing")  # processing, indexed, failed
    file_size_bytes = Column(Integer, nullable=True)
    uploaded_by = Column(String(100), nullable=True)
    indexed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AnalyticsSnapshot(Base):
    __tablename__ = "analytics_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    snapshot_date = Column(DateTime, default=datetime.utcnow)
    total_tickets = Column(Integer, default=0)
    bot_resolved = Column(Integer, default=0)
    escalated = Column(Integer, default=0)
    avg_response_time_sec = Column(Float, default=0.0)
    avg_confidence_score = Column(Float, default=0.0)
    resolution_rate = Column(Float, default=0.0)
