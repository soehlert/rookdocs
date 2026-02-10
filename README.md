# RookDocs

RookDocs is a self-hosted personal wiki application that aggregates and serves Markdown documentation from multiple GitHub repositories.

## Features

- **Dark Mode UI**: Clean, modern interface designed for reading.
- **Git Integration**: Sync documentation from any public Git repository.
- **Markdown Rendering**: fast, high-quality rendering with syntax highlighting and table support.
- **Full Text Search**: Instantly find content across all connected repositories.
- **Docker Deployment**: Easy to deploy with Docker Compose.

## Tech Stack

- **Backend**: Python 3.14 + FastAPI (using `uv` for dependency management)
- **Frontend**: React + TypeScript + Tailwind CSS
- **Infrastructure**: Docker Compose

## Quick Start

1.  Clone this repository.
2.  Start the application:
    ```bash
    docker compose up --build
    ```
3.  Open your browser to [http://localhost:9123](http://localhost:9123).
4.  Go to **Settings** and add a repository (e.g., `https://github.com/fastapi/fastapi`).

## Development

### Backend
The backend uses `uv` for dependency management.
```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

### Frontend
The frontend uses Vite.
```bash
cd frontend
npm install
npm run dev
```
