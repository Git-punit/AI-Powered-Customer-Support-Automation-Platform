"""
Analytics Router - GET /api/analytics
Real-time KPI dashboard endpoints
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from models.schemas import AnalyticsOverview
from services.analytics_service import analytics_service
from database import get_db

router = APIRouter()


@router.get("/overview", response_model=AnalyticsOverview, summary="Overall KPI dashboard metrics")
async def get_overview(db: Session = Depends(get_db)):
    """
    Returns real-time KPIs computed from ticket database:
    - auto_resolution_rate: (bot_resolved / total) × 100
    - response_time_reduction_pct: ((360s - avg_bot_time) / 360s) × 100
    - avg_confidence_score: mean confidence across all queries
    - escalation_rate: (escalated / total) × 100
    """
    return analytics_service.get_overview(db)


@router.get("/daily", summary="Daily ticket volume trend (last N days)")
async def get_daily_stats(
    days: int = Query(default=30, ge=1, le=365, description="Number of days to look back"),
    db: Session = Depends(get_db),
):
    return analytics_service.get_daily_stats(db, days=days)


@router.get("/categories", summary="Ticket breakdown by category")
async def get_category_breakdown(db: Session = Depends(get_db)):
    return analytics_service.get_category_breakdown(db)


@router.get("/kpi-summary", summary="Key metrics for dashboard header cards")
async def get_kpi_summary(db: Session = Depends(get_db)):
    """Returns simplified KPIs for frontend dashboard cards."""
    overview = analytics_service.get_overview(db)
    return {
        "kpis": [
            {
                "label": "Auto Resolution Rate",
                "value": f"{overview.auto_resolution_rate}%",
                "description": "Tickets resolved without human intervention",
                "trend": "up",
            },
            {
                "label": "Response Time Reduction",
                "value": f"{overview.response_time_reduction_pct}%",
                "description": f"vs. manual baseline of 6 min (avg bot: {overview.avg_response_time_sec:.1f}s)",
                "trend": "up",
            },
            {
                "label": "Total Tickets",
                "value": str(overview.total_tickets),
                "description": f"{overview.open_tickets} open, {overview.bot_resolved} resolved by bot",
                "trend": "neutral",
            },
            {
                "label": "Avg Confidence Score",
                "value": f"{overview.avg_confidence_score:.2f}",
                "description": "Mean RAG retrieval confidence (0–1)",
                "trend": "neutral",
            },
            {
                "label": "Escalation Rate",
                "value": f"{overview.escalation_rate}%",
                "description": "Queries requiring human agent",
                "trend": "down",
            },
        ]
    }
