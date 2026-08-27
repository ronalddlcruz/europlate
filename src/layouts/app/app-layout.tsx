import { Bell, Boxes, ChevronDown, ClipboardList, FileBarChart, LayoutDashboard, LogOut, Package, Settings, ShoppingCart, Users } from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from '../../components/ui/button'
import { PageFrame } from '../../components/layout/page-frame'
import { cn } from '../../lib/utils'
import { getCurrentExchangeRate } from '../../features/settings/services/exchange-rate-api.service'

const primaryItems = [{ label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' }]
const setupItems = [{ label: 'Productos', icon: Package, to: '/productos' }, { label: 'Proveedores', icon: Users, to: '/proveedores' }, { label: 'Agentes de Aduana', icon: Boxes, to: '/agentes-aduana' }]
const operationItems = [{ label: 'Compras Nacionales', icon: ShoppingCart, to: '/compras' }, { label: 'Importaciones', icon: FileBarChart, to: '/importaciones' }, { label: 'Producción', icon: ClipboardList, to: '/produccion' }, { label: 'Almacén e Inventario', icon: Boxes, to: '/inventario' }]
const adminItems = [{ label: 'Usuarios y Permisos', icon: Users, to: '/usuarios' }, { label: 'Tipo de Cambio', icon: Settings, to: '/configuracion' }, { label: 'Reportes', icon: FileBarChart, to: '/reportes' }]

type NavigationItem = { label: string; icon: typeof LayoutDashboard; to?: string }
function NavItem({ label, icon: Icon, to }: NavigationItem) {
  return to ? <NavLink to={to} className={({ isActive }) => cn('flex items-center gap-2.5 border-l-3 border-transparent px-5 py-2 text-[13.5px] text-slate-600 transition hover:bg-[#eff4ff] hover:text-brand', isActive && 'border-brand bg-[#eff4ff] font-medium text-brand')}><Icon className="h-[17px] w-[17px]" />{label}</NavLink> : <button type="button" className="flex w-full items-center gap-2.5 border-l-3 border-transparent px-5 py-2 text-left text-[13.5px] text-slate-600 transition hover:bg-[#eff4ff] hover:text-brand"><Icon className="h-[17px] w-[17px]" />{label}</button>
}

export function AppLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const exchangeRate = useQuery({ queryKey: ['exchange-rates', 'current'], queryFn: getCurrentExchangeRate })
  const titles: Record<string, string> = { '/dashboard': 'Dashboard', '/productos': 'Productos', '/proveedores': 'Proveedores', '/agentes-aduana': 'Agentes de Aduana', '/compras': 'Compras Nacionales', '/importaciones': 'Importaciones', '/produccion': 'Producción', '/inventario': 'Almacén e Inventario', '/usuarios': 'Usuarios y Permisos', '/reportes': 'Reportes', '/configuracion': 'Tipo de Cambio' }
  return <div className="min-h-screen bg-page text-ink lg:pl-[244px]">
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[244px] flex-col border-r border-border bg-white lg:flex">
      <div className="border-b border-border px-5 py-4"><p className="font-mono text-[17px] font-bold tracking-tight text-brand">EUROPLATE</p><p className="mt-0.5 text-[11px] text-muted">Gestión Comercial</p></div>
      <div className="flex items-center gap-2.5 border-b border-border bg-[#f7f9fc] px-[18px] py-3.5"><span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-brand text-[13px] font-bold text-white">A</span><span><strong className="block text-[13px]">Administrador</strong><small className="text-[11px] text-muted">Administrador</small></span></div>
      <nav className="flex-1 py-3"><p className="px-5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[1px] text-muted">Principal</p>{primaryItems.map((item) => <NavItem key={item.label} {...item} />)}<p className="px-5 pb-1 pt-5 text-[10px] font-semibold uppercase tracking-[1px] text-muted">Configuración</p>{setupItems.map((item) => <NavItem key={item.label} {...item} />)}<p className="px-5 pb-1 pt-5 text-[10px] font-semibold uppercase tracking-[1px] text-muted">Operaciones</p>{operationItems.map((item) => <NavItem key={item.label} {...item} />)}<p className="px-5 pb-1 pt-5 text-[10px] font-semibold uppercase tracking-[1px] text-muted">Administración</p>{adminItems.map((item) => <NavItem key={item.label} {...item} />)}</nav>
      <div className="border-t border-border p-3"><Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/login')}><LogOut className="h-4 w-4" />Cerrar sesión</Button></div>
    </aside>
    <header className="sticky top-0 z-10 flex h-[58px] items-center gap-3 border-b border-border bg-white px-5 shadow-sm sm:px-7"><h2 className="flex-1 text-[17px] font-semibold">{titles[pathname] ?? 'Europlate'}</h2><NavLink to="/configuracion" title="Gestionar tipo de cambio" className="rounded-md border border-border bg-[#f7f9fc] px-3 py-2 font-mono text-xs font-bold text-amber-600 transition hover:border-brand"><span className="mr-2 font-sans text-[11px] font-semibold text-slate-400">T.C. USD</span>{exchangeRate.data ? Number(exchangeRate.data.value).toFixed(4) : '—'}</NavLink></header>
    <main className="min-w-0 p-4 sm:p-6 lg:p-7"><PageFrame><Outlet /></PageFrame></main>
  </div>
}
