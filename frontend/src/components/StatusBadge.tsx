import type { CustomerStatus } from '../types'

const STYLES: Record<CustomerStatus, { label: string; emoji: string; className: string }> = {
  ACTIVE: { label: 'Active', emoji: '🟢', className: 'bg-green-100 text-green-800' },
  PAYMENT_PENDING: { label: 'Payment Pending', emoji: '🟡', className: 'bg-yellow-100 text-yellow-800' },
  TEMPORARILY_PAUSED: { label: 'Paused', emoji: '⏸', className: 'bg-slate-200 text-slate-700' },
  CLOSED: { label: 'Closed', emoji: '🔴', className: 'bg-red-100 text-red-800' },
}

export function StatusBadge({ status }: { status: CustomerStatus }) {
  const style = STYLES[status]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${style.className}`}>
      <span>{style.emoji}</span>
      {style.label}
    </span>
  )
}
