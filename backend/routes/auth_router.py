"""
Authentication Router - /api/auth
User registration, login, and profile endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from models.schemas import UserCreate, UserLogin, TokenResponse, UserResponse
from services.auth_service import auth_service
from database import get_db

router = APIRouter()
security = HTTPBearer()


@router.post("/register", response_model=UserResponse, status_code=201, summary="Register a new user")
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Creates a new user account. Passwords are bcrypt-hashed."""
    user = auth_service.register_user(db, user_data)
    return user


@router.post("/login", response_model=TokenResponse, summary="Login and receive JWT token")
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate with email + password. Returns a signed JWT token (HS256)."""
    return auth_service.authenticate_user(db, credentials.email, credentials.password)


@router.get("/me", response_model=UserResponse, summary="Get current authenticated user")
async def get_me(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    return auth_service.get_current_user(db, credentials.credentials)
