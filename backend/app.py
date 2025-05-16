# app.py
from fastapi import FastAPI, HTTPException, Request, Response, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time
import random
from typing import Dict, Optional, Literal, Union
import uvicorn

# Define a constant for the API version
API_VERSION = "1.0.0"

app = FastAPI(title="Transcription API", version=API_VERSION)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Define response models
class BaseResponse(BaseModel):
    """Base response model including version information"""
    version: str = API_VERSION


class ErrorResponse(BaseResponse):
    """Error response with details"""
    detail: str


class VersionResponse(BaseResponse):
    """Simple response for version endpoint"""
    pass


class TranscriptionResponse(BaseResponse):
    """Response for transcription requests"""
    transcription: str
    # TODO: Add category field when implemented


async def verify_version(
        response: Response,
        x_api_version: Optional[str] = Header(None)
):
    """Dependency to check API version compatibility"""
    # Always send the current backend version in response headers
    response.headers["X-API-Version"] = API_VERSION

    # Skip version check if header not provided
    if not x_api_version:
        return

    # Validate frontend version matches backend
    if x_api_version != API_VERSION:
        raise HTTPException(
            status_code=426,  # 426 Upgrade Required
            detail=f"Version mismatch: Client version {x_api_version} does not match server version {API_VERSION}. Please refresh your application."
        )


def process_transcription(job_id: str, audio_data: bytes):
    """Mock function to simulate async transcription processing. Returns a random transcription."""
    time.sleep(random.randint(2, 5))  # Reduced for testing purposes
    return random.choice([
        "I've always been fascinated by cars, especially classic muscle cars from the 60s and 70s. The raw power and beautiful design of those vehicles is just incredible.",
        "Bald eagles are such majestic creatures. I love watching them soar through the sky and dive down to catch fish. Their white heads against the blue sky is a sight I'll never forget.",
        "Deep sea diving opens up a whole new world of exploration. The mysterious creatures and stunning coral reefs you encounter at those depths are unlike anything else on Earth."
    ])


def categorize_transcription(transcription_string: str, user_id: str):
    # TODO: Implement transcription categorization
    model_to_use = get_user_model_from_db(user_id)
    if model_to_use == "openai":
        # TODO: Implement OpenAI categorization
        pass
    elif model_to_use == "anthropic":
        # TODO: Implement Anthropic categorization
        pass


def get_user_model_from_db(user_id: str) -> Literal["openai", "anthropic"]:
    """
    Mocks a slow and expensive function to simulate fetching a user's preferred LLM model from database
    Returns either 'openai' or 'anthropic' after a random delay.
    """
    time.sleep(random.randint(1, 3))  # Reduced for testing purposes
    return random.choice(["openai", "anthropic"])


@app.get("/version", response_model=VersionResponse)
async def get_version():
    """Endpoint to check the current API version"""
    return VersionResponse()


@app.post("/transcribe", response_model=TranscriptionResponse, dependencies=[Depends(verify_version)])
async def transcribe_audio(request: Request, response: Response):
    """
    Endpoint to transcribe audio
    Includes version verification through dependency
    """
    # Extract user ID from header if available
    user_id = request.headers.get("X-User-ID", "anonymous")

    result = process_transcription("xyz", "abcde")

    # TODO: Implement categorization
    # result = categorize_transcription(result, user_id)

    return TranscriptionResponse(
        transcription=result,
        # TODO: Add category when implemented
    )


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)