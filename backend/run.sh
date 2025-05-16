#!/bin/bash
set -e

# Run the FastAPI application with Poetry
echo "Starting FastAPI application..."
poetry run uvicorn app:app --host 0.0.0.0 --port 8000 --reload
