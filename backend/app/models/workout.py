from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from datetime import datetime, timezone
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class Workout(Base):
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(String(64), unique=True, index=True, nullable=False)
    exercise_type = Column(String(50), default="squat", nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    duration_seconds = Column(Float, nullable=False, default=0.0)
    valid_reps = Column(Integer, nullable=False, default=0)
    incomplete_attempts = Column(Integer, nullable=False, default=0)
    feedback_summary = Column(JSON, nullable=True)  # List of {message, count}
    rep_data = Column(JSON, nullable=True)  # List of {rep_number, duration_seconds, min_knee_angle, etc.}
    created_at = Column(DateTime, default=utc_now, nullable=False)
