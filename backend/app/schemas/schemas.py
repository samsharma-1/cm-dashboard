from datetime import datetime

from pydantic import BaseModel, Field

from app.models.models import ComplaintStatus, UserRole


class ComplaintCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    phone: str = Field(min_length=10, max_length=15)
    district_id: int
    description: str = Field(min_length=10)
    lat: float | None = None
    lng: float | None = None
    photo_url: str | None = None


class StatusUpdate(BaseModel):
    status: ComplaintStatus
    department_id: int | None = None
    officer_name: str | None = None
    note: str | None = None


class OTPVerify(BaseModel):
    otp: str = Field(min_length=6, max_length=6)


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: UserRole
    department_id: int | None = None

    model_config = {"from_attributes": True}


class StatusHistoryResponse(BaseModel):
    id: int
    status: ComplaintStatus
    officer_name: str | None
    note: str | None
    timestamp: datetime

    model_config = {"from_attributes": True}


class ComplaintResponse(BaseModel):
    id: int
    complaint_id: str
    citizen_name: str
    citizen_phone: str
    district_id: int
    district_name: str
    department_id: int | None
    department_name: str | None
    description: str
    category: str
    urgency: int
    status: ComplaintStatus
    lat: float
    lng: float
    photo_url: str | None
    ai_reasoning: str | None
    closure_otp: str | None = None
    assigned_officer: str | None
    created_at: datetime
    resolved_at: datetime | None
    status_history: list[StatusHistoryResponse] = []

    model_config = {"from_attributes": True}


class ComplaintListResponse(BaseModel):
    items: list[ComplaintResponse]
    total: int


class DistrictResponse(BaseModel):
    id: int
    name: str
    center_lat: float
    center_lng: float

    model_config = {"from_attributes": True}


class DepartmentResponse(BaseModel):
    id: int
    name: str
    sla_hours: int

    model_config = {"from_attributes": True}


class ClassificationResult(BaseModel):
    category: str
    urgency: int
    department: str
    reasoning: str


class OverviewStats(BaseModel):
    total_open: int
    resolved_today: int
    escalated: int
    avg_resolution_hours: float


class DistrictStats(BaseModel):
    district_name: str
    total: int
    open_count: int
    resolved_count: int


class CategoryStats(BaseModel):
    category: str
    count: int


class TimeseriesPoint(BaseModel):
    date: str
    count: int


class HotspotCluster(BaseModel):
    id: str
    category: str
    district_name: str
    count: int
    avg_urgency: float
    center_lat: float
    center_lng: float
    complaint_ids: list[str]


class EscalationFeedItem(BaseModel):
    id: int
    complaint_id: str
    category: str
    district_name: str
    reason: str
    urgency: int
    escalated_at: datetime


class DepartmentScorecard(BaseModel):
    department_name: str
    total: int
    resolved: int
    resolution_rate: float
    backlog: int
    avg_resolution_hours: float
