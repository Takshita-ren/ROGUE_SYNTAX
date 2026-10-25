from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, run_migrations
import app.models  # Ensure all models (Workout, UserProfile, WorkoutPlan, PlanProgress) are registered
from app.api.routes.workouts import router as workout_router
from app.api.routes.profiles import router as profile_router
from app.api.routes.plans import router as plan_router
from app.api.routes.db import router as db_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database tables on startup
    Base.metadata.create_all(bind=engine)
    run_migrations(engine)
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

cors_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
cors_headers = ["Content-Type", "Accept", "Authorization", "X-Requested-With"]

if allow_all:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=cors_methods,
        allow_headers=cors_headers,
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_origin_regex=r"https://.*\.vercel\.app",
        allow_credentials=True,
        allow_methods=cors_methods,
        allow_headers=cors_headers,
    )

# Include API routes
app.include_router(workout_router, prefix=settings.API_PREFIX)
app.include_router(profile_router, prefix=settings.API_PREFIX)
app.include_router(plan_router, prefix=settings.API_PREFIX)
app.include_router(db_router, prefix=settings.API_PREFIX)

@app.get("/health", tags=["Health"])
def health():
    return {
        "status": "healthy",
        "service": "RepRight API",
        "version": settings.VERSION
    }

@app.get("/")
def root():
    return {
        "app": "RepRight AI Fitness Coach API",
        "docs_url": "/docs",
        "health": f"{settings.API_PREFIX}/health"
    }
