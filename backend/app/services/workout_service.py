from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from app.models.workout import Workout
from app.schemas.workout import WorkoutCreate, WorkoutUpdate, StatsSummaryResponse, DayActivity, WorkoutResponse

def get_workout_by_id(db: Session, workout_id: int) -> Optional[Workout]:
    return db.query(Workout).filter(Workout.id == workout_id).first()

def get_workout_by_session_id(db: Session, session_id: str) -> Optional[Workout]:
    return db.query(Workout).filter(Workout.session_id == session_id).first()

def get_workouts(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    sort_by: str = "created_at",
    order: str = "desc"
) -> List[Workout]:
    query = db.query(Workout)
    
    # Sort order
    column = getattr(Workout, sort_by, Workout.created_at)
    if order.lower() == "asc":
        query = query.order_by(column.asc())
    else:
        query = query.order_by(column.desc())
        
    return query.offset(skip).limit(limit).all()

def create_workout(db: Session, workout_in: WorkoutCreate) -> Workout:
    # Check if session_id already exists to prevent duplicate submission
    existing = get_workout_by_session_id(db, workout_in.session_id)
    if existing:
        return existing
        
    workout = Workout(
        session_id=workout_in.session_id,
        exercise_type=workout_in.exercise_type,
        start_time=workout_in.start_time,
        end_time=workout_in.end_time,
        duration_seconds=workout_in.duration_seconds,
        valid_reps=workout_in.valid_reps,
        incomplete_attempts=workout_in.incomplete_attempts,
        feedback_summary=[f.model_dump() for f in workout_in.feedback_summary] if workout_in.feedback_summary else [],
        rep_data=[r.model_dump() for r in workout_in.rep_data] if workout_in.rep_data else [],
    )
    db.add(workout)
    db.commit()
    db.refresh(workout)
    return workout

def update_workout(db: Session, workout_id: int, workout_in: WorkoutUpdate) -> Optional[Workout]:
    workout = get_workout_by_id(db, workout_id)
    if not workout:
        return None
    
    update_data = workout_in.model_dump(exclude_unset=True)
    if "feedback_summary" in update_data and update_data["feedback_summary"] is not None:
        update_data["feedback_summary"] = [
            f.model_dump() if hasattr(f, "model_dump") else f for f in update_data["feedback_summary"]
        ]
    if "rep_data" in update_data and update_data["rep_data"] is not None:
        update_data["rep_data"] = [
            r.model_dump() if hasattr(r, "model_dump") else r for r in update_data["rep_data"]
        ]
        
    for field, value in update_data.items():
        setattr(workout, field, value)
        
    db.commit()
    db.refresh(workout)
    return workout

def delete_workout(db: Session, workout_id: int) -> bool:
    workout = get_workout_by_id(db, workout_id)
    if not workout:
        return False
    db.delete(workout)
    db.commit()
    return True

def clear_all_workouts(db: Session) -> int:
    deleted_count = db.query(Workout).delete()
    db.commit()
    return deleted_count

def get_stats_summary(db: Session) -> StatsSummaryResponse:
    total_workouts = db.query(Workout).count()
    if total_workouts == 0:
        # Generate 7 empty days for weekly chart
        now = datetime.now(timezone.utc)
        empty_weekly = []
        for i in range(6, -1, -1):
            day_date = (now - timedelta(days=i)).strftime("%Y-%m-%d")
            empty_weekly.append(DayActivity(
                date=day_date,
                reps=0,
                workouts=0,
                duration_seconds=0.0
            ))
        return StatsSummaryResponse(
            total_workouts=0,
            total_reps=0,
            total_duration_seconds=0.0,
            avg_reps_per_workout=0.0,
            total_incomplete_attempts=0,
            weekly_activity=empty_weekly,
            latest_workout=None
        )

    # Sum total reps, duration, incomplete attempts
    stats = db.query(
        func.sum(Workout.valid_reps).label("total_reps"),
        func.sum(Workout.duration_seconds).label("total_duration"),
        func.sum(Workout.incomplete_attempts).label("total_incomplete")
    ).first()

    total_reps = stats.total_reps or 0
    total_duration = stats.total_duration or 0.0
    total_incomplete = stats.total_incomplete or 0
    avg_reps = round(total_reps / total_workouts, 1) if total_workouts > 0 else 0.0

    # Latest workout
    latest = db.query(Workout).order_by(desc(Workout.created_at)).first()

    # Past 7 days activity
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)
    recent_workouts = db.query(Workout).filter(Workout.created_at >= seven_days_ago).all()

    daily_map = {}
    for i in range(6, -1, -1):
        day_date = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        daily_map[day_date] = {
            "reps": 0,
            "workouts": 0,
            "duration": 0.0
        }

    for w in recent_workouts:
        day_str = w.created_at.strftime("%Y-%m-%d")
        if day_str in daily_map:
            daily_map[day_str]["reps"] += w.valid_reps
            daily_map[day_str]["workouts"] += 1
            daily_map[day_str]["duration"] += w.duration_seconds

    weekly_activity = [
        DayActivity(
            date=d,
            reps=daily_map[d]["reps"],
            workouts=daily_map[d]["workouts"],
            duration_seconds=daily_map[d]["duration"]
        )
        for d in sorted(daily_map.keys())
    ]

    return StatsSummaryResponse(
        total_workouts=total_workouts,
        total_reps=total_reps,
        total_duration_seconds=round(total_duration, 1),
        avg_reps_per_workout=avg_reps,
        total_incomplete_attempts=total_incomplete,
        weekly_activity=weekly_activity,
        latest_workout=WorkoutResponse.model_validate(latest) if latest else None
    )
