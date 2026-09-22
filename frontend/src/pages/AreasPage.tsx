import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createArea, listAreas } from '../api/resources'
import { Button } from '../components/Button'
import type { Area } from '../types'

export function AreasPage() {
  const [areas, setAreas] = useState<Area[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  function load() {
    listAreas().then(setAreas)
  }

  useEffect(load, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await createArea(name)
      setName('')
      setShowForm(false)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Failed to add area')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Areas</h1>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : '+ Add Area'}</Button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <input
              required
              autoFocus
              placeholder="Area / Street name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5"
            />
            <Button type="submit">Save</Button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      )}

      <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm">
        {areas.length === 0 && <p className="px-4 py-8 text-center text-slate-400">No areas yet</p>}
        {areas.map((a) => (
          <div
            key={a.id}
            className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-slate-50"
            onClick={() => navigate(`/customers?area_id=${a.id}`)}
          >
            <p className="font-medium text-slate-900">{a.name}</p>
            <span className="text-sm font-medium text-slate-600">{a.customer_count} customers</span>
          </div>
        ))}
      </div>
    </div>
  )
}
