import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDistricts, submitComplaint, uploadImage } from '../api/client'
import type { District } from '../types'

export default function FileComplaint() {
  const [districts, setDistricts] = useState<District[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ id: string; category: string; urgency: number } | null>(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', district_id: '', description: '' })
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    getDistricts().then(setDistricts).catch(() => setError('Failed to load districts'))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let photo_url = undefined
      if (file) {
        const uploadRes = await uploadImage(file)
        photo_url = uploadRes.url
      }

      const data = await submitComplaint({
        name: form.name,
        phone: form.phone,
        district_id: Number(form.district_id),
        description: form.description,
        photo_url,
      })
      setResult({ id: data.complaint_id, category: data.category, urgency: data.urgency })
    } catch {
      setError('Failed to submit complaint. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-green-700 mb-2">Complaint Submitted!</h2>
          <p className="text-gray-600 mb-4">Your complaint has been registered and AI-classified.</p>
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-500">Complaint ID</p>
            <p className="text-2xl font-mono font-bold text-blue-800">{result.id}</p>
            <p className="text-sm mt-2">Category: <strong>{result.category}</strong> · Urgency: <strong>{result.urgency}/10</strong></p>
          </div>
          <Link to={`/track?id=${result.id}`} className="block w-full rounded-lg bg-blue-700 text-white py-2.5 font-medium hover:bg-blue-800">
            Track This Complaint
          </Link>
          <Link to="/" className="block mt-3 text-sm text-gray-500 hover:text-gray-700">Back to Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-blue-900 text-white px-6 py-4">
        <Link to="/" className="text-sm hover:underline">← Back</Link>
        <h1 className="text-xl font-bold mt-1">File a Complaint</h1>
      </header>
      <main className="max-w-xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
          {error && <div className="rounded bg-red-50 text-red-700 p-3 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input required className="w-full border rounded-lg px-3 py-2" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Rajesh Kumar" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input required type="tel" className="w-full border rounded-lg px-3 py-2" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">District</label>
            <select required className="w-full border rounded-lg px-3 py-2" value={form.district_id}
              onChange={(e) => setForm({ ...form, district_id: e.target.value })}>
              <option value="">Select district</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Complaint Description</label>
            <textarea required rows={5} className="w-full border rounded-lg px-3 py-2" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe your issue in Hindi, English, or Hinglish..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Attach Image (Optional)</label>
            <input type="file" accept="image/*" className="w-full border rounded-lg px-3 py-2"
              onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-orange-500 hover:bg-orange-600 text-white py-2.5 font-semibold disabled:opacity-50">
            {loading ? 'Submitting & Classifying...' : 'Submit Complaint'}
          </button>
        </form>
      </main>
    </div>
  )
}
