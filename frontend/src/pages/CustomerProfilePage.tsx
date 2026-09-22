import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { closeCustomer, getCustomer, getCustomerBills, pauseCustomer, resumeCustomer } from '../api/resources'
import { Button } from '../components/Button'
import { QrModal } from '../components/QrModal'
import { RecordPaymentModal } from '../components/RecordPaymentModal'
import { StatusBadge } from '../components/StatusBadge'
import type { BillHistoryItem, CustomerDetail } from '../types'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function buildReminderMessage(customer: CustomerDetail) {
  if (!customer.current_month_bill || customer.current_month_bill.status !== 'PENDING') {
    return `Hello ${customer.name}, this is a reminder from your Cable TV operator. Please reach out if you have any questions.`
  }
  const { bill_month, bill_year, amount } = customer.current_month_bill
  return `Hello ${customer.name}, your Cable TV subscription of ₹${amount} for ${MONTH_NAMES[bill_month - 1]} ${bill_year} is pending. Please make the payment at your earliest convenience.`
}

export function CustomerProfilePage() {
  const { customerCode } = useParams<{ customerCode: string }>()
  const navigate = useNavigate()

  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [bills, setBills] = useState<BillHistoryItem[]>([])
  const [showPayment, setShowPayment] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const [showPause, setShowPause] = useState(false)

  function load() {
    if (!customerCode) return
    getCustomer(customerCode).then(setCustomer)
    getCustomerBills(customerCode).then(setBills)
  }

  useEffect(load, [customerCode])

  if (!customer) {
    return <p className="py-8 text-center text-slate-400">Loading...</p>
  }

  const waLink = `https://wa.me/91${customer.mobile.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
    buildReminderMessage(customer),
  )}`

  return (
    <div className="space-y-4 pb-8">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{customer.name}</h1>
            <p className="text-sm text-slate-500">{customer.customer_code} · {customer.mobile}</p>
          </div>
          <StatusBadge status={customer.status} />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-slate-500">Area</dt>
          <dd className="text-slate-800">{customer.area_name ?? '—'}</dd>
          <dt className="text-slate-500">Monthly</dt>
          <dd className="text-slate-800">₹{Number(customer.monthly_amount).toLocaleString('en-IN')}</dd>
          <dt className="text-slate-500">STB</dt>
          <dd className="text-slate-800">{customer.stb_number ?? '—'}</dd>
          <dt className="text-slate-500">Collector</dt>
          <dd className="text-slate-800">{customer.collector_name ?? '—'}</dd>
        </dl>

        {customer.current_month_bill && (
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-center">
            <p className="text-sm text-slate-500">
              {MONTH_NAMES[customer.current_month_bill.bill_month - 1]} {customer.current_month_bill.bill_year}
            </p>
            <p className="text-xl font-semibold text-slate-900">₹{Number(customer.current_month_bill.amount).toLocaleString('en-IN')}</p>
            <p className={`text-sm font-medium ${customer.current_month_bill.status === 'PAID' ? 'text-green-600' : 'text-yellow-600'}`}>
              {customer.current_month_bill.status}
            </p>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <a href={waLink} target="_blank" rel="noreferrer" className="flex min-h-[44px] items-center justify-center gap-1 rounded-xl bg-green-500 px-3 py-2.5 text-sm font-medium text-white hover:bg-green-600">
            💬 WhatsApp
          </a>
          <a href={`tel:${customer.mobile}`} className="flex min-h-[44px] items-center justify-center gap-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            📞 Call
          </a>
          <Button onClick={() => setShowPayment(true)} className="text-sm">
            💰 Record Payment
          </Button>
          <Button variant="secondary" onClick={() => setShowQr(true)} className="text-sm">
            📱 QR
          </Button>
          <Button variant="secondary" onClick={() => navigate(`/customers/${customer.customer_code}/edit`)} className="text-sm">
            ✏️ Edit
          </Button>
          {customer.status === 'TEMPORARILY_PAUSED' ? (
            <Button
              variant="secondary"
              className="text-sm"
              onClick={() => resumeCustomer(customer.customer_code).then(load)}
            >
              ▶️ Resume
            </Button>
          ) : (
            customer.status !== 'CLOSED' && (
              <Button variant="secondary" className="text-sm" onClick={() => setShowPause(true)}>
                ⏸ Pause
              </Button>
            )
          )}
          {customer.status !== 'CLOSED' && (
            <Button
              variant="danger"
              className="text-sm"
              onClick={() => {
                if (confirm(`Close ${customer.name}'s connection? This keeps all history but stops billing.`)) {
                  closeCustomer(customer.customer_code).then(load)
                }
              }}
            >
              ✕ Close
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
          <p className="text-xs text-slate-500">Total Paid</p>
          <p className="text-lg font-semibold text-green-600">₹{Number(customer.total_paid).toLocaleString('en-IN')}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
          <p className="text-xs text-slate-500">Total Pending</p>
          <p className="text-lg font-semibold text-yellow-600">₹{Number(customer.total_pending).toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-900">Payment History</h2>
        {bills.length === 0 ? (
          <p className="text-sm text-slate-400">No bills generated yet</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {bills.map((b) => (
              <li key={`${b.bill_year}-${b.bill_month}`} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-700">
                  {MONTH_NAMES[b.bill_month - 1]} {b.bill_year}
                </span>
                <span className="text-slate-700">₹{Number(b.amount).toLocaleString('en-IN')}</span>
                <span className={`font-medium ${b.status === 'PAID' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {b.status}{b.payment_method ? ` — ${b.payment_method}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {customer.notes && (
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 font-semibold text-slate-900">Notes</h2>
          <p className="text-sm text-slate-600">{customer.notes}</p>
        </div>
      )}

      {showPayment && customer.current_month_bill && (
        <RecordPaymentModal
          customerCode={customer.customer_code}
          defaultAmount={customer.current_month_bill.amount}
          defaultYear={customer.current_month_bill.bill_year}
          defaultMonth={customer.current_month_bill.bill_month}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            setShowPayment(false)
            load()
          }}
        />
      )}

      {showPayment && !customer.current_month_bill && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <p className="text-slate-700">No bill has been generated for this customer yet this month. Generate monthly bills first.</p>
            <Button className="mt-4" onClick={() => setShowPayment(false)}>Close</Button>
          </div>
        </div>
      )}

      {showQr && (
        <QrModal
          customerCode={customer.customer_code}
          customerName={customer.name}
          amount={customer.current_month_bill?.amount ?? customer.monthly_amount}
          onClose={() => setShowQr(false)}
        />
      )}

      {showPause && (
        <PauseModal
          onClose={() => setShowPause(false)}
          onSubmit={async (pauseStart, pauseResume) => {
            await pauseCustomer(customer.customer_code, { pause_start: pauseStart, pause_resume: pauseResume || undefined })
            setShowPause(false)
            load()
          }}
        />
      )}
    </div>
  )
}

function PauseModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (start: string, resume: string) => void }) {
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10))
  const [resume, setResume] = useState('')

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Pause Connection</h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Pause From</label>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-2.5" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Resume On (optional)</label>
            <input type="date" value={resume} onChange={(e) => setResume(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-2.5" />
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={() => onSubmit(start, resume)}>Pause</Button>
        </div>
      </div>
    </div>
  )
}
