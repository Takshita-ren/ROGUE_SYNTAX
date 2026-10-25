from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, Dict
from app.core.database import get_db
from app.schemas.plan import (
    WorkoutPlanCreate,
    WorkoutPlanResponse,
    VariationUpdateRequest,
    DayProgressUpdate,
    ExerciseProgressUpdate,
    PlanProgressResponse,
    DayProgressItem
)
from app.services import plan_service

router = APIRouter(prefix="/plan", tags=["Plan"])

@router.get("", response_model=Optional[WorkoutPlanResponse])
def get_active_workout_plan(user_id: str = "default_user", db: Session = Depends(get_db)):
    plan = plan_service.get_active_plan(db, user_id=user_id)
    if not plan:
        return None
    return plan

@router.post("", response_model=WorkoutPlanResponse, status_code=status.HTTP_201_CREATED)
def save_workout_plan(
    plan_in: WorkoutPlanCreate,
    user_id: str = "default_user",
    db: Session = Depends(get_db)
):
    try:
        plan = plan_service.save_plan(db, plan_in, user_id=user_id)
        return plan
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to save workout plan: {str(e)}"
        )

@router.put("/variation", response_model=WorkoutPlanResponse)
def update_variation(
    body: VariationUpdateRequest,
    user_id: str = "default_user",
    db: Session = Depends(get_db)
):
    updated = plan_service.update_plan_variation(
        db,
        day_number=body.day_number,
        exercise_id=body.exercise_id,
        variation_id=body.variation_id,
        user_id=user_id
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active plan or exercise not found"
        )
    return updated

@router.get("/progress", response_model=PlanProgressResponse)
def get_plan_progress(user_id: str = "default_user", db: Session = Depends(get_db)):
    prog = plan_service.get_progress(db, user_id=user_id)
    return PlanProgressResponse(progress=prog)

@router.post("/progress/day", response_model=PlanProgressResponse)
def mark_day_completed(
    body: DayProgressUpdate,
    user_id: str = "default_user",
    db: Session = Depends(get_db)
):
    prog = plan_service.mark_day_completed(
        db,
        day_number=body.day_number,
        is_completed=body.is_completed,
        user_id=user_id
    )
    return PlanProgressResponse(progress=prog)

@router.post("/progress/exercise", response_model=PlanProgressResponse)
def toggle_exercise_completed(
    body: ExerciseProgressUpdate,
    user_id: str = "default_user",
    db: Session = Depends(get_db)
):
    prog = plan_service.toggle_exercise_completed(
        db,
        day_number=body.day_number,
        exercise_id=body.exercise_id,
        user_id=user_id
    )
    return PlanProgressResponse(progress=prog)

@router.delete("/progress", status_code=status.HTTP_200_OK)
def reset_progress(user_id: str = "default_user", db: Session = Depends(get_db)):
    deleted = plan_service.reset_progress(db, user_id=user_id)
    return {"message": "Plan progress reset successfully", "deleted_count": deleted}
