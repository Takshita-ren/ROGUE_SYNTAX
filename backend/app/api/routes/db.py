from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db, engine
from app.schemas.db import DbStatusResponse
from app.services import db_service

router = APIRouter(prefix="/db", tags=["Database"])

@router.get("/status", response_model=DbStatusResponse)
def get_db_status(db: Session = Depends(get_db)):
    return db_service.get_database_status(db, engine)
