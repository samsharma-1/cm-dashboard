import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api/client'
import { getMe } from '../api/client'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [email, setEmail] = useState('cm@delhi.gov')
  const [password, setPassword] = useState('cm123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      const user = await getMe()
      setUser(user)
      navigate('/dashboard')
    } catch {
      setError('Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-blue-900 mb-1">Admin Login</h1>
        <p className="text-gray-500 text-sm mb-6">Delhi CM Grievance Dashboard</p>
        {error && <div className="mb-4 rounded bg-red-50 text-red-700 p-3 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" required className="w-full border rounded-lg px-3 py-2" value={email}
              onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" required className="w-full border rounded-lg px-3 py-2" value={password}
              onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-blue-700 text-white py-2.5 font-semibold hover:bg-blue-800 disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="mt-4 text-xs text-gray-400 space-y-1">
          <p>Demo: cm@delhi.gov / cm123 (CM Office)</p>
          <p>Demo: pwd@delhi.gov / pwd123 (PWD Officer)</p>
        </div>
        <Link to="/" className="block text-center mt-4 text-sm text-gray-500 hover:text-gray-700">
          ← Back to Portal
        </Link>
      </div>
    </div>
  )
}
