from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def run_migrations(target_engine=engine):
    """
    Safe startup schema migration for SQLite and PostgreSQL:
    Inspects existing workouts table and dynamically adds missing columns
    (exercise_id, reps, hold_seconds) without losing or breaking existing data.
    """
    try:
        inspector = inspect(target_engine)
        if not inspector.has_table("workouts"):
            return

        columns = {col["name"] for col in inspector.get_columns("workouts")}
        with target_engine.begin() as conn:
            if "exercise_id" not in columns:
                conn.execute(text("ALTER TABLE workouts ADD COLUMN exercise_id VARCHAR(50) DEFAULT 'squat'"))
                conn.execute(text("UPDATE workouts SET exercise_id = 'squat' WHERE exercise_id IS NULL"))
            if "reps" not in columns:
                conn.execute(text("ALTER TABLE workouts ADD COLUMN reps INTEGER"))
            if "hold_seconds" not in columns:
                conn.execute(text("ALTER TABLE workouts ADD COLUMN hold_seconds FLOAT"))
    except Exception as e:
        print(f"Non-fatal migration check warning: {e}")
