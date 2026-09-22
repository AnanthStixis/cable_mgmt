import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCollector, listCollectors } from '../api/resources'
import { Button } from '../components/Button'
import type { Collector } from '../types'

export function CollectorsPage() {
  const [collectors, setCollectors] = useState<Collector[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const navigate = useNavigate()

  function load() {
    listCollectors().then(setCollectors)
  }

  useEffect(load, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    await createCollector({ name, mobile })
    setName('')
    setMobile('')
    setShowForm(false)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Collectors</h1>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : '+ Add Collector'}</Button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="flex flex-wrap gap-2 rounded-2xl bg-white p-4 shadow-sm">
          <input required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5" />
          <input required placeholder="Mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5" />
          <Button type="submit">Save</Button>
        </form>
      )}

      <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm">
        {collectors.map((c) => (
          <div
            key={c.id}
            className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-slate-50"
            onClick={() => navigate(`/customers?collector_id=${c.id}`)}
          >
            <div>
              <p className="font-medium text-slate-900">{c.name}</p>
              <p className="text-sm text-slate-500">{c.mobile}</p>
            </div>
            <span className="text-sm font-medium text-slate-600">{c.customer_count} customers</span>
          </div>
        ))}
      </div>
    </div>
  )
}
