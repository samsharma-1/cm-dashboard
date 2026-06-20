import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts'
import { getByCategory, getByDistrict, getTimeseries } from '../api/client'
import type { CategoryStats, DistrictStats, TimeseriesPoint } from '../types'
import { LoadingSpinner } from '../components/UI'

export default function AnalyticsPage() {
  const [categories, setCategories] = useState<CategoryStats[]>([])
  const [districts, setDistricts] = useState<DistrictStats[]>([])
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getByCategory(), getByDistrict(), getTimeseries()])
      .then(([c, d, t]) => { setCategories(c); setDistricts(d); setTimeseries(t) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Analytics Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-4">Complaints by Category</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={categories}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={70} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-4">Daily Volume (30 days)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={timeseries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#ea580c" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="font-semibold mb-4">District Leaderboard (Open Complaints)</h2>
        <ResponsiveContainer width="100%" height={Math.max(300, districts.length * 36)}>
          <BarChart data={districts} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="district_name" type="category" width={120} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="open_count" fill="#dc2626" name="Open" radius={[0, 4, 4, 0]} />
            <Bar dataKey="resolved_count" fill="#16a34a" name="Resolved" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
