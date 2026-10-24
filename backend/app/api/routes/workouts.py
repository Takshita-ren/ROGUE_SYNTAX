from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.schemas.workout import (
    WorkoutCreate,
    WorkoutUpdate,
    WorkoutResponse,
    StatsSummaryResponse
)
from app.services import workout_service

router = APIRouter()

@router.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "RepRight API",
        "version": "1.0.0"
    }

@router.get("/stats/summary", response_model=StatsSummaryResponse, tags=["Stats"])
def get_stats_summary(db: Session = Depends(get_db)):
    return workout_service.get_stats_summary(db)

@router.get("/workouts", response_model=List[WorkoutResponse], tags=["Workouts"])
def list_workouts(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    sort_by: str = Query("created_at", pattern="^(created_at|duration_seconds|valid_reps)$"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db)
):
    return workout_service.get_workouts(db, skip=skip, limit=limit, sort_by=sort_by, order=order)

@router.post("/workouts", response_model=WorkoutResponse, status_code=status.HTTP_201_CREATED, tags=["Workouts"])
def create_workout(workout_in: WorkoutCreate, db: Session = Depends(get_db)):
    try:
        workout = workout_service.create_workout(db, workout_in)
        return workout
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to record workout session: {str(e)}"
        )

@router.get("/workouts/{workout_id}", response_model=WorkoutResponse, tags=["Workouts"])
def get_workout(workout_id: int, db: Session = Depends(get_db)):
    workout = workout_service.get_workout_by_id(db, workout_id)
    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workout with ID {workout_id} not found"
        )
    return workout

@router.put("/workouts/{workout_id}", response_model=WorkoutResponse, tags=["Workouts"])
def update_workout(workout_id: int, workout_in: WorkoutUpdate, db: Session = Depends(get_db)):
    workout = workout_service.update_workout(db, workout_id, workout_in)
    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workout with ID {workout_id} not found"
        )
    return workout

@router.delete("/workouts/{workout_id}", status_code=status.HTTP_200_OK, tags=["Workouts"])
def delete_workout(workout_id: int, db: Session = Depends(get_db)):
    success = workout_service.delete_workout(db, workout_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workout with ID {workout_id} not found"
        )
    return {"message": f"Workout {workout_id} deleted successfully", "id": workout_id}

@router.delete("/workouts", status_code=status.HTTP_200_OK, tags=["Workouts"])
def clear_all_workouts(db: Session = Depends(get_db)):
    deleted_count = workout_service.clear_all_workouts(db)
    return {"message": "All workout history cleared successfully", "deleted_count": deleted_count}
