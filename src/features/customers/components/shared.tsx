import { type Customer,type CustomerStatus } from '@/features/customers/services/customer-api.service';

export const emptyCustomer = (): Omit<Customer, 'id'> => ({ name: '', ruc: '', phone: '', email: '', address: '', note: '', status: 'Activo' })

export const sortCustomers = (items: Customer[]) => [...items].sort((left, right) => left.name.localeCompare(right.name, 'es'))

export function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.4px] text-slate-600">{label}</span>{children}</label> }

export function StatusBadge({ status }: { status: CustomerStatus }) { return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${status === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{status}</span> }

export function IconButton({ children, label, danger, onClick }: { children: React.ReactNode; label: string; danger?: boolean; onClick: () => void }) { return <button title={label} aria-label={label} onClick={onClick} className={`ml-1 inline-flex h-9 w-10 items-center justify-center rounded-md border ${danger ? 'border-red-300 bg-red-50 text-red-500' : 'border-border bg-white text-slate-700'}`}>{children}</button> }
