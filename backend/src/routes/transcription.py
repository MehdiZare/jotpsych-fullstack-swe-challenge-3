# src/routes/transcription.py
from typing import Optional, List
from datetime import datetime
import uuid
import threading
import random
import hashlib
import time

from fastapi import APIRouter, Header, Request, Response, Depends, HTTPException

from src.schemas import (
    TranscriptionJobResponse,
    TranscriptionStatusResponse,
    TranscriptCategory
)
from src.logging import get_logger
from src.config import settings
from src.categorization import categorize_transcript
from src.cache import transcription_cache, category_cache, user_preference_cache
from src.routes.user import get_or_create_user
from src.utils import verify_version
from src.state import active_jobs, user_store

logger = get_logger(__name__)
router = APIRouter()

def process_transcription(job_id: str, audio_data: bytes):
    """Mock function to simulate async transcription processing. Returns a random transcription."""
    # Check cache first based on audio data hash
    audio_hash = hashlib.md5(audio_data).hexdigest()
    cached_transcription = transcription_cache.get(audio_hash)

    if cached_transcription:
        logger.info(f"Using cached transcription for job {job_id}")
        return cached_transcription

    # Simulate processing delay
    time.sleep(random.randint(2, 5))

    # Generate random transcription
    transcription = random.choice([
        "I've always been fascinated by cars, especially classic muscle cars from the 60s and 70s. The raw power and beautiful design of those vehicles is just incredible.",
        "Bald eagles are such majestic creatures. I love watching them soar through the sky and dive down to catch fish. Their white heads against the blue sky is a sight I'll never forget.",
        "Deep sea diving opens up a whole new world of exploration. The mysterious creatures and stunning coral reefs you encounter at those depths are unlike anything else on Earth."
    ])

    # Cache the result
    transcription_cache.set(audio_hash, transcription)

    return transcription


def get_user_model_from_db(user_id: str) -> str:
    """
    Mocks a slow and expensive function to simulate fetching a user's preferred LLM model from database
    Returns either 'openai' or 'anthropic' after a random delay.
    Now with caching!
    """
    # Check if we have this user's preference cached
    cached_preference = user_preference_cache.get(user_id)
    if cached_preference:
        logger.info(f"Using cached LLM preference for user {user_id}: {cached_preference}")
        return cached_preference

    # Simulate slow database query
    logger.info(f"Expensive database query for user {user_id} LLM preference")
    time.sleep(random.randint(5, 8))  # Simulate slow DB query

    # Get random preference
    preference = random.choice(["openai", "anthropic"])

    # Cache the result
    user_preference_cache.set(user_id, preference)

    logger.info(f"User {user_id} LLM preference set to {preference}")
    return preference


def process_transcription_job(job_id: str, user_id: str, audio_data: bytes = b"mock_audio"):
    """
    Process a transcription job in a separate thread
    Updates job status at various points
    """
    try:
        # Update job to processing status
        active_jobs[job_id]["status"] = "processing"
        active_jobs[job_id]["progress"] = 0.1

        # Simulate initial processing delay
        time.sleep(random.uniform(0.5, 1))
        active_jobs[job_id]["progress"] = 0.3

        # Get transcription (now with caching)
        transcription = process_transcription(job_id, audio_data)

        # Update job with transcription
        active_jobs[job_id]["transcription"] = transcription
        active_jobs[job_id]["progress"] = 0.5

        # Generate hash for the transcription to use as category cache key
        transcription_hash = hashlib.md5(transcription.encode()).hexdigest()

        # Check if we have a cached categorization for this transcription
        cached_category = category_cache.get(transcription_hash)

        if cached_category:
            logger.info(f"Using cached categorization for job {job_id}")
            active_jobs[job_id]["category"] = cached_category
            active_jobs[job_id]["progress"] = 0.9
        else:
            # Get the user's preferred LLM model (now with caching)
            logger.info(f"Getting LLM preference for user {user_id}")
            llm_provider = get_user_model_from_db(user_id)
            logger.info(f"User {user_id} prefers {llm_provider}")

            active_jobs[job_id]["progress"] = 0.7

            # Categorize the transcription using the appropriate LLM
            logger.info(f"Categorizing transcription for job {job_id} using {llm_provider}")
            try:
                category = categorize_transcript(transcription, llm_provider)
                if category:
                    category_dict = category.model_dump()
                    active_jobs[job_id]["category"] = category_dict

                    # Cache the categorization result
                    category_cache.set(transcription_hash, category_dict)

                    logger.info(f"Categorization successful for job {job_id}: {category.primary_topic}")
                else:
                    logger.warning(f"Categorization failed for job {job_id}")
            except Exception as e:
                logger.error(f"Error during categorization for job {job_id}: {e}")

            active_jobs[job_id]["progress"] = 0.9

        time.sleep(random.uniform(0.5, 1))

        # Update job with finished status
        active_jobs[job_id]["status"] = "completed"
        active_jobs[job_id]["progress"] = 1.0

        # Log job completion with user ID
        logger.info(f"Job {job_id} completed for user {user_id}")
    except Exception as e:
        # Update job with error status
        active_jobs[job_id]["status"] = "error"
        active_jobs[job_id]["error"] = str(e)

        # Log error with user ID
        logger.error(f"Error processing job {job_id} for user {user_id}: {str(e)}")

