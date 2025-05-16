# app.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings
from src.routes import router
from src.logging import setup_logging, get_logger

# Set up centralized logging
setup_logging()
logger = get_logger(__name__)

# Create FastAPI app
app = FastAPI(title="Transcription API", version=settings.API_VERSION)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routes
app.include_router(router)


# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting Transcription API v{settings.API_VERSION}")
    logger.info(f"Log level: {settings.LOG_LEVEL}")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down Transcription API")


if __name__ == "__main__":
    import uvicorn

    logger.info("Starting development server...")
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)