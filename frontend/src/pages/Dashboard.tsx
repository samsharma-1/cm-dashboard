import { useEffect, useState } from 'react'
import { getDepartments, listComplaints, updateComplaintStatus } from '../api/client'
import type { Complaint, ComplaintStatus, Department } from '../types'
import { EmptyState, LoadingSpinner, StatusBadge, StatusPipeline, UrgencyBadge } from '../components/UI'

export default function Dashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [departments, setDepartments] = useState<Department[]>([])
  const [selected, setSelected] = useState<Complaint | null>(null)
  const [filters, setFilters] = useState({ district_id: '', category: '', status: '', min_urgency: '' })
  const [updateNote, setUpdateNote] = useState('')
  const [lastOtp, setLastOtp] = useState('')

  const load = () => {
    setLoading(true)
    const params: Record<string, string | number> = {}
    if (filters.district_id) params.district_id = filters.district_id
    if (filters.category) params.category = filters.category
    if (filters.status) params.status = filters.status
    if (filters.min_urgency) params.min_urgency = filters.min_urgency
    listComplaints(params)
      .then((d) => { setComplaints(d.items); setTotal(d.total) })
      .catch(() => setComplaints([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    getDepartments().then(setDepartments)
    load()
  }, [])

  const handleStatusUpdate = async (status: ComplaintStatus, deptId?: number) => {
    if (!selected) return
    try {
      const updated = await updateComplaintStatus(selected.id, {
        status,
        department_id: deptId || selected.department_id || undefined,
        note: updateNote || `Status changed to ${status}`,
      })
      setSelected(updated)
      setUpdateNote('')
      if (status === 'resolved') {
        setLastOtp('OTP sent to citizen via SMS for resolution confirmation.')
      }
      load()
    } catch {
      alert('Failed to update status')
    }
  }

  const categories = [...new Set(complaints.map((c) => c.category))]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Complaint Management</h1>
        <p className="text-gray-500 text-sm">{total} complaints total</p>
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-4 flex flex-wrap gap-3">
        <select className="border rounded-lg px-3 py-1.5 text-sm" value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Statuses</option>
          {['submitted', 'assigned', 'in_progress', 'resolved', 'closed'].map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
        <select className="border rounded-lg px-3 py-1.5 text-sm" value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="border rounded-lg px-3 py-1.5 text-sm" value={filters.min_urgency}
          onChange={(e) => setFilters({ ...filters, min_urgency: e.target.value })}>
          <option value="">Any Urgency</option>
          <option value="7">High (7+)</option>
          <option value="4">Medium (4+)</option>
        </select>
        <button onClick={load} className="rounded-lg bg-blue-700 text-white px-4 py-1.5 text-sm hover:bg-blue-800">
          Apply Filters
        </button>
      </div>

      {loading ? <LoadingSpinner /> : complaints.length === 0 ? (
        <EmptyState message="No complaints match your filters." />
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">District</th>
                <th className="px-4 py-3">Urgency</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Pipeline</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={c.id} onClick={() => setSelected(c)}
                  className="border-t hover:bg-blue-50 cursor-pointer">
                  <td className="px-4 py-3 font-mono text-blue-700">{c.complaint_id}</td>
                  <td className="px-4 py-3">{c.category}</td>
                  <td className="px-4 py-3">{c.district_name}</td>
                  <td className="px-4 py-3"><UrgencyBadge urgency={c.urgency} /></td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3"><StatusPipeline current={c.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="font-mono font-bold text-blue-800">{selected.complaint_id}</h2>
                <StatusBadge status={selected.status} />
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <p className="text-gray-700 mb-3">{selected.description}</p>
            <div className="text-sm space-y-1 mb-4 text-gray-600">
              <p>Citizen: {selected.citizen_name} ({selected.citizen_phone})</p>
              <p>Department: {selected.department_name || 'Unassigned'}</p>
              {selected.ai_reasoning && <p className="text-purple-700">AI: {selected.ai_reasoning}</p>}
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium">Assign Department</label>
              <select className="w-full border rounded-lg px-3 py-2 mt-1" defaultValue={selected.department_id || ''}
                onChange={(e) => setSelected({ ...selected, department_id: Number(e.target.value) })}>
                <option value="">Select</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name} (SLA: {d.sla_hours}h)</option>)}
              </select>
            </div>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm mb-3" rows={2}
              placeholder="Note for status update..." value={updateNote} onChange={(e) => setUpdateNote(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              {(['assigned', 'in_progress', 'resolved', 'closed'] as ComplaintStatus[]).map((s) => (
                <button key={s} onClick={() => handleStatusUpdate(s, selected.department_id || undefined)}
                  className="rounded-lg bg-blue-700 text-white px-3 py-1.5 text-sm hover:bg-blue-800 capitalize">
                  → {s.replace('_', ' ')}
                </button>
              ))}
            </div>
            {lastOtp && selected.status === 'resolved' && (
              <p className="mt-3 text-sm text-green-700">{lastOtp}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
