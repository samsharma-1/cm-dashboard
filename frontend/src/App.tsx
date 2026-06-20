import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import DashboardLayout from './components/DashboardLayout'
import Landing from './pages/Landing'
import FileComplaint from './pages/FileComplaint'
import TrackComplaint from './pages/TrackComplaint'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MapPage from './pages/MapPage'
import AnalyticsPage from './pages/AnalyticsPage'
import ExecutivePage from './pages/ExecutivePage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/file" element={<FileComplaint />} />
          <Route path="/track" element={<TrackComplaint />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="map" element={<MapPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="executive" element={<ExecutivePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
