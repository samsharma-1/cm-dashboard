import type { ComplaintStatus } from '../types'
import { STATUS_LABELS, STATUS_ORDER } from '../types'

const statusColors: Record<ComplaintStatus, string> = {
  submitted: 'bg-slate-100 text-slate-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-800',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-200 text-gray-600',
}

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

export function UrgencyBadge({ urgency }: { urgency: number }) {
  const color =
    urgency >= 7 ? 'bg-red-100 text-red-700' : urgency >= 4 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-700'
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${color}`}>
      {urgency}/10
    </span>
  )
}

export function StatusPipeline({ current }: { current: ComplaintStatus }) {
  const idx = STATUS_ORDER.indexOf(current)
  return (
    <div className="flex items-center gap-1">
      {STATUS_ORDER.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div
            className={`h-2 w-2 rounded-full ${i <= idx ? 'bg-blue-600' : 'bg-gray-300'}`}
            title={STATUS_LABELS[s]}
          />
          {i < STATUS_ORDER.length - 1 && (
            <div className={`h-0.5 w-4 ${i < idx ? 'bg-blue-600' : 'bg-gray-300'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export function StatusTimeline({ history }: { history: { status: ComplaintStatus; officer_name: string | null; note: string | null; timestamp: string }[] }) {
  if (!history.length) return <p className="text-sm text-gray-500">No status updates yet.</p>
  return (
    <ol className="relative border-l border-gray-200 ml-3 space-y-4">
      {history.map((h, i) => (
        <li key={i} className="ml-4">
          <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-blue-600" />
          <div className="flex items-center gap-2">
            <StatusBadge status={h.status} />
            <span className="text-xs text-gray-500">
              {new Date(h.timestamp).toLocaleString()}
            </span>
          </div>
          {h.officer_name && (
            <p className="text-sm text-gray-600 mt-0.5">By: {h.officer_name}</p>
          )}
          {h.note && <p className="text-sm text-gray-500">{h.note}</p>}
        </li>
      ))}
    </ol>
  )
}

export function LoadingSpinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
      {message}
    </div>
  )
}
