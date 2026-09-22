import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboardSummary } from '../api/resources'
import { SearchBar } from '../components/SearchBar'
import type { DashboardSummary } from '../types'

function formatRupees(value: string) {
  const n = Number(value)
  return `₹${n.toLocaleString('en-IN')}`
}

function StatTile({ label, value, tone = 'default' }: { label: string; value: string | number; tone?: 'default' | 'good' | 'warn' | 'bad' }) {
  const toneClass = {
    default: 'text-slate-900',
    good: 'text-green-600',
    warn: 'text-yellow-600',
    bad: 'text-red-600',
  }[tone]
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  )
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    getDashboardSummary().then(setSummary)
  }, [])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (search.trim()) navigate(`/customers?search=${encodeURIComponent(search.trim())}`)
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearchSubmit}>
        <SearchBar value={search} onChange={setSearch} autoFocus />
      </form>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Total Customers" value={summary?.total_customers ?? '—'} />
        <StatTile label="Active" value={summary?.active_customers ?? '—'} tone="good" />
        <StatTile label="Paused" value={summary?.paused_customers ?? '—'} />
        <StatTile label="Closed" value={summary?.closed_customers ?? '—'} tone="bad" />
        <StatTile label="Paid This Month" value={summary?.paid_this_month ?? '—'} tone="good" />
        <StatTile label="Pending This Month" value={summary?.pending_this_month ?? '—'} tone="warn" />
        <StatTile label="Today's Collection" value={summary ? formatRupees(summary.today_collection) : '—'} tone="good" />
        <StatTile label="Month Collected" value={summary ? formatRupees(summary.collected_this_month) : '—'} tone="good" />
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-slate-500">Expected</p>
            <p className="text-lg font-semibold text-slate-900">{summary ? formatRupees(summary.expected_collection) : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Collected</p>
            <p className="text-lg font-semibold text-green-600">{summary ? formatRupees(summary.collected_this_month) : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Pending</p>
            <p className="text-lg font-semibold text-yellow-600">{summary ? formatRupees(summary.pending_amount) : '—'}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold text-slate-900">Recent Payments</h2>
          <ul className="divide-y divide-slate-100">
            {summary?.recent_payments.length === 0 && <p className="text-sm text-slate-400">No payments yet</p>}
            {summary?.recent_payments.map((p, i) => (
              <li key={i} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium text-slate-800">{p.customer_name}</p>
                  <p className="text-slate-400">{p.customer_code} · {p.method}</p>
                </div>
                <span className="font-semibold text-green-600">{formatRupees(p.amount)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Pending Payments</h2>
            <button onClick={() => navigate('/pending')} className="text-sm font-medium text-indigo-600">
              View all
            </button>
          </div>
          <ul className="divide-y divide-slate-100">
            {summary?.pending_customers.length === 0 && <p className="text-sm text-slate-400">Nobody pending 🎉</p>}
            {summary?.pending_customers.map((c) => (
              <li
                key={c.customer_code}
                className="flex cursor-pointer items-center justify-between py-2 text-sm hover:bg-slate-50"
                onClick={() => navigate(`/customers/${c.customer_code}`)}
              >
                <div>
                  <p className="font-medium text-slate-800">{c.customer_name}</p>
                  <p className="text-slate-400">{c.customer_code} · {c.area_name ?? '—'}</p>
                </div>
                <span className="font-semibold text-yellow-600">{formatRupees(c.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={() => navigate('/customers/new')} className="rounded-xl bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700">
          + Add Customer
        </button>
        <button onClick={() => navigate('/customers')} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50">
          Customers
        </button>
        <button onClick={() => navigate('/pending')} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50">
          Pending Payments
        </button>
        <button onClick={() => navigate('/collectors')} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50">
          Collectors
        </button>
      </div>
    </div>
  )
}
