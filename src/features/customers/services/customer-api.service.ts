import { api } from '../../../lib/api-client'

export type CustomerStatus = 'Activo' | 'Inactivo'
export type Customer = { id: string; name: string; phone: string; email: string; address: string; note: string; status: CustomerStatus }
type ApiCustomer = { id: string; name: string; phone: string; email: string; address: string; note: string | null; status: 'ACTIVE' | 'INACTIVE' }

const toCustomer = (customer: ApiCustomer): Customer => ({ id: customer.id, name: customer.name, phone: customer.phone, email: customer.email, address: customer.address, note: customer.note ?? '', status: customer.status === 'ACTIVE' ? 'Activo' : 'Inactivo' })
const toPayload = (customer: Omit<Customer, 'id'>) => ({ name: customer.name, phone: customer.phone, email: customer.email, address: customer.address, note: customer.note || undefined, status: customer.status === 'Activo' ? 'ACTIVE' : 'INACTIVE' })

export async function listCustomers() { return (await api<ApiCustomer[]>('/api/customers')).map(toCustomer) }
export async function createCustomer(customer: Omit<Customer, 'id'>) { return toCustomer(await api<ApiCustomer>('/api/customers', { method: 'POST', body: JSON.stringify(toPayload(customer)) })) }
export async function updateCustomer(id: string, customer: Omit<Customer, 'id'>) { return toCustomer(await api<ApiCustomer>(`/api/customers/${id}`, { method: 'PATCH', body: JSON.stringify(toPayload(customer)) })) }
export async function deleteCustomer(id: string) { await api<void>(`/api/customers/${id}`, { method: 'DELETE' }) }
