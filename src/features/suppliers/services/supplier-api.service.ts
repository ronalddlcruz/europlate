import { api } from '../../../lib/api-client'

export type SupplierType = 'Nacional' | 'Extranjero'
export type SupplierStatus = 'Activo' | 'Inactivo'
export type Supplier = { id: string; name: string; type: SupplierType; document: string; phone: string; email: string; status: SupplierStatus }

type ApiSupplier = { id: string; name: string; type: 'NATIONAL' | 'FOREIGN'; taxId: string | null; phone: string | null; email: string | null; status: 'ACTIVE' | 'INACTIVE' }
const toSupplier = (supplier: ApiSupplier): Supplier => ({ id: supplier.id, name: supplier.name, type: supplier.type === 'NATIONAL' ? 'Nacional' : 'Extranjero', document: supplier.taxId ?? '', phone: supplier.phone ?? '', email: supplier.email ?? '', status: supplier.status === 'ACTIVE' ? 'Activo' : 'Inactivo' })
const toPayload = (supplier: Omit<Supplier, 'id'>) => ({ name: supplier.name, type: supplier.type === 'Nacional' ? 'NATIONAL' : 'FOREIGN', taxId: supplier.document, phone: supplier.phone || undefined, email: supplier.email || undefined, status: supplier.status === 'Activo' ? 'ACTIVE' : 'INACTIVE' })

export async function listSuppliers() { return (await api<ApiSupplier[]>('/api/suppliers')).map(toSupplier) }
export async function createSupplier(supplier: Omit<Supplier, 'id'>) { return toSupplier(await api<ApiSupplier>('/api/suppliers', { method: 'POST', body: JSON.stringify(toPayload(supplier)) })) }
export async function updateSupplier(id: string, supplier: Omit<Supplier, 'id'>) { return toSupplier(await api<ApiSupplier>(`/api/suppliers/${id}`, { method: 'PATCH', body: JSON.stringify(toPayload(supplier)) })) }
export async function deleteSupplier(id: string) { await api<void>(`/api/suppliers/${id}`, { method: 'DELETE' }) }
