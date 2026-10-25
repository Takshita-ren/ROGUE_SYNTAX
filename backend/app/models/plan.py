from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON
from datetime import datetime, timezone
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class WorkoutPlan(Base):
    __tablename__ = "workout_plans"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    plan_id = Column(String(64), unique=True, index=True, nullable=False)
    user_id = Column(String(64), default="default_user", index=True, nullable=False)
    user_goal = Column(String(30), nullable=False)
    fitness_level = Column(String(20), nullable=False)
    workout_days_per_week = Column(Integer, nullable=False)
    equipment = Column(JSON, nullable=False)
    days = Column(JSON, nullable=False)  # Array of 7 days with exercises & variations
    weekly_guidance = Column(Text, nullable=True)
    safety_disclaimer = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, index=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

class PlanProgress(Base):
    __tablename__ = "plan_progress"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(64), default="default_user", index=True, nullable=False)
    plan_id = Column(String(64), nullable=True, index=True)
    day_number = Column(Integer, nullable=False)  # 1 to 7
    is_completed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    completed_exercises = Column(JSON, nullable=True)  # List of completed exercise IDs
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
