# src/routes/__init__.py
from fastapi import APIRouter
from src.routes.version import router as version_router
from src.routes.user import router as user_router
from src.routes.transcription import router as transcription_router
from src.routes.cache import router as cache_router

# Create the main router
router = APIRouter()

# Include all sub-routers
router.include_router(version_router)
router.include_router(user_router)
router.include_router(transcription_router)
router.include_router(cache_router)