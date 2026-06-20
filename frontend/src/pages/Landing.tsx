import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-orange-600">
      <header className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="text-white font-bold text-xl">Delhi CM Grievance Portal</div>
        <Link to="/login" className="text-white/90 hover:text-white text-sm underline">
          Admin Login
        </Link>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-20 text-center text-white">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Your Voice, Heard by the Chief Minister
        </h1>
        <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
          File grievances about water, roads, sanitation, power, and more across all 11 Delhi districts.
          AI-powered routing ensures your complaint reaches the right department fast.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/file"
            className="rounded-lg bg-orange-500 hover:bg-orange-600 px-8 py-3 font-semibold text-white shadow-lg transition"
          >
            File a Complaint
          </Link>
          <Link
            to="/track"
            className="rounded-lg bg-white/10 hover:bg-white/20 border border-white/30 px-8 py-3 font-semibold text-white transition"
          >
            Track Complaint
          </Link>
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {[
            { title: 'AI Classification', desc: 'Hindi, English, or Hinglish — auto-categorized instantly' },
            { title: 'Real-time Tracking', desc: 'Track your complaint with a unique DEL-ID' },
            { title: 'Accountability', desc: 'SLA monitoring and department scorecards' },
          ].map((f) => (
            <div key={f.title} className="rounded-xl bg-white/10 backdrop-blur p-6 border border-white/20">
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-white/70 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
