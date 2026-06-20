import random
import string
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.models import Complaint, ComplaintStatus, Department, EscalationLog


def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def check_and_escalate(db: Session) -> int:
    """Flag complaints past SLA threshold. Returns count of new escalations."""
    now = datetime.now(timezone.utc)
    open_statuses = [
        ComplaintStatus.submitted,
        ComplaintStatus.assigned,
        ComplaintStatus.in_progress,
    ]
    complaints = (
        db.query(Complaint)
        .filter(Complaint.status.in_(open_statuses))
        .all()
    )
    new_count = 0
    for c in complaints:
        if not c.department_id:
            continue
        dept = db.query(Department).filter(Department.id == c.department_id).first()
        if not dept:
            continue
        created = c.created_at
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        elapsed_hours = (now - created).total_seconds() / 3600
        if elapsed_hours <= dept.sla_hours:
            continue
        existing = (
            db.query(EscalationLog)
            .filter(EscalationLog.complaint_id == c.id)
            .first()
        )
        if existing:
            continue
        log = EscalationLog(
            complaint_id=c.id,
            reason=f"SLA breach: unresolved for {int(elapsed_hours)}h (limit {dept.sla_hours}h)",
            from_status=c.status.value,
        )
        db.add(log)
        new_count += 1
    if new_count:
        db.commit()
    return new_count
