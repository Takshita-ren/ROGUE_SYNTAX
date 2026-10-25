from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime

class UserProfileCreate(BaseModel):
    user_id: Optional[str] = "default_user"
    height: float = Field(..., ge=50, le=300, description="Height in centimeters")
    height_unit: str = Field(default="cm", pattern="^(cm|ft_in)$")
    height_ft: Optional[int] = Field(default=None, ge=1, le=9)
    height_in: Optional[int] = Field(default=None, ge=0, le=11)
    weight: float = Field(..., ge=20, le=500, description="Weight in kilograms")
    weight_unit: str = Field(default="kg", pattern="^(kg|lbs)$")
    age_range: Optional[str] = None
    fitness_level: str = Field(..., pattern="^(beginner|intermediate|advanced)$")
    main_goal: str = Field(..., pattern="^(weight_loss|muscle_gain|strength|general_fitness|mobility)$")
    workout_days_per_week: int = Field(default=3, ge=2, le=6)
    equipment: List[str] = Field(default=["bodyweight"])

class UserProfileUpdate(BaseModel):
    height: Optional[float] = Field(default=None, ge=50, le=300)
    height_unit: Optional[str] = Field(default=None, pattern="^(cm|ft_in)$")
    height_ft: Optional[int] = Field(default=None, ge=1, le=9)
    height_in: Optional[int] = Field(default=None, ge=0, le=11)
    weight: Optional[float] = Field(default=None, ge=20, le=500)
    weight_unit: Optional[str] = Field(default=None, pattern="^(kg|lbs)$")
    age_range: Optional[str] = None
    fitness_level: Optional[str] = Field(default=None, pattern="^(beginner|intermediate|advanced)$")
    main_goal: Optional[str] = Field(default=None, pattern="^(weight_loss|muscle_gain|strength|general_fitness|mobility)$")
    workout_days_per_week: Optional[int] = Field(default=None, ge=2, le=6)
    equipment: Optional[List[str]] = None

class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: str
    height: float
    height_unit: str
    height_ft: Optional[int] = None
    height_in: Optional[int] = None
    weight: float
    weight_unit: str
    age_range: Optional[str] = None
    fitness_level: str
    main_goal: str
    workout_days_per_week: int
    equipment: List[str]
    created_at: datetime
    updated_at: datetime
