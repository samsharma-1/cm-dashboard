import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { getHotspots, getMapPoints } from '../api/client'
import type { HotspotCluster, MapPoint } from '../types'
import { LoadingSpinner } from '../components/UI'

function urgencyColor(u: number): string {
  if (u >= 7) return '#ef4444'
  if (u >= 4) return '#eab308'
  return '#22c55e'
}

export function DelhiHeatmap({ points }: { points: MapPoint[] }) {
  return (
    <MapContainer center={[28.6139, 77.2090]} zoom={11} className="h-full w-full rounded-xl">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((p) => (
        <CircleMarker
          key={p.id}
          center={[p.lat, p.lng]}
          radius={6 + p.urgency}
          pathOptions={{ color: urgencyColor(p.urgency), fillColor: urgencyColor(p.urgency), fillOpacity: 0.6 }}
        >
          <Popup>
            <strong>{p.complaint_id}</strong><br />
            {p.category} · {p.district_name}<br />
            Urgency: {p.urgency}/10
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}

export function HotspotPanel({ hotspots }: { hotspots: HotspotCluster[] }) {
  if (!hotspots.length) {
    return <p className="text-sm text-gray-500">No hotspot clusters detected (need 2+ complaints within 300m).</p>
  }
  return (
    <div className="space-y-3">
      {hotspots.slice(0, 10).map((h) => (
        <div key={h.id} className="rounded-lg border border-orange-200 bg-orange-50 p-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-orange-900">{h.count}× {h.category}</p>
              <p className="text-sm text-orange-700">{h.district_name} · Avg urgency {h.avg_urgency}</p>
            </div>
            <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded">Hotspot</span>
          </div>
          <p className="text-xs text-gray-500 mt-1 font-mono truncate">{h.complaint_ids.slice(0, 3).join(', ')}...</p>
        </div>
      ))}
    </div>
  )
}

export default function MapPage() {
  const [points, setPoints] = useState<MapPoint[]>([])
  const [hotspots, setHotspots] = useState<HotspotCluster[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getMapPoints(), getHotspots()])
      .then(([pts, hs]) => { setPoints(pts); setHotspots(hs) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-6 h-full">
      <h1 className="text-2xl font-bold mb-4">Delhi Complaint Heatmap</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
        <div className="lg:col-span-2 h-full min-h-[400px] shadow rounded-xl overflow-hidden">
          <DelhiHeatmap points={points} />
        </div>
        <div className="bg-white rounded-xl shadow p-4 overflow-y-auto">
          <h2 className="font-semibold mb-3">Systemic Hotspot Events</h2>
          <p className="text-xs text-gray-500 mb-3">Clusters within 300m radius, same category</p>
          <HotspotPanel hotspots={hotspots} />
        </div>
      </div>
      <div className="mt-3 flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Low urgency</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" /> Medium</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> High</span>
      </div>
    </div>
  )
}
