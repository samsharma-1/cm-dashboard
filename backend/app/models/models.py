import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ComplaintStatus(str, enum.Enum):
    submitted = "submitted"
    assigned = "assigned"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"


class UserRole(str, enum.Enum):
    cm_office = "cm_office"
    dept_officer = "dept_officer"


class District(Base):
    __tablename__ = "districts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    center_lat: Mapped[float] = mapped_column(Float, nullable=False)
    center_lng: Mapped[float] = mapped_column(Float, nullable=False)

    complaints: Mapped[list["Complaint"]] = relationship(back_populates="district")


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    sla_hours: Mapped[int] = mapped_column(Integer, default=72)

    complaints: Mapped[list["Complaint"]] = relationship(back_populates="department")
    users: Mapped[list["User"]] = relationship(back_populates="department")


class Citizen(Base):
    __tablename__ = "citizens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)

    complaints: Mapped[list["Complaint"]] = relationship(back_populates="citizen")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(200), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False)
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"), nullable=True)

    department: Mapped["Department | None"] = relationship(back_populates="users")


class Complaint(Base):
    __tablename__ = "complaints"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    complaint_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    citizen_id: Mapped[int] = mapped_column(ForeignKey("citizens.id"), nullable=False)
    district_id: Mapped[int] = mapped_column(ForeignKey("districts.id"), nullable=False)
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    urgency: Mapped[int] = mapped_column(Integer, default=5)
    status: Mapped[ComplaintStatus] = mapped_column(
        Enum(ComplaintStatus), default=ComplaintStatus.submitted
    )
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ai_reasoning: Mapped[str | None] = mapped_column(Text, nullable=True)
    closure_otp: Mapped[str | None] = mapped_column(String(6), nullable=True)
    assigned_officer: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    citizen: Mapped["Citizen"] = relationship(back_populates="complaints")
    district: Mapped["District"] = relationship(back_populates="complaints")
    department: Mapped["Department | None"] = relationship(back_populates="complaints")
    status_history: Mapped[list["StatusHistory"]] = relationship(
        back_populates="complaint", order_by="StatusHistory.timestamp"
    )
    escalations: Mapped[list["EscalationLog"]] = relationship(back_populates="complaint")


class StatusHistory(Base):
    __tablename__ = "status_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    complaint_id: Mapped[int] = mapped_column(ForeignKey("complaints.id"), nullable=False)
    status: Mapped[ComplaintStatus] = mapped_column(Enum(ComplaintStatus), nullable=False)
    officer_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    complaint: Mapped["Complaint"] = relationship(back_populates="status_history")


class EscalationLog(Base):
    __tablename__ = "escalation_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    complaint_id: Mapped[int] = mapped_column(ForeignKey("complaints.id"), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    from_status: Mapped[str] = mapped_column(String(50), nullable=False)
    to_status: Mapped[str] = mapped_column(String(50), default="escalated")
    escalated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    complaint: Mapped["Complaint"] = relationship(back_populates="escalations")
