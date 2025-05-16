# src/routes/user.py
from typing import Optional
from datetime import datetime
import uuid

from fastapi import APIRouter, Header

from src.schemas import UserResponse
from src.logging import get_logger
from src.config import settings
from src.state import user_store

logger = get_logger(__name__)
router = APIRouter()

def get_or_create_user(user_id: Optional[str] = None) -> str:
    """
    Get an existing user or create a new one
    """
    # If user_id is provided and exists in the store, return it
    if user_id and user_id in user_store:
        return user_id

    # Generate a new user ID
    new_user_id = str(uuid.uuid4())

    # Store in the user store with creation timestamp
    user_store[new_user_id] = {
        "created_at": datetime.now().isoformat(),
        "jobs": []
    }

    return new_user_id

@router.get("/user", response_model=UserResponse)
async def get_user(x_user_id: Optional[str] = Header(None)):
    """
    Get user ID - if user exists, return current ID
    If no user exists or ID is not provided, create a new user
    """
    user_id = get_or_create_user(x_user_id)

    # Log user interaction
    logger.info(f"User {user_id} identified")

    return UserResponse(user_id=user_id, version=settings.API_VERSION)