# cache.py
import time
from typing import Dict, Any, TypeVar, Generic, Optional, Callable, Tuple, Literal

from src.logging import get_logger
logger = get_logger(__name__)


T = TypeVar('T')
K = TypeVar('K')


class Cache(Generic[K, T]):
    """Generic cache implementation with TTL support"""

    def __init__(self, name: str, ttl_seconds: int = 3600):
        """
        Initialize a new cache

        Args:
            name: Name of the cache (for logging)
            ttl_seconds: Time-to-live in seconds for cache entries
        """
        self.name = name
        self.ttl_seconds = ttl_seconds
        self.cache: Dict[K, Tuple[T, float]] = {}
        self.hits = 0
        self.misses = 0
        logger.info(f"Initialized {name} cache with TTL of {ttl_seconds} seconds")

    def get(self, key: K) -> Optional[T]:
        """
        Get a value from the cache

        Args:
            key: Cache key

        Returns:
            The cached value or None if not found or expired
        """
        if key in self.cache:
            value, timestamp = self.cache[key]
            if time.time() - timestamp <= self.ttl_seconds:
                self.hits += 1
                logger.debug(f"{self.name} cache HIT for key: {key}")
                return value
            else:
                # Remove expired entry
                del self.cache[key]

        self.misses += 1
        logger.debug(f"{self.name} cache MISS for key: {key}")
        return None

    def set(self, key: K, value: T) -> None:
        """
        Set a value in the cache

        Args:
            key: Cache key
            value: Value to cache
        """
        self.cache[key] = (value, time.time())
        logger.debug(f"Added to {self.name} cache: {key}")

    def get_or_set(self, key: K, getter: Callable[[], T]) -> T:
        """
        Get a value from the cache, or compute and store it if not found

        Args:
            key: Cache key
            getter: Function to compute the value if not in cache

        Returns:
            The cached or computed value
        """
        cached_value = self.get(key)
        if cached_value is not None:
            return cached_value

        value = getter()
        self.set(key, value)
        return value

    def invalidate(self, key: K) -> None:
        """
        Remove a value from the cache

        Args:
            key: Cache key to remove
        """
        if key in self.cache:
            del self.cache[key]
            logger.debug(f"Invalidated {self.name} cache entry: {key}")

    def clear(self) -> None:
        """Clear all entries from the cache"""
        self.cache.clear()
        logger.info(f"Cleared {self.name} cache")

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total = self.hits + self.misses
        hit_rate = (self.hits / total) * 100 if total > 0 else 0
        return {
            "name": self.name,
            "entries": len(self.cache),
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": f"{hit_rate:.2f}%"
        }


# Initialize caches
transcription_cache = Cache[str, str](name="transcription", ttl_seconds=86400)  # 24 hours TTL
category_cache = Cache[str, dict](name="category", ttl_seconds=86400)  # 24 hours TTL
user_preference_cache = Cache[str, Literal["openai", "anthropic"]](name="user_preference",
                                                                   ttl_seconds=3600)  # 1 hour TTL