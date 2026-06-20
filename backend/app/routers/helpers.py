from app.schemas.schemas import ComplaintResponse, StatusHistoryResponse
from app.models.models import Complaint


def complaint_to_response(c: Complaint) -> ComplaintResponse:
    return ComplaintResponse(
        id=c.id,
        complaint_id=c.complaint_id,
        citizen_name=c.citizen.name,
        citizen_phone=c.citizen.phone,
        district_id=c.district_id,
        district_name=c.district.name,
        department_id=c.department_id,
        department_name=c.department.name if c.department else None,
        description=c.description,
        category=c.category,
        urgency=c.urgency,
        status=c.status,
        lat=c.lat,
        lng=c.lng,
        photo_url=c.photo_url,
        ai_reasoning=c.ai_reasoning,
        assigned_officer=c.assigned_officer,
        closure_otp=c.closure_otp if c.status.value == "resolved" else None,
        created_at=c.created_at,
        resolved_at=c.resolved_at,
        status_history=[
            StatusHistoryResponse.model_validate(h) for h in c.status_history
        ],
    )
