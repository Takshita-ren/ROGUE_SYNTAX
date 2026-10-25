from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.schemas.profile import UserProfileCreate, UserProfileUpdate, UserProfileResponse
from app.services import profile_service

router = APIRouter(prefix="/profile", tags=["Profile"])

@router.get("", response_model=Optional[UserProfileResponse])
def get_user_profile(user_id: str = "default_user", db: Session = Depends(get_db)):
    profile = profile_service.get_profile(db, user_id=user_id)
    if not profile:
        return None
    return profile

@router.post("", response_model=UserProfileResponse, status_code=status.HTTP_200_OK)
def save_user_profile(
    profile_in: UserProfileCreate,
    user_id: str = "default_user",
    db: Session = Depends(get_db)
):
    try:
        profile = profile_service.create_or_update_profile(db, profile_in, user_id=user_id)
        return profile
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to save profile: {str(e)}"
        )

@router.put("", response_model=UserProfileResponse)
def update_user_profile(
    profile_in: UserProfileUpdate,
    user_id: str = "default_user",
    db: Session = Depends(get_db)
):
    profile = profile_service.update_profile(db, profile_in, user_id=user_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    return profile

@router.delete("", status_code=status.HTTP_200_OK)
def delete_user_profile(user_id: str = "default_user", db: Session = Depends(get_db)):
    success = profile_service.delete_profile(db, user_id=user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    return {"message": "Profile deleted successfully"}
