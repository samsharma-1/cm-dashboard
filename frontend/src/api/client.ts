import axios from 'axios'
import type {
  CategoryStats,
  Complaint,
  Department,
  DepartmentScorecard,
  District,
  DistrictStats,
  EscalationFeedItem,
  HotspotCluster,
  MapPoint,
  OverviewStats,
  TimeseriesPoint,
  User,
} from '../types'

const API_BASE = import.meta.env.VITE_API_URL || ''

const api = axios.create({ baseURL: API_BASE })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export async function login(email: string, password: string) {
  const { data } = await api.post<{ access_token: string }>('/api/auth/login', { email, password })
  localStorage.setItem('token', data.access_token)
  return data
}

export async function getMe(): Promise<User> {
  const { data } = await api.get('/api/auth/me')
  return data
}

export function logout() {
  localStorage.removeItem('token')
}

export async function getDistricts(): Promise<District[]> {
  const { data } = await api.get('/api/meta/districts')
  return data
}

export async function getDepartments(): Promise<Department[]> {
  const { data } = await api.get('/api/meta/departments')
  return data
}

export async function submitComplaint(payload: {
  name: string
  phone: string
  district_id: number
  description: string
  photo_url?: string
}) {
  const { data } = await api.post<Complaint>('/api/complaints', payload)
  return data
}

export async function uploadImage(file: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post<{ url: string }>('/api/uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function trackComplaint(complaintId: string) {
  const { data } = await api.get<Complaint>(`/api/complaints/track/${complaintId}`)
  return data
}

export async function verifyOtp(id: number, otp: string) {
  const { data } = await api.post<Complaint>(`/api/complaints/${id}/verify-otp`, { otp })
  return data
}

export async function listComplaints(params: Record<string, string | number | undefined>) {
  const { data } = await api.get<{ items: Complaint[]; total: number }>('/api/complaints', { params })
  return data
}

export async function updateComplaintStatus(
  id: number,
  payload: { status: string; department_id?: number; officer_name?: string; note?: string }
) {
  const { data } = await api.patch<Complaint>(`/api/complaints/${id}/status`, payload)
  return data
}

export async function getOverview(): Promise<OverviewStats> {
  const { data } = await api.get('/api/analytics/overview')
  return data
}

export async function getByDistrict(): Promise<DistrictStats[]> {
  const { data } = await api.get('/api/analytics/by-district')
  return data
}

export async function getByCategory(): Promise<CategoryStats[]> {
  const { data } = await api.get('/api/analytics/by-category')
  return data
}

export async function getTimeseries(): Promise<TimeseriesPoint[]> {
  const { data } = await api.get('/api/analytics/timeseries')
  return data
}

export async function getHotspots(): Promise<HotspotCluster[]> {
  const { data } = await api.get('/api/analytics/hotspots')
  return data
}

export async function getMapPoints(): Promise<MapPoint[]> {
  const { data } = await api.get('/api/analytics/map-points')
  return data
}

export async function getEscalations(): Promise<EscalationFeedItem[]> {
  const { data } = await api.get('/api/analytics/escalations')
  return data
}

export async function getDepartmentScorecards(): Promise<DepartmentScorecard[]> {
  const { data } = await api.get('/api/analytics/departments')
  return data
}

export default api
