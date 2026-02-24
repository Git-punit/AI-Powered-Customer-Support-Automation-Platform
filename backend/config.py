"""
Application Configuration using Pydantic BaseSettings
Reads from .env file or environment variables
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Enterprise AI Support Automation Platform"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/ai_support_db"

    # Vector DB (FAISS)
    FAISS_INDEX_PATH: str = "./data/faiss_index"
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 384
    TOP_K_RESULTS: int = 5

    # LLM
    OPENAI_API_KEY: str = ""
    LLM_MODEL: str = "gpt-3.5-turbo"
    LLM_MAX_TOKENS: int = 512
    LLM_TEMPERATURE: float = 0.2

    # RAG
    CHUNK_SIZE: int = 600
    CHUNK_OVERLAP: int = 100
    CONFIDENCE_THRESHOLD: float = 0.65  # Below this → escalate

    # Escalation
    ESCALATION_EMAIL: str = "support-admin@enterprise.com"

    # AWS (for production)
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: str = "enterprise-ai-support-docs"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
