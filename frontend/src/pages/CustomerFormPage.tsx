import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createCustomer,
  getCustomer,
  listAreas,
  listCollectors,
  listPlans,
  updateCustomer,
} from '../api/resources'
import { Button } from '../components/Button'
import type { Area, Collector, Plan } from '../types'

export function CustomerFormPage() {
  const { customerCode } = useParams<{ customerCode: string }>()
  const isEdit = !!customerCode
  const navigate = useNavigate()

  const [areas, setAreas] = useState<Area[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [collectors, setCollectors] = useState<Collector[]>([])

  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [altMobile, setAltMobile] = useState('')
  const [address, setAddress] = useState('')
  const [areaId, setAreaId] = useState('')
  const [planId, setPlanId] = useState('')
  const [monthlyAmount, setMonthlyAmount] = useState('')
  const [collectorId, setCollectorId] = useState('')
  const [stbNumber, setStbNumber] = useState('')
  const [connectionNumber, setConnectionNumber] = useState('')
  const [notes, setNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listAreas().then(setAreas)
    listPlans().then(setPlans)
    listCollectors().then(setCollectors)
  }, [])

  useEffect(() => {
    if (!customerCode) return
    getCustomer(customerCode).then((c) => {
      setName(c.name)
      setMobile(c.mobile)
      setAltMobile(c.alt_mobile ?? '')
      setAddress(c.address ?? '')
      setAreaId(c.area_id ?? '')
      setPlanId(c.plan_id ?? '')
      setMonthlyAmount(c.monthly_amount)
      setCollectorId(c.collector_id ?? '')
      setStbNumber(c.stb_number ?? '')
      setConnectionNumber(c.connection_number ?? '')
      setNotes(c.notes ?? '')
    })
  }, [customerCode])

  function handlePlanChange(id: string) {
    setPlanId(id)
    const plan = plans.find((p) => p.id === id)
    if (plan) setMonthlyAmount(plan.amount)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        name,
        mobile,
        alt_mobile: altMobile || undefined,
        address: address || undefined,
        area_id: areaId || undefined,
        plan_id: planId || undefined,
        monthly_amount: Number(monthlyAmount),
        collector_id: collectorId || undefined,
        notes: notes || undefined,
      }
      if (isEdit) {
        await updateCustomer(customerCode!, { ...payload, stb_number: stbNumber || undefined, connection_number: connectionNumber || undefined })
        navigate(`/customers/${customerCode}`)
      } else {
        const created = await createCustomer({
          ...payload,
          connection: stbNumber || connectionNumber ? { stb_number: stbNumber || undefined, connection_number: connectionNumber || undefined } : undefined,
        })
        navigate(`/customers/${created.customer_code}`)
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Failed to save customer')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = 'w-full rounded-xl border border-slate-300 px-4 py-2.5 text-base focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200'
  const labelClass = 'mb-1 block text-sm font-medium text-slate-700'

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 text-xl font-semibold text-slate-900">{isEdit ? 'Edit Customer' : 'Add Customer'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        <div>
          <label className={labelClass}>Name *</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Mobile *</label>
            <input required value={mobile} onChange={(e) => setMobile(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Alt. Mobile</label>
            <input value={altMobile} onChange={(e) => setAltMobile(e.target.value)} className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Address</label>
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Area</label>
            <select value={areaId} onChange={(e) => setAreaId(e.target.value)} className={inputClass}>
              <option value="">Select area</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Collector</label>
            <select value={collectorId} onChange={(e) => setCollectorId(e.target.value)} className={inputClass}>
              <option value="">Unassigned</option>
              {collectors.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Plan</label>
            <select value={planId} onChange={(e) => handlePlanChange(e.target.value)} className={inputClass}>
              <option value="">Custom</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.name} (₹{p.amount})</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Monthly Amount (₹) *</label>
            <input required type="number" value={monthlyAmount} onChange={(e) => setMonthlyAmount(e.target.value)} className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>STB Number</label>
            <input value={stbNumber} onChange={(e) => setStbNumber(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Connection Number</label>
            <input value={connectionNumber} onChange={(e) => setConnectionNumber(e.target.value)} className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={2} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </div>
  )
}
