import os
from pydantic import BaseModel
from typing import List

def get_database_url() -> str:
    url = os.getenv("DATABASE_URL", "sqlite:///./replevel_workouts.db")
    # Render PostgreSQL URLs start with postgres://, but SQLAlchemy requires postgresql://
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url

def get_cors_origins() -> List[str]:
    cors_env = os.getenv("CORS_ORIGINS", "")
    if cors_env.strip() == "*":
        return ["*"]
    if cors_env:
        return [origin.strip() for origin in cors_env.split(",") if origin.strip()]
    return [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://rogue-syntax-mggsr6lev-rougue.vercel.app",
    ]

class Settings(BaseModel):
    PROJECT_NAME: str = "RepRight API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    DATABASE_URL: str = get_database_url()
    CORS_ORIGINS: List[str] = get_cors_origins()

settings = Settings()
