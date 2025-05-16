# categorization.py
import json
from typing import Dict, Any, Literal, Optional

from langchain_core.prompts import ChatPromptTemplate, PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI

from src.config import settings
from src.schemas import TranscriptCategory


class CategoryTool(BaseModel):
    """Tool schema for categorizing a transcript"""
    primary_topic: str = Field(..., description="The primary topic discussed in the transcript")
    sentiment: Literal["positive", "neutral", "negative"] = Field(...,
                                                                  description="The overall sentiment of the transcript")
    keywords: str = Field(...,
                          description="3-5 keywords that represent the main topics in the transcript, comma separated")
    confidence: float = Field(..., description="Confidence score for the categorization (0.0 to 1.0)")
    summary: str = Field(..., description="A short summary of the transcript content (1-2 sentences)")


def get_llm_client(provider: Literal["openai", "anthropic"]) -> Any:
    """Get the appropriate LLM client based on provider"""
    if provider == "openai":
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not set in environment")
        return ChatOpenAI(
            api_key=settings.OPENAI_API_KEY,
            model="gpt-3.5-turbo-0125",
            temperature=0.1
        )
    elif provider == "anthropic":
        if not settings.ANTHROPIC_API_KEY:
            raise ValueError("ANTHROPIC_API_KEY not set in environment")
        return ChatAnthropic(
            api_key=settings.ANTHROPIC_API_KEY,
            model="claude-2.1",
            temperature=0.1
        )
    else:
        raise ValueError(f"Unknown provider: {provider}")


def categorize_transcript(transcript: str, provider: Literal["openai", "anthropic"]) -> Optional[TranscriptCategory]:
    """
    Categorize a transcript using the specified LLM provider
    Returns a TranscriptCategory object or None if categorization failed
    """
    try:
        # Get the appropriate LLM client
        llm = get_llm_client(provider)

        # Create the output parser
        parser = JsonOutputParser(pydantic_object=CategoryTool)

        # Create a structured prompt for categorization
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert transcript analyzer. Your job is to categorize transcripts based on content.

You MUST respond using ONLY valid JSON format that matches the CategoryTool schema.
Your response should have these fields:
- primary_topic: The main topic of the transcript
- sentiment: Must be one of ["positive", "neutral", "negative"]
- keywords: 3-5 comma-separated keywords from the transcript
- confidence: A float between 0.0 and 1.0 indicating your confidence
- summary: A 1-2 sentence summary of the transcript

DO NOT include any explanations, just return the JSON.
"""),
            ("human", "Please categorize this transcript: {transcript}")
        ])

        # Create the chain
        chain = prompt | llm | parser

        # Execute the chain
        result = chain.invoke({"transcript": transcript})

        # Parse the keywords from a string to a list
        keywords_list = [k.strip() for k in result["keywords"].split(",")]

        # Convert to our TranscriptCategory schema
        category = TranscriptCategory(
            primary_topic=result["primary_topic"],
            sentiment=result["sentiment"],
            keywords=keywords_list,
            confidence=result["confidence"],
            summary=result["summary"]
        )

        return category

    except Exception as e:
        print(f"Error categorizing transcript: {e}")
        # Return None to indicate failure
        return None


def validate_json_response(response: str) -> Dict[str, Any]:
    """
    Validate that the response is valid JSON and contains expected fields
    Returns parsed JSON or raises an exception
    """
    try:
        # Try to parse the response as JSON
        parsed = json.loads(response)

        # Check that it has the expected fields
        required_fields = ["primary_topic", "sentiment", "keywords", "confidence", "summary"]
        for field in required_fields:
            if field not in parsed:
                raise ValueError(f"Missing required field: {field}")

        # Validate sentiment value
        if parsed["sentiment"] not in ["positive", "neutral", "negative"]:
            raise ValueError(f"Invalid sentiment value: {parsed['sentiment']}")

        # Validate confidence value
        if not isinstance(parsed["confidence"], (int, float)) or parsed["confidence"] < 0 or parsed["confidence"] > 1:
            raise ValueError(f"Invalid confidence value: {parsed['confidence']}")

        return parsed

    except json.JSONDecodeError:
        raise ValueError("Response is not valid JSON")