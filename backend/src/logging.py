# src/logging.py
import logging
import sys
from typing import Optional

from src.config import settings


def setup_logging(log_level: Optional[str] = None) -> None:
    """
    Set up centralized logging configuration.

    Args:
        log_level: Override the log level from settings if provided
    """
    # Use the provided log level or fallback to the one in settings
    level = getattr(logging, log_level or settings.LOG_LEVEL)

    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Clear existing handlers to avoid duplicates when called multiple times
    root_logger.handlers = []

    # Add console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    console_handler.setLevel(level)
    root_logger.addHandler(console_handler)

    # Quiet some noisy libraries
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)

    # Log that we've configured logging
    root_logger.info(f"Logging configured with level: {logging.getLevelName(level)}")


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger with the given name.
    """
    return logging.getLogger(name)