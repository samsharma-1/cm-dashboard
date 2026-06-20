from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.models import (
    Citizen,
    Complaint,
    ComplaintStatus,
    Department,
    District,
    StatusHistory,
    User,
    UserRole,
)
from app.routers.helpers import complaint_to_response
from app.schemas.schemas import (
    ComplaintCreate,
    ComplaintListResponse,
    ComplaintResponse,
    OTPVerify,
    StatusUpdate,
)
from app.services.auth import get_current_user, require_admin
from app.services.classifier import classify_complaint
from app.services.sla import generate_otp

router = APIRouter(prefix="/api/complaints", tags=["complaints"])


def _next_complaint_id(db: Session) -> str:
    year = datetime.now().year
    count = db.query(Complaint).count() + 1
    return f"DEL-{year}-{count:05d}"


@router.post("", response_model=ComplaintResponse)
async def create_complaint(data: ComplaintCreate, db: Session = Depends(get_db)):
    district = db.query(District).filter(District.id == data.district_id).first()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")

    classification = await classify_complaint(data.description)
    dept = db.query(Department).filter(Department.name == classification.department).first()
    if not dept:
        dept = db.query(Department).filter(Department.name == "General Administration").first()

    citizen = Citizen(name=data.name, phone=data.phone)
    db.add(citizen)
    db.flush()

    lat = data.lat if data.lat is not None else district.center_lat + (hash(data.description) % 100) * 0.0001
    lng = data.lng if data.lng is not None else district.center_lng + (hash(data.phone) % 100) * 0.0001

    complaint = Complaint(
        complaint_id=_next_complaint_id(db),
        citizen_id=citizen.id,
        district_id=district.id,
        department_id=dept.id if dept else None,
        description=data.description,
        category=classification.category,
        urgency=classification.urgency,
        status=ComplaintStatus.submitted,
        lat=lat,
        lng=lng,
        photo_url=data.photo_url,
        ai_reasoning=classification.reasoning,
    )
    db.add(complaint)
    db.flush()

    history = StatusHistory(
        complaint_id=complaint.id,
        status=ComplaintStatus.submitted,
        officer_name="System",
        note="Complaint submitted and AI-classified",
    )
    db.add(history)
    db.commit()
    db.refresh(complaint)

    complaint = (
        db.query(Complaint)
        .options(
            joinedload(Complaint.citizen),
            joinedload(Complaint.district),
            joinedload(Complaint.department),
            joinedload(Complaint.status_history),
        )
        .filter(Complaint.id == complaint.id)
        .first()
    )
    return complaint_to_response(complaint)


@router.get("", response_model=ComplaintListResponse)
def list_complaints(
    district_id: int | None = None,
    category: str | None = None,
    status: ComplaintStatus | None = None,
    min_urgency: int | None = None,
    search: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    q = db.query(Complaint).options(
        joinedload(Complaint.citizen),
        joinedload(Complaint.district),
        joinedload(Complaint.department),
        joinedload(Complaint.status_history),
    )
    if user.role == UserRole.dept_officer and user.department_id:
        q = q.filter(Complaint.department_id == user.department_id)
    if district_id:
        q = q.filter(Complaint.district_id == district_id)
    if category:
        q = q.filter(Complaint.category == category)
    if status:
        q = q.filter(Complaint.status == status)
    if min_urgency:
        q = q.filter(Complaint.urgency >= min_urgency)
    if search:
        q = q.filter(
            Complaint.complaint_id.ilike(f"%{search}%")
            | Complaint.description.ilike(f"%{search}%")
        )
    total = q.count()
    items = q.order_by(Complaint.created_at.desc()).offset(skip).limit(limit).all()
    return ComplaintListResponse(
        items=[complaint_to_response(c) for c in items],
        total=total,
    )


@router.get("/track/{complaint_id}", response_model=ComplaintResponse)
def track_complaint(complaint_id: str, db: Session = Depends(get_db)):
    complaint = (
        db.query(Complaint)
        .options(
            joinedload(Complaint.citizen),
            joinedload(Complaint.district),
            joinedload(Complaint.department),
            joinedload(Complaint.status_history),
        )
        .filter(Complaint.complaint_id == complaint_id.upper())
        .first()
    )
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint_to_response(complaint)


@router.get("/{complaint_db_id}", response_model=ComplaintResponse)
def get_complaint(
    complaint_db_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    complaint = (
        db.query(Complaint)
        .options(
            joinedload(Complaint.citizen),
            joinedload(Complaint.district),
            joinedload(Complaint.department),
            joinedload(Complaint.status_history),
        )
        .filter(Complaint.id == complaint_db_id)
        .first()
    )
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if user.role == UserRole.dept_officer and user.department_id:
        if complaint.department_id != user.department_id:
            raise HTTPException(status_code=403, detail="Access denied")
    return complaint_to_response(complaint)


@router.patch("/{complaint_db_id}/status", response_model=ComplaintResponse)
def update_status(
    complaint_db_id: int,
    data: StatusUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_db_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if data.department_id:
        complaint.department_id = data.department_id
    complaint.status = data.status
    officer = data.officer_name or user.name
    complaint.assigned_officer = officer

    if data.status == ComplaintStatus.resolved:
        complaint.resolved_at = datetime.now(timezone.utc)
        complaint.closure_otp = generate_otp()

    history = StatusHistory(
        complaint_id=complaint.id,
        status=data.status,
        officer_name=officer,
        note=data.note,
    )
    db.add(history)
    db.commit()

    complaint = (
        db.query(Complaint)
        .options(
            joinedload(Complaint.citizen),
            joinedload(Complaint.district),
            joinedload(Complaint.department),
            joinedload(Complaint.status_history),
        )
        .filter(Complaint.id == complaint_db_id)
        .first()
    )
    otp_note = ""
    if complaint.closure_otp and data.status == ComplaintStatus.resolved:
        otp_note = f" [Mock OTP: {complaint.closure_otp}]"
    return complaint_to_response(complaint)


@router.post("/{complaint_db_id}/verify-otp", response_model=ComplaintResponse)
def verify_otp(
    complaint_db_id: int,
    data: OTPVerify,
    db: Session = Depends(get_db),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_db_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if complaint.status != ComplaintStatus.resolved:
        raise HTTPException(status_code=400, detail="Complaint must be resolved first")
    if not complaint.closure_otp or complaint.closure_otp != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    complaint.status = ComplaintStatus.closed
    complaint.closure_otp = None
    history = StatusHistory(
        complaint_id=complaint.id,
        status=ComplaintStatus.closed,
        officer_name="Citizen",
        note="Citizen verified resolution via OTP",
    )
    db.add(history)
    db.commit()

    complaint = (
        db.query(Complaint)
        .options(
            joinedload(Complaint.citizen),
            joinedload(Complaint.district),
            joinedload(Complaint.department),
            joinedload(Complaint.status_history),
        )
        .filter(Complaint.id == complaint_db_id)
        .first()
    )
    return complaint_to_response(complaint)

