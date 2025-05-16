# Transcription API

A FastAPI application for audio transcription processing with categorization using LLMs.

## Prerequisites

- Python 3.9+
- Poetry (dependency management)

## Installation

### 1. Install Poetry

**Linux/macOS:**
```bash
curl -sSL https://install.python-poetry.org | python3 -
```

**Windows (PowerShell):**
```powershell
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -
```

Verify the installation:
```bash
poetry --version
```

### 2. Clone the repository

```bash
git clone https://github.com/yourusername/transcription-api.git
cd transcription-api
```

### 3. Install dependencies

```bash
poetry install
```

### 4. Configure environment variables

Create a `.env` file in the project root:

```
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
LOG_LEVEL=INFO
API_VERSION=1.0.0
```

## Running the application

### Development server

```bash
poetry run python app.py
```

Or using uvicorn directly:

```bash
poetry run uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at http://localhost:8000

### API Documentation

Access the interactive API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

- `GET /version` - Get API version
- `GET /user` - Get or create user
- `POST /transcribe` - Start transcription job
- `GET /jobs/{job_id}` - Get job status
- `GET /jobs` - Get all jobs for a user
- `GET /stats` - Get cache statistics
- `POST /clear-cache` - Clear all caches
