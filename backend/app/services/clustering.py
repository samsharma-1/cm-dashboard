import math
from collections import defaultdict

from app.schemas.schemas import HotspotCluster

EARTH_RADIUS_M = 6371000
CLUSTER_RADIUS_M = 300


def haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(a))


def cluster_complaints(complaints: list[dict]) -> list[HotspotCluster]:
    """Group complaints within 300m with same category into hotspot events."""
    used: set[int] = set()
    clusters: list[HotspotCluster] = []

    for i, c in enumerate(complaints):
        if i in used:
            continue
        group = [c]
        used.add(i)
        for j, other in enumerate(complaints):
            if j in used or other["category"] != c["category"]:
                continue
            if haversine_m(c["lat"], c["lng"], other["lat"], other["lng"]) <= CLUSTER_RADIUS_M:
                group.append(other)
                used.add(j)

        if len(group) >= 2:
            avg_lat = sum(g["lat"] for g in group) / len(group)
            avg_lng = sum(g["lng"] for g in group) / len(group)
            avg_urgency = sum(g["urgency"] for g in group) / len(group)
            clusters.append(
                HotspotCluster(
                    id=f"HS-{c['category'][:3].upper()}-{int(avg_lat * 1000)}",
                    category=c["category"],
                    district_name=group[0]["district_name"],
                    count=len(group),
                    avg_urgency=round(avg_urgency, 1),
                    center_lat=avg_lat,
                    center_lng=avg_lng,
                    complaint_ids=[g["complaint_id"] for g in group],
                )
            )

    clusters.sort(key=lambda x: x.count, reverse=True)
    return clusters
