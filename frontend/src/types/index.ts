export type CustomerStatus = 'ACTIVE' | 'PAYMENT_PENDING' | 'TEMPORARILY_PAUSED' | 'CLOSED'
export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER'
export type UserRole = 'ADMIN' | 'COLLECTOR'

export interface CurrentUser {
  id: string
  email: string
  full_name: string
  role: UserRole
}

export interface Area {
  id: string
  name: string
  customer_count: number
}

export interface Plan {
  id: string
  name: string
  amount: string
  is_active: boolean
}

export interface Collector {
  id: string
  name: string
  mobile: string
  is_active: boolean
  customer_count: number
}

export interface CustomerListItem {
  id: string
  customer_code: string
  name: string
  mobile: string
  area_name: string | null
  plan_name: string | null
  collector_name: string | null
  monthly_amount: string
  status: CustomerStatus
}

export interface CurrentMonthBill {
  bill_year: number
  bill_month: number
  amount: string
  status: string
}

export interface CustomerDetail {
  id: string
  customer_code: string
  name: string
  mobile: string
  alt_mobile: string | null
  address: string | null
  area_id: string | null
  area_name: string | null
  plan_id: string | null
  plan_name: string | null
  monthly_amount: string
  collector_id: string | null
  collector_name: string | null
  status: CustomerStatus
  installation_date: string | null
  pause_start: string | null
  pause_resume: string | null
  notes: string | null
  stb_number: string | null
  connection_number: string | null
  created_at: string
  updated_at: string
  current_month_bill: CurrentMonthBill | null
  total_paid: string
  total_pending: string
}

export interface BillHistoryItem {
  bill_year: number
  bill_month: number
  amount: string
  status: string
  payment_method: string | null
  paid_at: string | null
}

export interface DashboardSummary {
  total_customers: number
  active_customers: number
  paused_customers: number
  closed_customers: number
  paid_this_month: number
  pending_this_month: number
  expected_collection: string
  collected_this_month: string
  pending_amount: string
  today_collection: string
  recent_payments: {
    customer_code: string
    customer_name: string
    amount: string
    method: string
    paid_at: string
  }[]
  pending_customers: {
    customer_code: string
    customer_name: string
    area_name: string | null
    amount: string
  }[]
}
