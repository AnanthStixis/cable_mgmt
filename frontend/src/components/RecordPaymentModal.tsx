import { useState } from 'react'
import { recordPayment } from '../api/resources'
import type { PaymentMethod } from '../types'
import { Button } from './Button'

const METHODS: PaymentMethod[] = ['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface Props {
  customerCode: string
  defaultAmount: string
  defaultYear: number
  defaultMonth: number
  onClose: () => void
  onSuccess: () => void
}

export function RecordPaymentModal({ customerCode, defaultAmount, defaultYear, defaultMonth, onClose, onSuccess }: Props) {
  const [amount, setAmount] = useState(defaultAmount)
  const [method, setMethod] = useState<PaymentMethod>('CASH')
  const [year] = useState(defaultYear)
  const [month] = useState(defaultMonth)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      await recordPayment({
        customer_code: customerCode,
        bill_year: year,
        bill_month: month,
        amount: Number(amount),
        method,
        reference_note: note || undefined,
      })
      onSuccess()
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Failed to record payment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 md:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl md:rounded-2xl">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Record Payment</h2>
        <p className="mb-4 text-sm text-slate-500">
          {MONTH_NAMES[month - 1]} {year}
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium ${
                    method === m ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-300 text-slate-600'
                  }`}
                >
                  {m.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={submitting || !amount}>
              {submitting ? 'Saving...' : 'Save Payment'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