@router.post("/transcribe", response_model=TranscriptionJobResponse, dependencies=[Depends(verify_version)])
async def start_transcription(
        request: Request,
        response: Response,
        x_user_id: Optional[str] = Header(None)
):
    """
    Start a transcription job and return a job ID immediately
    """
    # Ensure we have a valid user ID
    user_id = get_or_create_user(x_user_id)

    # Generate a job ID
    job_id = str(uuid.uuid4())

    # Read request body for hashing (in real app, we'd extract the audio file)
    # For demo purposes, we're using a random seed as mock audio data
    mock_audio_data = str(random.randint(1, 10)).encode()  # Use random seed for demo

    # Create job entry with initial status
    active_jobs[job_id] = {
        "user_id": user_id,
        "status": "queued",
        "progress": 0.0,
        "created_at": datetime.now().isoformat(),
        "transcription": None,
        "category": None,
        "error": None
    }

    # Add job to user's job list
    if user_id in user_store:
        user_store[user_id]["jobs"].append(job_id)

    # Start a background thread to process the job
    thread = threading.Thread(
        target=process_transcription_job,
        args=(job_id, user_id, mock_audio_data)
    )
    thread.daemon = True
    thread.start()

    # Log job creation
    logger.info(f"Job {job_id} created for user {user_id}")

    # Return job ID and initial status
    return TranscriptionJobResponse(job_id=job_id, status="queued", version=settings.API_VERSION)


@router.get("/jobs/{job_id}", response_model=TranscriptionStatusResponse, dependencies=[Depends(verify_version)])
async def get_job_status(
        job_id: str,
        response: Response,
        x_user_id: Optional[str] = Header(None)
):
    """
    Get the status of a transcription job
    """
    # Ensure we have a valid user ID
    user_id = get_or_create_user(x_user_id)

    # Check if job exists
    if job_id not in active_jobs:
        logger.warning(f"Job {job_id} not found for user {user_id}")
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    # Get job details
    job = active_jobs[job_id]

    # Convert category dict to TranscriptCategory model if it exists
    category = None
    if job.get("category"):
        category = TranscriptCategory(**job["category"])

    # Log job status check
    logger.info(f"Job {job_id} status checked by user {user_id}")

    # Return job status
    return TranscriptionStatusResponse(
        job_id=job_id,
        status=job["status"],
        progress=job["progress"],
        transcription=job.get("transcription"),
        category=category,
        error=job.get("error"),
        version=settings.API_VERSION
    )


@router.get("/jobs", response_model=List[TranscriptionStatusResponse], dependencies=[Depends(verify_version)])
async def get_user_jobs(
        response: Response,
        x_user_id: Optional[str] = Header(None)
):
    """
    Get all jobs for a user
    """
    # Ensure we have a valid user ID
    user_id = get_or_create_user(x_user_id)

    # Check if user exists and has jobs
    if user_id not in user_store:
        logger.info(f"No jobs found for user {user_id}")
        return []

    # Get user's job IDs
    job_ids = user_store[user_id].get("jobs", [])

    # Get job details for each job ID
    jobs = []
    for job_id in job_ids:
        if job_id in active_jobs:
            job = active_jobs[job_id]

            # Convert category dict to TranscriptCategory model if it exists
            category = None
            if job.get("category"):
                category = TranscriptCategory(**job["category"])

            jobs.append(TranscriptionStatusResponse(
                job_id=job_id,
                status=job["status"],
                progress=job["progress"],
                transcription=job.get("transcription"),
                category=category,
                error=job.get("error"),
                version=settings.API_VERSION
            ))

    # Log jobs list request
    logger.info(f"Jobs list requested by user {user_id}, found {len(jobs)} jobs")

    return jobs