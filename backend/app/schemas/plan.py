from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any, Dict
from datetime import datetime

class WorkoutPlanCreate(BaseModel):
    plan_id: str = Field(..., min_length=1, max_length=64)
    user_id: Optional[str] = "default_user"
    user_goal: str = Field(..., min_length=1, max_length=30)
    fitness_level: str = Field(..., min_length=1, max_length=20)
    workout_days_per_week: int = Field(..., ge=2, le=6)
    equipment: List[str]
    days: List[Any]  # 7-day schedule with exercises and variations
    weekly_guidance: Optional[str] = None
    safety_disclaimer: Optional[str] = None

class WorkoutPlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    plan_id: str
    user_id: str
    user_goal: str
    fitness_level: str
    workout_days_per_week: int
    equipment: List[Any]
    days: List[Any]
    weekly_guidance: Optional[str] = None
    safety_disclaimer: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

class VariationUpdateRequest(BaseModel):
    day_number: int = Field(..., ge=1, le=7)
    exercise_id: str = Field(..., min_length=1)
    variation_id: str = Field(..., min_length=1)

class DayProgressUpdate(BaseModel):
    day_number: int = Field(..., ge=1, le=7)
    is_completed: bool

class ExerciseProgressUpdate(BaseModel):
    day_number: int = Field(..., ge=1, le=7)
    exercise_id: str = Field(..., min_length=1)

class DayProgressItem(BaseModel):
    day_number: int
    is_completed: bool
    completed_at: Optional[datetime] = None
    completed_exercises: Optional[List[str]] = []

class PlanProgressResponse(BaseModel):
    progress: Dict[int, DayProgressItem]
