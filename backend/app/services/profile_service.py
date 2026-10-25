from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timezone
from app.models.profile import UserProfile
from app.schemas.profile import UserProfileCreate, UserProfileUpdate

def get_profile(db: Session, user_id: str = "default_user") -> Optional[UserProfile]:
    return db.query(UserProfile).filter(UserProfile.user_id == user_id).first()

def create_or_update_profile(
    db: Session,
    profile_in: UserProfileCreate,
    user_id: str = "default_user"
) -> UserProfile:
    existing = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    now = datetime.now(timezone.utc)

    if existing:
        existing.height = profile_in.height
        existing.height_unit = profile_in.height_unit
        existing.height_ft = profile_in.height_ft
        existing.height_in = profile_in.height_in
        existing.weight = profile_in.weight
        existing.weight_unit = profile_in.weight_unit
        existing.age_range = profile_in.age_range
        existing.fitness_level = profile_in.fitness_level
        existing.main_goal = profile_in.main_goal
        existing.workout_days_per_week = profile_in.workout_days_per_week
        existing.equipment = profile_in.equipment
        existing.updated_at = now
        db.commit()
        db.refresh(existing)
        return existing

    profile = UserProfile(
        user_id=user_id,
        height=profile_in.height,
        height_unit=profile_in.height_unit,
        height_ft=profile_in.height_ft,
        height_in=profile_in.height_in,
        weight=profile_in.weight,
        weight_unit=profile_in.weight_unit,
        age_range=profile_in.age_range,
        fitness_level=profile_in.fitness_level,
        main_goal=profile_in.main_goal,
        workout_days_per_week=profile_in.workout_days_per_week,
        equipment=profile_in.equipment,
        created_at=now,
        updated_at=now,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile

def update_profile(
    db: Session,
    profile_in: UserProfileUpdate,
    user_id: str = "default_user"
) -> Optional[UserProfile]:
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        return None

    update_data = profile_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(profile, field, val)

    profile.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(profile)
    return profile

def delete_profile(db: Session, user_id: str = "default_user") -> bool:
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        return False
    db.delete(profile)
    db.commit()
    return True
