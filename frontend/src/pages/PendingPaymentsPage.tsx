import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listAreas, listBills } from '../api/resources'
import { Button } from '../components/Button'
import type { Area } from '../types'

interface BillRow {
  id: string
  customer_code: string
  customer_name: string
  area_name: string | null
  amount: string
  status: string
}

export function PendingPaymentsPage() {
  const now = new Date()
  const [year] = useState(now.getFullYear())
  const [month] = useState(now.getMonth() + 1)
  const [areaId, setAreaId] = useState('')
  const [areas, setAreas] = useState<Area[]>([])
  const [bills, setBills] = useState<BillRow[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    listAreas().then(setAreas)
  }, [])

  function load() {
    setLoading(true)
    listBills({ year, month, status: 'PENDING', area_id: areaId || undefined })
      .then((data) => setBills(data as BillRow[]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [areaId])

  const totalPending = bills.reduce((sum, b) => sum + Number(b.amount), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Pending Payments</h1>
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
        <div>
          <p className="text-sm text-slate-500">{bills.length} customers pending</p>
          <p className="text-lg font-semibold text-yellow-600">₹{totalPending.toLocaleString('en-IN')}</p>
        </div>
        <select value={areaId} onChange={(e) => setAreaId(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">All Areas</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="py-8 text-center text-slate-400">Loading...</p>
      ) : bills.length === 0 ? (
        <p className="py-8 text-center text-slate-400">No pending payments 🎉</p>
      ) : (
        <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm">
          {bills.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0 cursor-pointer" onClick={() => navigate(`/customers/${b.customer_code}`)}>
                <p className="truncate font-medium text-slate-900">{b.customer_name}</p>
                <p className="truncate text-sm text-slate-500">{b.customer_code} · {b.area_name ?? '—'}</p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <span className="font-semibold text-yellow-600">₹{Number(b.amount).toLocaleString('en-IN')}</span>
                <Button className="text-sm" onClick={() => navigate(`/customers/${b.customer_code}`)}>
                  Collect
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
