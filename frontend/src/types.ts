export type ComplaintStatus =
  | 'submitted'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'closed'

export interface StatusHistory {
  id: number
  status: ComplaintStatus
  officer_name: string | null
  note: string | null
  timestamp: string
}

export interface Complaint {
  id: number
  complaint_id: string
  citizen_name: string
  citizen_phone: string
  district_id: number
  district_name: string
  department_id: number | null
  department_name: string | null
  description: string
  category: string
  urgency: number
  status: ComplaintStatus
  lat: number
  lng: number
  photo_url: string | null
  ai_reasoning: string | null
  assigned_officer: string | null
  closure_otp?: string | null
  created_at: string
  resolved_at: string | null
  status_history: StatusHistory[]
}

export interface District {
  id: number
  name: string
  center_lat: number
  center_lng: number
}

export interface Department {
  id: number
  name: string
  sla_hours: number
}

export interface User {
  id: number
  email: string
  name: string
  role: 'cm_office' | 'dept_officer'
  department_id: number | null
}

export interface OverviewStats {
  total_open: number
  resolved_today: number
  escalated: number
  avg_resolution_hours: number
}

export interface DistrictStats {
  district_name: string
  total: number
  open_count: number
  resolved_count: number
}

export interface CategoryStats {
  category: string
  count: number
}

export interface TimeseriesPoint {
  date: string
  count: number
}

export interface HotspotCluster {
  id: string
  category: string
  district_name: string
  count: number
  avg_urgency: number
  center_lat: number
  center_lng: number
  complaint_ids: string[]
}

export interface EscalationFeedItem {
  id: number
  complaint_id: string
  category: string
  district_name: string
  reason: string
  urgency: number
  escalated_at: string
}

export interface DepartmentScorecard {
  department_name: string
  total: number
  resolved: number
  resolution_rate: number
  backlog: number
  avg_resolution_hours: number
}

export interface MapPoint {
  id: number
  complaint_id: string
  lat: number
  lng: number
  urgency: number
  category: string
  district_name: string
  status: string
}

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  submitted: 'Submitted',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

export const STATUS_ORDER: ComplaintStatus[] = [
  'submitted',
  'assigned',
  'in_progress',
  'resolved',
  'closed',
]
