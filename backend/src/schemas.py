# schemas.py
from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class TranscriptCategory(BaseModel):
    """Schema for transcript categorization"""
    primary_topic: str = Field(..., description="The primary topic discussed in the transcript")
    sentiment: Literal["positive", "neutral", "negative"] = Field(..., description="The overall sentiment of the transcript")
    keywords: List[str] = Field(..., description="3-5 keywords that represent the main topics in the transcript")
    confidence: float = Field(..., description="Confidence score for the categorization (0.0 to 1.0)")
    summary: str = Field(..., description="A short summary of the transcript content (1-2 sentences)")

# API response models
class BaseResponse(BaseModel):
    """Base response model including version information"""
    version: str

class ErrorResponse(BaseResponse):
    """Error response with details"""
    detail: str

class VersionResponse(BaseResponse):
    """Simple response for version endpoint"""
    pass

class UserResponse(BaseResponse):
    """Response for user creation/retrieval"""
    user_id: str

class TranscriptionJobResponse(BaseResponse):
    """Response containing job ID for an submitted transcription"""
    job_id: str
    status: str

class TranscriptionStatusResponse(BaseResponse):
    """Response for job status check"""
    job_id: str
    status: str
    progress: float
    transcription: Optional[str] = None
    category: Optional[TranscriptCategory] = None
    error: Optional[str] = None

class TranscriptionResponse(BaseResponse):
    """Response for complete transcription"""
    transcription: str
    category: Optional[TranscriptCategory] = None