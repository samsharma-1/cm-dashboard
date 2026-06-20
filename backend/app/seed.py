import random
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.database import Base, SessionLocal, engine
from app.models.models import (
    Citizen,
    Complaint,
    ComplaintStatus,
    Department,
    District,
    EscalationLog,
    StatusHistory,
    User,
    UserRole,
)
from app.services.auth import hash_password

DISTRICTS = [
    ("Central Delhi", 28.6328, 77.2197),
    ("New Delhi", 28.6139, 77.2090),
    ("North Delhi", 28.7041, 77.1734),
    ("South Delhi", 28.5244, 77.1855),
    ("East Delhi", 28.6506, 77.2959),
    ("West Delhi", 28.6562, 77.0945),
    ("North East Delhi", 28.7286, 77.2629),
    ("North West Delhi", 28.7340, 77.0820),
    ("South East Delhi", 28.4817, 77.2871),
    ("South West Delhi", 28.5921, 77.0460),
    ("Shahdara", 28.6733, 77.2880),
]

DEPARTMENTS = [
    ("PWD", 72),
    ("MCD", 48),
    ("DJB", 48),
    ("BSES", 24),
    ("DPCC", 72),
    ("Traffic Police", 24),
    ("Health Dept", 12),
    ("Education Dept", 72),
    ("General Administration", 96),
]

CATEGORIES = [
    ("Waterlogging", "PWD", 8),
    ("Road Damage", "PWD", 7),
    ("Street Light", "PWD", 5),
    ("Garbage Collection", "MCD", 6),
    ("Air Pollution", "DPCC", 7),
    ("Water Supply", "DJB", 8),
    ("Sewage", "DJB", 7),
    ("Power Outage", "BSES", 8),
    ("Traffic", "Traffic Police", 6),
    ("Noise Pollution", "DPCC", 5),
]

COMPLAINT_TEMPLATES = [
    "Heavy waterlogging near {area} after rain, cars stuck for hours",
    "Pothole on main road in {area}, accident risk bahut zyada hai",
    "Street lights not working in {area} since 2 weeks, andhera rehta hai",
    "Garbage dump overflowing in {area}, badbu aur mosquitoes",
    "No water supply in {area} for 3 days, paani nahi aa raha",
    "Open sewage drain in {area}, health hazard for residents",
    "Power cut in {area} since morning, bijli nahi hai",
    "Illegal encroachment on footpath in {area}",
    "Traffic jam daily at {area} intersection, signal not working",
    "Construction noise at night in {area}, neend nahi aati",
    "Smog and pollution levels very high near {area}",
    "Hospital in {area} lacks basic facilities, patient ko dikkat",
    "{area} mein sadak tut gayi hai, turant repair chahiye",
    "Nali jam hai {area} mein, pani ghar mein aa raha hai",
]

AREAS = [
    "Dwarka", "Rohini", "Karol Bagh", "Lajpat Nagar", "Connaught Place",
    "Saket", "Janakpuri", "Pitampura", "Mayur Vihar", "Okhla",
    "Najafgarh", "Vasant Kunj", "Model Town", "Chandni Chowk", "Nehru Place",
]

STATUSES = [
    ComplaintStatus.submitted,
    ComplaintStatus.assigned,
    ComplaintStatus.in_progress,
    ComplaintStatus.resolved,
    ComplaintStatus.closed,
]

NAMES = [
    "Rajesh Kumar", "Priya Sharma", "Amit Singh", "Sunita Devi", "Vikram Patel",
    "Anjali Gupta", "Rahul Mehta", "Kavita Joshi", "Suresh Yadav", "Meera Reddy",
    "Arjun Malhotra", "Deepa Nair", "Sanjay Verma", "Pooja Agarwal", "Ravi Chopra",
]

STATUS_WEIGHTS = [0.15, 0.20, 0.25, 0.20, 0.20]


def seed_db(db: Session):
    if db.query(District).count() > 0:
        print("Database already seeded, skipping.")
        return

    district_objs = []
    for name, lat, lng in DISTRICTS:
        d = District(name=name, center_lat=lat, center_lng=lng)
        db.add(d)
        district_objs.append(d)
    db.flush()

    dept_objs = {}
    for name, sla in DEPARTMENTS:
        d = Department(name=name, sla_hours=sla)
        db.add(d)
        dept_objs[name] = d
    db.flush()

    cm_user = User(
        email="cm@delhi.gov",
        hashed_password=hash_password("cm123"),
        name="CM Office Admin",
        role=UserRole.cm_office,
    )
    pwd_user = User(
        email="pwd@delhi.gov",
        hashed_password=hash_password("pwd123"),
        name="PWD Officer",
        role=UserRole.dept_officer,
        department_id=dept_objs["PWD"].id,
    )
    db.add_all([cm_user, pwd_user])
    db.flush()

    random.seed(42)
    for i in range(300):
        area = random.choice(AREAS)
        template = random.choice(COMPLAINT_TEMPLATES)
        description = template.format(area=area)
        cat, dept_name, urgency = random.choice(CATEGORIES)
        district = random.choice(district_objs)
        status = random.choices(STATUSES, weights=STATUS_WEIGHTS)[0]

        citizen = Citizen(
            name=random.choice(NAMES),
            phone=f"98{random.randint(10000000, 99999999)}",
        )
        db.add(citizen)
        db.flush()

        days_ago = random.randint(0, 60)
        created = datetime.now(timezone.utc) - timedelta(days=days_ago, hours=random.randint(0, 23))

        lat = district.center_lat + random.uniform(-0.05, 0.05)
        lng = district.center_lng + random.uniform(-0.05, 0.05)

        complaint = Complaint(
            complaint_id=f"DEL-2026-{i + 1:05d}",
            citizen_id=citizen.id,
            district_id=district.id,
            department_id=dept_objs[dept_name].id,
            description=description,
            category=cat,
            urgency=urgency + random.randint(-1, 1),
            status=status,
            lat=lat,
            lng=lng,
            ai_reasoning=f"Auto-classified as {cat} with urgency {urgency}.",
            assigned_officer="PWD Officer" if status != ComplaintStatus.submitted else None,
            created_at=created,
        )
        if complaint.urgency < 1:
            complaint.urgency = 1
        if complaint.urgency > 10:
            complaint.urgency = 10

        if status in (ComplaintStatus.resolved, ComplaintStatus.closed):
            complaint.resolved_at = created + timedelta(hours=random.randint(4, 120))

        db.add(complaint)
        db.flush()

        history_statuses = []
        for s in STATUSES:
            history_statuses.append(s)
            if s == status:
                break
        for s in history_statuses:
            db.add(StatusHistory(
                complaint_id=complaint.id,
                status=s,
                officer_name="System" if s == ComplaintStatus.submitted else "Officer",
                note=f"Status updated to {s.value}",
                timestamp=created + timedelta(hours=STATUSES.index(s) * 6),
            ))

        if days_ago > 5 and status in (ComplaintStatus.submitted, ComplaintStatus.assigned, ComplaintStatus.in_progress):
            if random.random() < 0.3:
                db.add(EscalationLog(
                    complaint_id=complaint.id,
                    reason=f"SLA breach: unresolved for {days_ago * 24}h",
                    from_status=status.value,
                ))

    db.commit()
    print("Seeded 300 complaints, 11 districts, 9 departments, 2 users.")


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_db(db)
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
