import { QRCodeSVG } from 'qrcode.react'
import { Button } from './Button'

interface Props {
  customerCode: string
  customerName: string
  amount: string
  onClose: () => void
}

const OPERATOR_UPI_VPA = 'operator@upi'

export function QrModal({ customerCode, customerName, amount, onClose }: Props) {
  const upiIntent = `upi://pay?pa=${OPERATOR_UPI_VPA}&pn=CableOperator&am=${amount}&tn=${customerCode}&cu=INR`

  function handlePrint() {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">{customerName}</h2>
        <p className="mb-4 text-sm text-slate-500">{customerCode}</p>

        <div className="mx-auto flex w-fit items-center justify-center rounded-xl border border-slate-200 p-4">
          <QRCodeSVG value={upiIntent} size={220} />
        </div>

        <p className="mt-4 text-sm text-slate-500">Scan with any UPI app to pay ₹{amount}</p>

        <div className="mt-6 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Close
          </Button>
          <Button className="flex-1" onClick={handlePrint}>
            Print
          </Button>
        </div>
      </div>
    </div>
  )
}
