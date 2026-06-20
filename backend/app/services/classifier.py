import json
import re

from app.config import settings
from app.schemas.schemas import ClassificationResult

DEPARTMENT_MAP = {
    "Waterlogging": "PWD",
    "Road Damage": "PWD",
    "Street Light": "PWD",
    "Garbage Collection": "MCD",
    "Sanitation": "MCD",
    "Air Pollution": "DPCC",
    "Water Supply": "DJB",
    "Sewage": "DJB",
    "Power Outage": "BSES",
    "Traffic": "Traffic Police",
    "Noise Pollution": "DPCC",
    "Encroachment": "MCD",
    "Healthcare": "Health Dept",
    "Education": "Education Dept",
    "Other": "General Administration",
}

KEYWORD_RULES = [
    (r"paani|waterlog|flood|barish|jal|pani|water", "Waterlogging", 8),
    (r"sadak|road|pothole|gaddha|footpath", "Road Damage", 7),
    (r"light|bijli|street.?light|andhera|lamp", "Street Light", 5),
    (r"kachra|garbage|waste|dump|sanitation|safai", "Garbage Collection", 6),
    (r"pollution|smog|hawa|air|dhua", "Air Pollution", 7),
    (r"supply|nalki|tap|pipeline|paani nahi", "Water Supply", 8),
    (r"sewer|drain|nali|gutter", "Sewage", 7),
    (r"power|bijli|electricity|outage", "Power Outage", 8),
    (r"traffic|jam|signal|parking", "Traffic", 6),
    (r"noise|shor|loud|construction", "Noise Pollution", 5),
    (r"encroach|illegal|hawker|vendor", "Encroachment", 5),
    (r"hospital|doctor|health|ambulance", "Healthcare", 9),
    (r"school|education|teacher", "Education", 6),
]


def _keyword_classify(text: str) -> ClassificationResult:
    text_lower = text.lower()
    for pattern, category, urgency in KEYWORD_RULES:
        if re.search(pattern, text_lower):
            dept = DEPARTMENT_MAP.get(category, "General Administration")
            return ClassificationResult(
                category=category,
                urgency=urgency,
                department=dept,
                reasoning=f"Keyword match classified as {category} (fallback classifier).",
            )
    return ClassificationResult(
        category="Other",
        urgency=5,
        department="General Administration",
        reasoning="No specific keywords matched; default classification applied.",
    )


async def classify_complaint(text: str) -> ClassificationResult:
    if not settings.anthropic_api_key:
        return _keyword_classify(text)

    try:
        import anthropic

        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=256,
            messages=[
                {
                    "role": "user",
                    "content": f"""Classify this Delhi citizen complaint. Text may be Hindi, English, or Hinglish.

Complaint: {text}

Respond with ONLY valid JSON (no markdown):
{{"category": "<one of: Waterlogging, Road Damage, Street Light, Garbage Collection, Sanitation, Air Pollution, Water Supply, Sewage, Power Outage, Traffic, Noise Pollution, Encroachment, Healthcare, Education, Other>",
"urgency": <integer 1-10>,
"department": "<one of: PWD, MCD, DJB, BSES, DPCC, Traffic Police, Health Dept, Education Dept, General Administration>",
"reasoning": "<one sentence>"}}""",
                }
            ],
        )
        raw = message.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        data = json.loads(raw)
        return ClassificationResult(
            category=data.get("category", "Other"),
            urgency=max(1, min(10, int(data.get("urgency", 5)))),
            department=data.get("department", "General Administration"),
            reasoning=data.get("reasoning", "AI classification"),
        )
    except Exception:
        return _keyword_classify(text)
