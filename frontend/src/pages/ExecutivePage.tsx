import { useEffect, useState } from 'react'
import jsPDF from 'jspdf'
import {
  getDepartmentScorecards,
  getEscalations,
  getHotspots,
  getOverview,
} from '../api/client'
import type {
  DepartmentScorecard,
  EscalationFeedItem,
  HotspotCluster,
  OverviewStats,
} from '../types'
import { HotspotPanel } from './MapPage'
import { LoadingSpinner } from '../components/UI'

function KPIBar({ stats }: { stats: OverviewStats }) {
  const cards = [
    { label: 'Open Complaints', value: stats.total_open, color: 'border-blue-500' },
    { label: 'Resolved Today', value: stats.resolved_today, color: 'border-green-500' },
    { label: 'Escalated', value: stats.escalated, color: 'border-red-500' },
    { label: 'Avg Resolution (hrs)', value: stats.avg_resolution_hours, color: 'border-orange-500' },
  ]
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className={`bg-white rounded-xl shadow p-4 border-l-4 ${c.color}`}>
          <p className="text-sm text-gray-500">{c.label}</p>
          <p className="text-3xl font-bold text-gray-900">{c.value}</p>
        </div>
      ))}
    </div>
  )
}

function exportPDF(stats: OverviewStats, depts: DepartmentScorecard[]) {
  const doc = new jsPDF()
  doc.setFontSize(18)
  doc.text('Delhi CM Grievance - Weekly Summary', 14, 20)
  doc.setFontSize(11)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28)
  doc.text(`Open: ${stats.total_open} | Resolved Today: ${stats.resolved_today} | Escalated: ${stats.escalated}`, 14, 36)
  doc.text(`Avg Resolution: ${stats.avg_resolution_hours} hours`, 14, 44)
  doc.text('Department Performance:', 14, 56)
  let y = 64
  depts.forEach((d) => {
    doc.text(`${d.department_name}: ${d.resolution_rate}% resolved, ${d.backlog} backlog`, 14, y)
    y += 8
  })
  doc.save('delhi-cm-weekly-report.pdf')
}

export default function ExecutivePage() {
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [escalations, setEscalations] = useState<EscalationFeedItem[]>([])
  const [hotspots, setHotspots] = useState<HotspotCluster[]>([])
  const [depts, setDepts] = useState<DepartmentScorecard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getOverview(), getEscalations(), getHotspots(), getDepartmentScorecards()])
      .then(([s, e, h, d]) => { setStats(s); setEscalations(e); setHotspots(h); setDepts(d) })
      .finally(() => setLoading(false))
  }, [])

  if (loading || !stats) return <LoadingSpinner />

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">CM Executive War Room</h1>
          <p className="text-gray-500 text-sm">Live accountability dashboard</p>
        </div>
        <button onClick={() => exportPDF(stats, depts)}
          className="rounded-lg bg-blue-700 text-white px-4 py-2 text-sm hover:bg-blue-800">
          Export Weekly PDF
        </button>
      </div>

      <KPIBar stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3">Escalation Feed</h2>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {escalations.length === 0 ? (
              <p className="text-sm text-gray-500">No escalations.</p>
            ) : escalations.map((e) => (
              <div key={e.id} className="border-l-4 border-red-500 bg-red-50 p-3 rounded-r-lg text-sm">
                <p className="font-mono font-semibold text-red-800">{e.complaint_id}</p>
                <p>{e.category} · {e.district_name} · Urgency {e.urgency}</p>
                <p className="text-red-600">{e.reason}</p>
                <p className="text-xs text-gray-500">{new Date(e.escalated_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3">Top Systemic Hotspots</h2>
          <HotspotPanel hotspots={hotspots.slice(0, 5)} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Department Scorecards</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Resolved</th>
              <th className="px-4 py-3">Resolution %</th>
              <th className="px-4 py-3">Backlog</th>
              <th className="px-4 py-3">Avg Hours</th>
            </tr>
          </thead>
          <tbody>
            {depts.map((d) => (
              <tr key={d.department_name} className="border-t">
                <td className="px-4 py-3 font-medium">{d.department_name}</td>
                <td className="px-4 py-3">{d.total}</td>
                <td className="px-4 py-3">{d.resolved}</td>
                <td className="px-4 py-3">
                  <span className={`font-semibold ${d.resolution_rate >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                    {d.resolution_rate}%
                  </span>
                </td>
                <td className="px-4 py-3">{d.backlog}</td>
                <td className="px-4 py-3">{d.avg_resolution_hours}h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
