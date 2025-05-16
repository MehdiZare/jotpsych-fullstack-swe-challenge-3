from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables or .env file"""
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None

    ANTHROPIC_MODEL_ID: str = "claude-3-5-haiku-latest"
    OPENAI_MODEL_ID: str = "o4-mini-2025-04-16"

    # API configuration
    API_VERSION: str = "1.0.0"
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


# Create a global settings instance
settings = Settings()