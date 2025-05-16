# src/utils.py
from typing import Optional

from fastapi import Response, Header, HTTPException

from src.config import settings
from src.logging import get_logger

logger = get_logger(__name__)


async def verify_version(
        response: Response,
        x_api_version: Optional[str] = Header(None)
):
    """Dependency to check API version compatibility"""
    # Always send the current backend version in response headers
    response.headers["X-API-Version"] = settings.API_VERSION

    # Skip version check if header not provided
    if not x_api_version:
        return

    # Validate frontend version matches backend
    if x_api_version != settings.API_VERSION:
        logger.warning(
            f"Version mismatch: Client version {x_api_version} does not match server version {settings.API_VERSION}")
        raise HTTPException(
            status_code=426,  # 426 Upgrade Required
            detail=f"Version mismatch: Client version {x_api_version} does not match server version {settings.API_VERSION}. Please refresh your application."
        )

    logger.debug(f"Version check passed: {x_api_version}")