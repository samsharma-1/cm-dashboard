from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Department, District
from app.schemas.schemas import DepartmentResponse, DistrictResponse

router = APIRouter(prefix="/api/meta", tags=["meta"])


@router.get("/districts", response_model=list[DistrictResponse])
def list_districts(db: Session = Depends(get_db)):
    return db.query(District).all()


@router.get("/departments", response_model=list[DepartmentResponse])
def list_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()
