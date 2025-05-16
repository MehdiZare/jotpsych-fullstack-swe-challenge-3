# src/routes/version.py
from fastapi import APIRouter

from src.config import settings
from src.schemas import VersionResponse
from src.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()

@router.get("/version", response_model=VersionResponse)
async def get_version():
    """Endpoint to check the current API version"""
    logger.info(f"Version request received. Returning version: {settings.API_VERSION}")
    return VersionResponse(version=settings.API_VERSION)