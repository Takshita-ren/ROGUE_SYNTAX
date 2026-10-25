import copy
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from typing import Optional, Dict
from datetime import datetime, timezone
from app.models.plan import WorkoutPlan, PlanProgress
from app.schemas.plan import WorkoutPlanCreate, DayProgressItem

def get_active_plan(db: Session, user_id: str = "default_user") -> Optional[WorkoutPlan]:
    return (
        db.query(WorkoutPlan)
        .filter(WorkoutPlan.user_id == user_id, WorkoutPlan.is_active == True)
        .order_by(WorkoutPlan.created_at.desc())
        .first()
    )

def save_plan(db: Session, plan_in: WorkoutPlanCreate, user_id: str = "default_user") -> WorkoutPlan:
    now = datetime.now(timezone.utc)

    # Deactivate previous active plans for this user
    db.query(WorkoutPlan).filter(
        WorkoutPlan.user_id == user_id,
        WorkoutPlan.is_active == True
    ).update({"is_active": False})

    new_plan = WorkoutPlan(
        plan_id=plan_in.plan_id,
        user_id=user_id,
        user_goal=plan_in.user_goal,
        fitness_level=plan_in.fitness_level,
        workout_days_per_week=plan_in.workout_days_per_week,
        equipment=plan_in.equipment,
        days=plan_in.days,
        weekly_guidance=plan_in.weekly_guidance,
        safety_disclaimer=plan_in.safety_disclaimer,
        is_active=True,
        created_at=now,
        updated_at=now,
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)
    return new_plan

def update_plan_variation(
    db: Session,
    day_number: int,
    exercise_id: str,
    variation_id: str,
    user_id: str = "default_user"
) -> Optional[WorkoutPlan]:
    plan = get_active_plan(db, user_id=user_id)
    if not plan:
        return None

    days = copy.deepcopy(plan.days or [])
    modified = False

    for day in days:
        if day.get("dayNumber") == day_number:
            for ex in day.get("exercises", []):
                if ex.get("id") == exercise_id:
                    matched_var = next((v for v in ex.get("variations", []) if v.get("id") == variation_id), None)
                    if matched_var:
                        ex["selectedVariationId"] = variation_id
                        ex["name"] = matched_var.get("name")
                        ex["targetRepsOrDuration"] = matched_var.get("recommendedSetsReps")
                        modified = True
                        break

    if modified:
        plan.days = days
        flag_modified(plan, "days")
        plan.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(plan)

    return plan

def get_progress(db: Session, user_id: str = "default_user") -> Dict[int, DayProgressItem]:
    records = db.query(PlanProgress).filter(PlanProgress.user_id == user_id).all()
    res: Dict[int, DayProgressItem] = {}
    for r in records:
        res[r.day_number] = DayProgressItem(
            day_number=r.day_number,
            is_completed=r.is_completed,
            completed_at=r.completed_at,
            completed_exercises=r.completed_exercises or []
        )
    return res

def mark_day_completed(
    db: Session,
    day_number: int,
    is_completed: bool,
    user_id: str = "default_user"
) -> Dict[int, DayProgressItem]:
    now = datetime.now(timezone.utc)
    rec = (
        db.query(PlanProgress)
        .filter(PlanProgress.user_id == user_id, PlanProgress.day_number == day_number)
        .first()
    )

    if rec:
        rec.is_completed = is_completed
        rec.completed_at = now if is_completed else None
        rec.updated_at = now
    else:
        rec = PlanProgress(
            user_id=user_id,
            day_number=day_number,
            is_completed=is_completed,
            completed_at=now if is_completed else None,
            completed_exercises=[],
            created_at=now,
            updated_at=now
        )
        db.add(rec)

    db.commit()
    return get_progress(db, user_id=user_id)

def toggle_exercise_completed(
    db: Session,
    day_number: int,
    exercise_id: str,
    user_id: str = "default_user"
) -> Dict[int, DayProgressItem]:
    now = datetime.now(timezone.utc)
    rec = (
        db.query(PlanProgress)
        .filter(PlanProgress.user_id == user_id, PlanProgress.day_number == day_number)
        .first()
    )

    if not rec:
        rec = PlanProgress(
            user_id=user_id,
            day_number=day_number,
            is_completed=False,
            completed_at=None,
            completed_exercises=[exercise_id],
            created_at=now,
            updated_at=now
        )
        db.add(rec)
    else:
        current_list = list(rec.completed_exercises or [])
        if exercise_id in current_list:
            current_list.remove(exercise_id)
        else:
            current_list.append(exercise_id)
        rec.completed_exercises = current_list
        rec.updated_at = now

    db.commit()
    return get_progress(db, user_id=user_id)

def reset_progress(db: Session, user_id: str = "default_user") -> int:
    deleted = db.query(PlanProgress).filter(PlanProgress.user_id == user_id).delete()
    db.commit()
    return deleted
