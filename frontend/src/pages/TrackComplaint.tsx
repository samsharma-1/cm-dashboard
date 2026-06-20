import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { trackComplaint, verifyOtp } from '../api/client'
import type { Complaint } from '../types'
import { EmptyState, LoadingSpinner, StatusBadge, StatusTimeline, UrgencyBadge } from '../components/UI'

export default function TrackComplaint() {
  const [params] = useSearchParams()
  const [complaintId, setComplaintId] = useState(params.get('id') || '')
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [otp, setOtp] = useState('')
  const [otpMsg, setOtpMsg] = useState('')

  const search = async (id?: string) => {
    const cid = (id || complaintId).trim().toUpperCase()
    if (!cid) return
    setError('')
    setLoading(true)
    setComplaint(null)
    try {
      const data = await trackComplaint(cid)
      setComplaint(data)
    } catch {
      setError('Complaint not found. Please check your DEL-ID.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (params.get('id')) search(params.get('id')!)
  }, [])

  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!complaint) return
    setOtpMsg('')
    try {
      const updated = await verifyOtp(complaint.id, otp)
      setComplaint(updated)
      setOtpMsg('Complaint closed successfully. Thank you for confirming resolution!')
      setOtp('')
    } catch {
      setOtpMsg('Invalid OTP. Please check the code sent when your complaint was resolved.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-blue-900 text-white px-6 py-4">
        <Link to="/" className="text-sm hover:underline">← Back</Link>
        <h1 className="text-xl font-bold mt-1">Track Your Complaint</h1>
      </header>
      <main className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded-lg px-3 py-2 font-mono"
              placeholder="DEL-2026-00001"
              value={complaintId}
              onChange={(e) => setComplaintId(e.target.value)}
            />
            <button onClick={() => search()} className="rounded-lg bg-blue-700 text-white px-4 py-2 font-medium hover:bg-blue-800">
              Track
            </button>
          </div>
        </div>

        {loading && <LoadingSpinner />}
        {error && <EmptyState message={error} />}

        {complaint && (
          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-mono font-bold text-blue-800">{complaint.complaint_id}</h2>
              <StatusBadge status={complaint.status} />
              <UrgencyBadge urgency={complaint.urgency} />
            </div>
            <p className="text-gray-700">{complaint.description}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Category:</span> {complaint.category}</div>
              <div><span className="text-gray-500">District:</span> {complaint.district_name}</div>
              <div><span className="text-gray-500">Department:</span> {complaint.department_name || 'Pending'}</div>
              <div><span className="text-gray-500">Filed:</span> {new Date(complaint.created_at).toLocaleDateString()}</div>
            </div>
            {complaint.ai_reasoning && (
              <div className="rounded-lg bg-purple-50 p-3 text-sm text-purple-800">
                <strong>AI Analysis:</strong> {complaint.ai_reasoning}
              </div>
            )}
            <div>
              <h3 className="font-semibold mb-3">Status Timeline</h3>
              <StatusTimeline history={complaint.status_history} />
            </div>
            {complaint.status === 'resolved' && (
              <form onSubmit={handleOtp} className="border-t pt-4">
                <h3 className="font-semibold mb-2">Confirm Resolution (OTP)</h3>
                <p className="text-sm text-gray-500 mb-3">
                  Enter the 6-digit OTP sent when your complaint was marked resolved.
                </p>

                <div className="flex gap-2">
                  <input
                    className="border rounded-lg px-3 py-2 font-mono w-40"
                    maxLength={6}
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                  <button type="submit" className="rounded-lg bg-green-600 text-white px-4 py-2 hover:bg-green-700">
                    Verify & Close
                  </button>
                </div>
                {otpMsg && <p className="text-sm mt-2 text-green-700">{otpMsg}</p>}
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
