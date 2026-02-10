from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api import content, repos

# Include routers
app.include_router(repos.router, prefix="/api/repos", tags=["repos"])
app.include_router(content.router, prefix="/api/content", tags=["content"])

@app.get("/")
async def root():
    return {"message": "Welcome to RookDocs API"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}
