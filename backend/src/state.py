# src/state.py
"""Module for shared application state"""

# In-memory user storage
# In production, this would be in a proper database
user_store = {}

# In-memory storage for job status and results
# In production, this would be in a database/cache like Redis
active_jobs = {}