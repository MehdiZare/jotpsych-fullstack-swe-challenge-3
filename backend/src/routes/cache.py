# src/routes/cache.py
from typing import Dict

from fastapi import APIRouter

from src.cache import transcription_cache, category_cache, user_preference_cache
from src.logging import get_logger
from src.state import active_jobs, user_store

logger = get_logger(__name__)
router = APIRouter()

@router.get("/stats", response_model=Dict)
async def get_cache_stats():
    """Get cache statistics"""
    logger.info("Cache statistics requested")
    return {
        "transcription_cache": transcription_cache.get_stats(),
        "category_cache": category_cache.get_stats(),
        "user_preference_cache": user_preference_cache.get_stats(),
        "active_jobs": len(active_jobs),
        "users": len(user_store)
    }

@router.post("/clear-cache", response_model=Dict)
async def clear_cache():
    """Clear all caches"""
    logger.info("Clearing all caches")
    transcription_cache.clear()
    category_cache.clear()
    user_preference_cache.clear()

    return {
        "status": "success",
        "message": "All caches cleared"
    }