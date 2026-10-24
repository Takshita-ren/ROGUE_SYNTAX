from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any, Dict
from datetime import datetime

class RepetitionDetail(BaseModel):
    rep_number: int
    duration_seconds: float
    min_knee_angle: float
    completed_at: str
    feedback: Optional[List[str]] = None
    side_used: Optional[str] = "both"

class FeedbackSummaryItem(BaseModel):
    message: str
    count: int

class WorkoutCreate(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=64)
    exercise_id: Optional[str] = Field(default="squat", max_length=50)
    exercise_type: str = Field(default="squat", min_length=1, max_length=50)
    start_time: datetime
    end_time: datetime
    duration_seconds: float = Field(..., ge=0)
    valid_reps: int = Field(..., ge=0)
    incomplete_attempts: int = Field(default=0, ge=0)
    reps: Optional[int] = Field(default=None, ge=0)
    hold_seconds: Optional[float] = Field(default=None, ge=0)
    feedback_summary: Optional[List[FeedbackSummaryItem]] = []
    rep_data: Optional[List[RepetitionDetail]] = []

class WorkoutUpdate(BaseModel):
    exercise_id: Optional[str] = None
    exercise_type: Optional[str] = None
    valid_reps: Optional[int] = Field(None, ge=0)
    incomplete_attempts: Optional[int] = Field(None, ge=0)
    reps: Optional[int] = Field(None, ge=0)
    hold_seconds: Optional[float] = Field(None, ge=0)
    feedback_summary: Optional[List[FeedbackSummaryItem]] = None
    rep_data: Optional[List[RepetitionDetail]] = None

class WorkoutResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: str
    exercise_id: Optional[str] = "squat"
    exercise_type: str
    start_time: datetime
    end_time: datetime
    duration_seconds: float
    valid_reps: int
    incomplete_attempts: int
    reps: Optional[int] = None
    hold_seconds: Optional[float] = None
    feedback_summary: Optional[List[Any]] = []
    rep_data: Optional[List[Any]] = []
    created_at: datetime

class DayActivity(BaseModel):
    date: str
    reps: int
    workouts: int
    duration_seconds: float

class ExerciseStatItem(BaseModel):
    workouts: int
    reps: int
    duration_seconds: float

class StatsSummaryResponse(BaseModel):
    total_workouts: int
    total_reps: int
    total_duration_seconds: float
    avg_reps_per_workout: float
    total_incomplete_attempts: int
    weekly_activity: List[DayActivity]
    latest_workout: Optional[WorkoutResponse] = None
    exercise_stats: Optional[Dict[str, ExerciseStatItem]] = None
