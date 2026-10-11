import { type Role,type UserStatus } from '../services/user-api.service'

export type Tab = 'users' | 'profiles' | 'audit'

export const statusName: Record<UserStatus, string> = { ACTIVE: 'Activo', INACTIVE: 'Inactivo', SUSPENDED: 'Suspendido' }

export const moduleName: Record<string, string> = { products: 'Productos', suppliers: 'Proveedores', customs_agents: 'Agentes de Aduana', purchases: 'Compras Nacionales', imports: 'Importaciones', production: 'Producción', inventory: 'Almacén e Inventario', users: 'Usuarios y Permisos', dashboard: 'Dashboard', reports: 'Reportes', settings: 'Configuración' }

export const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...props} className="h-10 w-full rounded-md border border-border bg-[#f4f7fb] px-3 text-sm outline-none focus:border-brand">{props.children}</select>

export const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="block"><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.4px] text-slate-600">{label}</span>{children}</label>

export const permissionSections = [
  { label: 'Principal', modules: ['dashboard'] },
  { label: 'Configuración', modules: ['products', 'suppliers', 'customs_agents'] },
  { label: 'Operaciones', modules: ['purchases', 'imports', 'production', 'inventory'] },
  { label: 'Administración', modules: ['users', 'settings', 'reports'] },
]

export function RoleBadge({ role }: { role: Role }) { const shade = role.key === 'admin' ? 'bg-blue-100 text-blue-700' : role.key === 'operador' ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'; return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${shade}`}>{role.name}</span> }

export function StatusBadge({ status }: { status: UserStatus }) { return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{statusName[status]}</span> }

export function Mini({ children, danger, onClick }: { children: React.ReactNode; danger?: boolean; onClick: () => void }) { return <button onClick={onClick} className={`ml-1 inline-flex h-7 w-7 items-center justify-center rounded border ${danger ? 'border-red-200 bg-red-50 text-red-600' : 'border-border bg-white text-slate-600'}`}>{children}</button> }
