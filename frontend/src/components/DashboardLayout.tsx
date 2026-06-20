import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LoadingSpinner } from './UI'

const navItems = [
  { to: '/dashboard', label: 'Complaints', roles: ['cm_office', 'dept_officer'] },
  { to: '/dashboard/map', label: 'Heatmap', roles: ['cm_office', 'dept_officer'] },
  { to: '/dashboard/analytics', label: 'Analytics', roles: ['cm_office', 'dept_officer'] },
  { to: '/dashboard/executive', label: 'CM Executive', roles: ['cm_office'] },
]

export default function DashboardLayout() {
  const { user, loading, logout } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="w-56 bg-blue-900 text-white flex flex-col shrink-0">
        <div className="p-4 border-b border-blue-800">
          <h1 className="font-bold text-sm leading-tight">Delhi CM<br />Grievance Dashboard</h1>
          <p className="text-xs text-blue-300 mt-1">{user.name}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.filter((n) => n.roles.includes(user.role)).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`block rounded-lg px-3 py-2 text-sm transition ${
                location.pathname === item.to
                  ? 'bg-orange-500 text-white font-medium'
                  : 'text-blue-100 hover:bg-blue-800'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-blue-800">
          <button onClick={logout} className="w-full text-left text-sm text-blue-300 hover:text-white px-3 py-2">
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
