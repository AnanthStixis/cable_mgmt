import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { listAreas, listCollectors, listCustomers } from '../api/resources'
import { Button } from '../components/Button'
import { SearchBar } from '../components/SearchBar'
import { StatusBadge } from '../components/StatusBadge'
import type { Area, Collector, CustomerListItem, CustomerStatus } from '../types'

const STATUS_OPTIONS: CustomerStatus[] = ['ACTIVE', 'PAYMENT_PENDING', 'TEMPORARILY_PAUSED', 'CLOSED']

export function CustomersListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [areaId, setAreaId] = useState(searchParams.get('area_id') ?? '')
  const [status, setStatus] = useState(searchParams.get('status') ?? '')
  const [collectorId, setCollectorId] = useState(searchParams.get('collector_id') ?? '')

  const [areas, setAreas] = useState<Area[]>([])
  const [collectors, setCollectors] = useState<Collector[]>([])
  const [customers, setCustomers] = useState<CustomerListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listAreas().then(setAreas)
    listCollectors().then(setCollectors)
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = { search, area_id: areaId || undefined, status: (status || undefined) as CustomerStatus | undefined, collector_id: collectorId || undefined }
    setSearchParams(Object.fromEntries(Object.entries({ search, area_id: areaId, status, collector_id: collectorId }).filter(([, v]) => v)))
    const timeout = setTimeout(() => {
      listCustomers(params)
        .then(setCustomers)
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, areaId, status, collectorId])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Customers</h1>
        <Button onClick={() => navigate('/customers/new')}>+ Add Customer</Button>
      </div>

      <SearchBar value={search} onChange={setSearch} autoFocus />

      <div className="flex flex-wrap gap-2">
        <select value={areaId} onChange={(e) => setAreaId(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">All Areas</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>{a.name} ({a.customer_count})</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
        <select value={collectorId} onChange={(e) => setCollectorId(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">All Collectors</option>
          {collectors.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.customer_count})</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="py-8 text-center text-slate-400">Loading...</p>
      ) : customers.length === 0 ? (
        <p className="py-8 text-center text-slate-400">No customers found</p>
      ) : (
        <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm">
          {customers.map((c) => (
            <div
              key={c.id}
              onClick={() => navigate(`/customers/${c.customer_code}`)}
              className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{c.name}</p>
                <p className="truncate text-sm text-slate-500">
                  {c.customer_code} · {c.mobile} · {c.area_name ?? 'No area'}
                </p>
              </div>
              <div className="flex flex-shrink-0 flex-col items-end gap-1">
                <StatusBadge status={c.status} />
                <span className="text-sm font-medium text-slate-700">₹{Number(c.monthly_amount).toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
