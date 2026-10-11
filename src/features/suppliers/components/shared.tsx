import { type Supplier,type SupplierStatus,type SupplierType } from '@/features/suppliers/services/supplier-api.service';

export const Select = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => <select className="h-10 w-full rounded-md border border-border bg-[#f4f7fb] px-3 text-sm outline-none focus:border-brand" {...props}>{children}</select>

export const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="block"><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.4px] text-slate-600">{label}</span>{children}</label>

export const sortSuppliers = (items: Supplier[]) => [...items].sort((a, b) => a.name.localeCompare(b.name, 'es'))

export const updateCatalogSuppliers = <T extends { suppliers: { id: string; name: string }[] }>(catalog: T | undefined, supplier: Supplier, expectedType: SupplierType): T | undefined => {
  if (!catalog) return catalog
  const suppliers = catalog.suppliers.filter(item => item.id !== supplier.id)
  if (supplier.type === expectedType && supplier.status === 'Activo') suppliers.push({ id: supplier.id, name: supplier.name })
  return { ...catalog, suppliers: suppliers.sort((a, b) => a.name.localeCompare(b.name, 'es')) }
}

export function TypeBadge({ type }: { type: SupplierType }) { return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${type === 'Nacional' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{type}</span> }

export function StatusBadge({ status }: { status: SupplierStatus }) { return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${status === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{status}</span> }

export function IconButton({ children, label, danger, onClick }: { children: React.ReactNode; label: string; danger?: boolean; onClick: () => void }) { return <button title={label} aria-label={label} onClick={onClick} className={`ml-1 inline-flex h-9 w-10 items-center justify-center rounded-md border ${danger ? 'border-red-300 bg-red-50 text-red-500' : 'border-border bg-white text-slate-700'}`}>{children}</button> }
