from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.models import Complaint, ComplaintStatus, Department, District, EscalationLog
from app.schemas.schemas import (
    CategoryStats,
    DepartmentScorecard,
    DistrictStats,
    EscalationFeedItem,
    OverviewStats,
    TimeseriesPoint,
)
from app.services.auth import require_admin, require_cm_office
from app.services.clustering import cluster_complaints
from app.services.sla import check_and_escalate

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/overview", response_model=OverviewStats)
def overview(db: Session = Depends(get_db), _=Depends(require_admin)):
    check_and_escalate(db)
    open_statuses = [ComplaintStatus.submitted, ComplaintStatus.assigned, ComplaintStatus.in_progress]
    total_open = db.query(Complaint).filter(Complaint.status.in_(open_statuses)).count()

    today = datetime.now(timezone.utc).date()
    resolved_today = (
        db.query(Complaint)
        .filter(
            Complaint.status.in_([ComplaintStatus.resolved, ComplaintStatus.closed]),
            func.date(Complaint.resolved_at) == today,
        )
        .count()
    )
    escalated = db.query(EscalationLog).count()

    resolved = db.query(Complaint).filter(Complaint.resolved_at.isnot(None)).all()
    avg_hours = 0.0
    if resolved:
        total_h = 0
        for c in resolved:
            created = c.created_at.replace(tzinfo=timezone.utc) if c.created_at.tzinfo is None else c.created_at
            resolved_at = c.resolved_at.replace(tzinfo=timezone.utc) if c.resolved_at.tzinfo is None else c.resolved_at
            total_h += (resolved_at - created).total_seconds() / 3600
        avg_hours = round(total_h / len(resolved), 1)

    return OverviewStats(
        total_open=total_open,
        resolved_today=resolved_today,
        escalated=escalated,
        avg_resolution_hours=avg_hours,
    )


@router.get("/by-district", response_model=list[DistrictStats])
def by_district(db: Session = Depends(get_db), _=Depends(require_admin)):
    districts = db.query(District).all()
    result = []
    for d in districts:
        total = db.query(Complaint).filter(Complaint.district_id == d.id).count()
        open_count = db.query(Complaint).filter(
            Complaint.district_id == d.id,
            Complaint.status.in_([ComplaintStatus.submitted, ComplaintStatus.assigned, ComplaintStatus.in_progress]),
        ).count()
        resolved_count = db.query(Complaint).filter(
            Complaint.district_id == d.id,
            Complaint.status.in_([ComplaintStatus.resolved, ComplaintStatus.closed]),
        ).count()
        result.append(DistrictStats(
            district_name=d.name, total=total, open_count=open_count, resolved_count=resolved_count
        ))
    result.sort(key=lambda x: x.open_count, reverse=True)
    return result


@router.get("/by-category", response_model=list[CategoryStats])
def by_category(db: Session = Depends(get_db), _=Depends(require_admin)):
    rows = (
        db.query(Complaint.category, func.count(Complaint.id))
        .group_by(Complaint.category)
        .order_by(func.count(Complaint.id).desc())
        .limit(8)
        .all()
    )
    return [CategoryStats(category=r[0], count=r[1]) for r in rows]


@router.get("/timeseries", response_model=list[TimeseriesPoint])
def timeseries(db: Session = Depends(get_db), _=Depends(require_admin)):
    points = []
    for i in range(29, -1, -1):
        day = (datetime.now(timezone.utc) - timedelta(days=i)).date()
        count = (
            db.query(Complaint)
            .filter(func.date(Complaint.created_at) == day)
            .count()
        )
        points.append(TimeseriesPoint(date=day.isoformat(), count=count))
    return points


@router.get("/hotspots")
def hotspots(db: Session = Depends(get_db), _=Depends(require_admin)):
    complaints = (
        db.query(Complaint)
        .options(joinedload(Complaint.district))
        .filter(Complaint.status != ComplaintStatus.closed)
        .all()
    )
    data = [
        {
            "complaint_id": c.complaint_id,
            "category": c.category,
            "district_name": c.district.name,
            "lat": c.lat,
            "lng": c.lng,
            "urgency": c.urgency,
        }
        for c in complaints
    ]
    return cluster_complaints(data)


@router.get("/map-points")
def map_points(db: Session = Depends(get_db), _=Depends(require_admin)):
    complaints = (
        db.query(Complaint)
        .options(joinedload(Complaint.district))
        .all()
    )
    return [
        {
            "id": c.id,
            "complaint_id": c.complaint_id,
            "lat": c.lat,
            "lng": c.lng,
            "urgency": c.urgency,
            "category": c.category,
            "district_name": c.district.name,
            "status": c.status.value,
        }
        for c in complaints
    ]


@router.get("/escalations", response_model=list[EscalationFeedItem])
def escalations(db: Session = Depends(get_db), _=Depends(require_cm_office)):
    check_and_escalate(db)
    logs = (
        db.query(EscalationLog)
        .options(joinedload(EscalationLog.complaint).joinedload(Complaint.district))
        .order_by(EscalationLog.escalated_at.desc())
        .limit(20)
        .all()
    )
    return [
        EscalationFeedItem(
            id=log.id,
            complaint_id=log.complaint.complaint_id,
            category=log.complaint.category,
            district_name=log.complaint.district.name,
            reason=log.reason,
            urgency=log.complaint.urgency,
            escalated_at=log.escalated_at,
        )
        for log in logs
    ]


@router.get("/departments", response_model=list[DepartmentScorecard])
def departments(db: Session = Depends(get_db), _=Depends(require_cm_office)):
    depts = db.query(Department).all()
    result = []
    for d in depts:
        total = db.query(Complaint).filter(Complaint.department_id == d.id).count()
        resolved = db.query(Complaint).filter(
            Complaint.department_id == d.id,
            Complaint.status.in_([ComplaintStatus.resolved, ComplaintStatus.closed]),
        ).count()
        backlog = db.query(Complaint).filter(
            Complaint.department_id == d.id,
            Complaint.status.in_([ComplaintStatus.submitted, ComplaintStatus.assigned, ComplaintStatus.in_progress]),
        ).count()
        rate = round((resolved / total * 100) if total else 0, 1)
        resolved_complaints = db.query(Complaint).filter(
            Complaint.department_id == d.id, Complaint.resolved_at.isnot(None)
        ).all()
        avg_h = 0.0
        if resolved_complaints:
            total_h = sum(
                (c.resolved_at - c.created_at).total_seconds() / 3600
                for c in resolved_complaints
                if c.resolved_at and c.created_at
            )
            avg_h = round(total_h / len(resolved_complaints), 1)
        result.append(DepartmentScorecard(
            department_name=d.name,
            total=total,
            resolved=resolved,
            resolution_rate=rate,
            backlog=backlog,
            avg_resolution_hours=avg_h,
        ))
    result.sort(key=lambda x: x.backlog, reverse=True)
    return result
