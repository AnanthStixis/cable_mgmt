import { api } from './client'
import type {
  Area,
  BillHistoryItem,
  Collector,
  CurrentUser,
  CustomerDetail,
  CustomerListItem,
  CustomerStatus,
  DashboardSummary,
  Plan,
} from '../types'

export async function login(email: string, password: string) {
  const { data } = await api.post<{ access_token: string }>('/auth/login', { email, password })
  return data
}

export async function getMe() {
  const { data } = await api.get<CurrentUser>('/auth/me')
  return data
}

export async function getDashboardSummary() {
  const { data } = await api.get<DashboardSummary>('/dashboard/summary')
  return data
}

export interface CustomerFilters {
  search?: string
  area_id?: string
  status?: CustomerStatus
  plan_id?: string
  collector_id?: string
  page?: number
  page_size?: number
}

export async function listCustomers(filters: CustomerFilters) {
  const { data } = await api.get<CustomerListItem[]>('/customers', { params: filters })
  return data
}

export async function getCustomer(customerCode: string) {
  const { data } = await api.get<CustomerDetail>(`/customers/${customerCode}`)
  return data
}

export async function createCustomer(payload: Record<string, unknown>) {
  const { data } = await api.post<CustomerDetail>('/customers', payload)
  return data
}

export async function updateCustomer(customerCode: string, payload: Record<string, unknown>) {
  const { data } = await api.patch<CustomerDetail>(`/customers/${customerCode}`, payload)
  return data
}

export async function pauseCustomer(customerCode: string, payload: { pause_start: string; pause_resume?: string; reason?: string }) {
  const { data } = await api.post<CustomerDetail>(`/customers/${customerCode}/pause`, payload)
  return data
}

export async function resumeCustomer(customerCode: string) {
  const { data } = await api.post<CustomerDetail>(`/customers/${customerCode}/resume`)
  return data
}

export async function closeCustomer(customerCode: string, reason?: string) {
  const { data } = await api.post<CustomerDetail>(`/customers/${customerCode}/close`, { reason })
  return data
}

export async function getCustomerBills(customerCode: string) {
  const { data } = await api.get<BillHistoryItem[]>(`/customers/${customerCode}/bills`)
  return data
}

export async function listAreas() {
  const { data } = await api.get<Area[]>('/areas')
  return data
}

export async function createArea(name: string) {
  const { data } = await api.post<Area>('/areas', { name })
  return data
}

export async function listPlans() {
  const { data } = await api.get<Plan[]>('/plans')
  return data
}

export async function createPlan(payload: { name: string; amount: number }) {
  const { data } = await api.post<Plan>('/plans', payload)
  return data
}

export async function listCollectors() {
  const { data } = await api.get<Collector[]>('/collectors')
  return data
}

export async function createCollector(payload: { name: string; mobile: string }) {
  const { data } = await api.post<Collector>('/collectors', payload)
  return data
}

export async function getCollectorCustomers(collectorId: string) {
  const { data } = await api.get<CustomerListItem[]>(`/collectors/${collectorId}/customers`)
  return data
}

export interface RecordPaymentPayload {
  customer_code: string
  bill_year: number
  bill_month: number
  amount: number
  method: string
  collector_id?: string
  reference_note?: string
}

export async function recordPayment(payload: RecordPaymentPayload) {
  const { data } = await api.post('/payments', payload)
  return data
}

export async function generateBills(year: number, month: number) {
  const { data } = await api.post('/billing/generate', { year, month })
  return data
}

export async function listBills(params: { year: number; month: number; status?: string; area_id?: string }) {
  const { data } = await api.get('/bills', { params })
  return data
}
