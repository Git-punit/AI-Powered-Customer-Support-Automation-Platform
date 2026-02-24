"""
Enterprise RAG-Based AI Support Automation Platform
Backend - FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn

from routes import query_router, ingest_router, ticket_router, analytics_router, auth_router
from config import settings

app = FastAPI(
    title="Enterprise AI Support Automation API",
    description="RAG-based AI assistant for enterprise L1 support automation",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(ingest_router.router, prefix="/api/ingest", tags=["Knowledge Base"])
app.include_router(query_router.router, prefix="/api/query", tags=["RAG Query"])
app.include_router(ticket_router.router, prefix="/api/tickets", tags=["Tickets"])
app.include_router(analytics_router.router, prefix="/api/analytics", tags=["Analytics"])


@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "Enterprise AI Support Automation Platform",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/api/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "environment": settings.ENVIRONMENT}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info",
    )
