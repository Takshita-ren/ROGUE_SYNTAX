from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from datetime import datetime, timezone
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(64), default="default_user", unique=True, index=True, nullable=False)
    height = Column(Float, nullable=False)  # Centimeters
    height_unit = Column(String(10), default="cm", nullable=False)
    height_ft = Column(Integer, nullable=True)
    height_in = Column(Integer, nullable=True)
    weight = Column(Float, nullable=False)  # Kilograms
    weight_unit = Column(String(10), default="kg", nullable=False)
    age_range = Column(String(20), nullable=True)
    fitness_level = Column(String(20), nullable=False)  # beginner, intermediate, advanced
    main_goal = Column(String(30), nullable=False)      # weight_loss, muscle_gain, strength, general_fitness, mobility
    workout_days_per_week = Column(Integer, nullable=False, default=3)
    equipment = Column(JSON, nullable=False)            # ["bodyweight", "dumbbells", ...]
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
