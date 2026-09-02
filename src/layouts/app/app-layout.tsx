import { Boxes, ClipboardList, FileBarChart, LayoutDashboard, LogOut, Menu, Package, Settings, ShoppingCart, Users, X } from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/button'
import { PageFrame } from '../../components/layout/page-frame'
import { cn } from '../../lib/utils'
import { getCurrentExchangeRate } from '../../features/settings/services/exchange-rate-api.service'
import { useAuth } from '../../features/auth/hooks/use-auth'

const primaryItems = [{ label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' }]
const setupItems = [{ label: 'Productos', icon: Package, to: '/productos' }, { label: 'Clientes', icon: Users, to: '/clientes' }, { label: 'Proveedores', icon: Users, to: '/proveedores' }, { label: 'Agentes de Aduana', icon: Boxes, to: '/agentes-aduana' }]
const operationItems = [{ label: 'Compras Nacionales', icon: ShoppingCart, to: '/compras' }, { label: 'Importaciones', icon: FileBarChart, to: '/importaciones' }, { label: 'Producción', icon: ClipboardList, to: '/produccion' }, { label: 'Almacén e Inventario', icon: Boxes, to: '/inventario' }]
const adminItems = [{ label: 'Usuarios y Permisos', icon: Users, to: '/usuarios' }, { label: 'Tipo de Cambio', icon: Settings, to: '/configuracion' }, { label: 'Reportes', icon: FileBarChart, to: '/reportes' }]

type NavigationItem = { label: string; icon: typeof LayoutDashboard; to?: string }
function NavItem({ label, icon: Icon, to, onNavigate }: NavigationItem & { onNavigate?: () => void }) {
  return to ? <NavLink to={to} onClick={onNavigate} className={({ isActive }) => cn('flex items-center gap-2 border-l-3 border-transparent px-4 py-1.5 text-[13px] text-slate-600 transition hover:bg-[#eff4ff] hover:text-brand', isActive && 'border-brand bg-[#eff4ff] font-medium text-brand')}><Icon className="h-4 w-4" />{label}</NavLink> : <button type="button" onClick={onNavigate} className="flex w-full items-center gap-2 border-l-3 border-transparent px-4 py-1.5 text-left text-[13px] text-slate-600 transition hover:bg-[#eff4ff] hover:text-brand"><Icon className="h-4 w-4" />{label}</button>
}

function Sidebar({ onNavigate, onClose }: { onNavigate?: () => void; onClose?: () => void }) {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const close = () => { onNavigate?.(); onClose?.() }
  return <>
    <div className="flex items-center justify-between border-b border-border px-4 py-3"><div><p className="font-mono text-[15px] font-bold tracking-tight text-brand">EUROPLATE</p><p className="mt-0.5 text-[10px] text-muted">Gestión Comercial</p></div>{onClose && <button type="button" onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Cerrar menú"><X className="h-5 w-5" /></button>}</div>
    <div className="flex items-center gap-2 border-b border-border bg-[#f7f9fc] px-3.5 py-3"><span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-brand text-xs font-bold text-white">A</span><span><strong className="block text-xs">Administrador</strong><small className="text-[10px] text-muted">Administrador</small></span></div>
    <nav className="min-h-0 flex-1 overflow-y-auto py-2"><p className="px-4 pb-1 pt-2 text-[9px] font-semibold uppercase tracking-[1px] text-muted">Principal</p>{primaryItems.map((item) => <NavItem key={item.label} {...item} onNavigate={close} />)}<p className="px-4 pb-1 pt-4 text-[9px] font-semibold uppercase tracking-[1px] text-muted">Configuración</p>{setupItems.map((item) => <NavItem key={item.label} {...item} onNavigate={close} />)}<p className="px-4 pb-1 pt-4 text-[9px] font-semibold uppercase tracking-[1px] text-muted">Operaciones</p>{operationItems.map((item) => <NavItem key={item.label} {...item} onNavigate={close} />)}<p className="px-4 pb-1 pt-4 text-[9px] font-semibold uppercase tracking-[1px] text-muted">Administración</p>{adminItems.map((item) => <NavItem key={item.label} {...item} onNavigate={close} />)}</nav>
    <div className="border-t border-border p-3"><Button variant="ghost" className="w-full justify-start" onClick={() => { signOut(); close(); navigate('/login', { replace: true }) }}><LogOut className="h-4 w-4" />Cerrar sesión</Button></div>
  </>
}

export function AppLayout() {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const exchangeRate = useQuery({ queryKey: ['exchange-rates', 'current'], queryFn: getCurrentExchangeRate })
  const titles: Record<string, string> = { '/dashboard': 'Dashboard', '/productos': 'Productos', '/clientes': 'Clientes', '/proveedores': 'Proveedores', '/agentes-aduana': 'Agentes de Aduana', '/compras': 'Compras Nacionales', '/importaciones': 'Importaciones', '/produccion': 'Producción', '/inventario': 'Almacén e Inventario', '/usuarios': 'Usuarios y Permisos', '/reportes': 'Reportes', '/configuracion': 'Tipo de Cambio' }
  useEffect(() => { setMenuOpen(false) }, [pathname])
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
  return <div className="min-h-screen bg-page text-ink lg:pl-[205px]">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[205px] flex-col border-r border-border bg-white lg:flex"><Sidebar /></aside>
    {menuOpen && <><button type="button" aria-label="Cerrar menú" className="fixed inset-0 z-30 bg-slate-950/35 lg:hidden" onClick={() => setMenuOpen(false)} /><aside className="fixed inset-y-0 left-0 z-40 flex w-[min(82vw,310px)] flex-col border-r border-border bg-white shadow-2xl lg:hidden"><Sidebar onClose={() => setMenuOpen(false)} /></aside></>}
    <header className="sticky top-0 z-20 flex h-[58px] items-center gap-2 border-b border-border bg-white px-4 shadow-sm sm:px-6 lg:h-[54px] lg:px-6"><button type="button" aria-label="Abrir menú" aria-expanded={menuOpen} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-slate-600 hover:bg-slate-50 lg:hidden" onClick={() => setMenuOpen(true)}><Menu className="h-5 w-5" /></button><h2 className="min-w-0 flex-1 truncate text-[15px] font-semibold sm:text-[17px]">{titles[pathname] ?? 'Europlate'}</h2><NavLink to="/configuracion" title="Gestionar tipo de cambio" className="shrink-0 rounded-md border border-border bg-[#f7f9fc] px-2.5 py-2 font-mono text-xs font-bold text-amber-600 transition hover:border-brand sm:px-3"><span className="mr-1 font-sans text-[10px] font-semibold text-slate-400 sm:mr-2 sm:text-[11px]">T.C. USD</span>{exchangeRate.data ? Number(exchangeRate.data.value).toFixed(4) : '—'}</NavLink></header>
    <main className="min-w-0 p-3 sm:p-5 lg:p-6"><PageFrame><Outlet /></PageFrame></main>
  </div>
}
