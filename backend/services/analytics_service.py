"""
Analytics Service
Computes real-time KPIs from the support tickets database.
Metrics used in project documentation and Power BI dashboard.
"""

import logging
from datetime import datetime, timedelta
from typing import List

from sqlalchemy.orm import Session
from sqlalchemy import func, case

from models.db_models import SupportTicket, TicketStatus
from models.schemas import AnalyticsOverview, DailyStats, CategoryBreakdown

logger = logging.getLogger(__name__)

MANUAL_RESOLUTION_SECONDS = 360.0  # 6-minute baseline for human agent resolution


class AnalyticsService:

    def get_overview(self, db: Session) -> AnalyticsOverview:
        """
        Compute top-level KPIs:
          - Total tickets
          - Bot resolved vs escalated
          - Auto resolution rate = (bot_resolved / total) × 100
          - Avg response time
          - Response time reduction vs manual baseline
          - Avg confidence score
          - Escalation rate
        """
        total = db.query(func.count(SupportTicket.id)).scalar() or 0
        bot_resolved = (
            db.query(func.count(SupportTicket.id))
            .filter(SupportTicket.status == TicketStatus.BOT_RESOLVED)
            .scalar() or 0
        )
        escalated = (
            db.query(func.count(SupportTicket.id))
            .filter(SupportTicket.is_escalated == True)
            .scalar() or 0
        )
        open_tickets = (
            db.query(func.count(SupportTicket.id))
            .filter(SupportTicket.status == TicketStatus.OPEN)
            .scalar() or 0
        )

        avg_rt = (
            db.query(func.avg(SupportTicket.response_time_seconds))
            .filter(SupportTicket.response_time_seconds.isnot(None))
            .scalar() or 0.0
        )
        avg_conf = (
            db.query(func.avg(SupportTicket.confidence_score))
            .filter(SupportTicket.confidence_score.isnot(None))
            .scalar() or 0.0
        )

        # KPI calculations
        auto_resolution_rate = round((bot_resolved / total * 100), 2) if total else 0.0
        escalation_rate = round((escalated / total * 100), 2) if total else 0.0
        rt_reduction_pct = round(
            ((MANUAL_RESOLUTION_SECONDS - avg_rt) / MANUAL_RESOLUTION_SECONDS * 100), 2
        ) if avg_rt < MANUAL_RESOLUTION_SECONDS else 0.0

        return AnalyticsOverview(
            total_tickets=total,
            bot_resolved=bot_resolved,
            escalated=escalated,
            open_tickets=open_tickets,
            auto_resolution_rate=auto_resolution_rate,
            avg_response_time_sec=round(avg_rt, 2),
            avg_confidence_score=round(avg_conf, 4),
            escalation_rate=escalation_rate,
            response_time_reduction_pct=rt_reduction_pct,
        )

    def get_daily_stats(self, db: Session, days: int = 30) -> List[DailyStats]:
        """Daily ticket volume and resolution breakdown for the last N days."""
        since = datetime.utcnow() - timedelta(days=days)
        rows = (
            db.query(
                func.date(SupportTicket.created_at).label("date"),
                func.count(SupportTicket.id).label("total"),
                func.sum(
                    case((SupportTicket.status == TicketStatus.BOT_RESOLVED, 1), else_=0)
                ).label("resolved"),
                func.sum(
                    case((SupportTicket.is_escalated == True, 1), else_=0)
                ).label("escalated"),
                func.avg(SupportTicket.confidence_score).label("avg_conf"),
            )
            .filter(SupportTicket.created_at >= since)
            .group_by(func.date(SupportTicket.created_at))
            .order_by(func.date(SupportTicket.created_at))
            .all()
        )

        return [
            DailyStats(
                date=str(row.date),
                total=row.total or 0,
                resolved=int(row.resolved or 0),
                escalated=int(row.escalated or 0),
                avg_confidence=round(float(row.avg_conf or 0), 4),
            )
            for row in rows
        ]

    def get_category_breakdown(self, db: Session) -> List[CategoryBreakdown]:
        """Ticket count and resolution rate per category."""
        rows = (
            db.query(
                SupportTicket.category,
                func.count(SupportTicket.id).label("total"),
                func.sum(
                    case((SupportTicket.status == TicketStatus.BOT_RESOLVED, 1), else_=0)
                ).label("resolved"),
            )
            .filter(SupportTicket.category.isnot(None))
            .group_by(SupportTicket.category)
            .order_by(func.count(SupportTicket.id).desc())
            .all()
        )

        return [
            CategoryBreakdown(
                category=row.category or "Uncategorized",
                count=row.total or 0,
                resolution_rate=round((row.resolved / row.total * 100), 2) if row.total else 0.0,
            )
            for row in rows
        ]


analytics_service = AnalyticsService()
