from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.models import workout  # Ensure models are registered with Base
from app.api.routes.workouts import router as workout_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database tables on startup
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="RepRight AI Fitness Coach - Backend REST API",
    lifespan=lifespan
)

# Configure CORS
origins = settings.CORS_ORIGINS
allow_all = "*" in origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=not allow_all,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(workout_router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "app": "RepRight AI Fitness Coach API",
        "docs_url": "/docs",
        "health": f"{settings.API_PREFIX}/health"
    }
