import { ArrowDownToLine,Boxes,ChevronLeft,ChevronRight,Factory,FileSpreadsheet,SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export type Report = 'stock' | 'movements' | 'purchases' | 'production'

export const PAGE_SIZE = 10

export const cards: { id: Report; title: string; description: string; icon: typeof Boxes; colors: string }[] = [
  { id: 'stock', title: 'Stock total', description: 'Todos los productos y existencias por almacén', icon: Boxes, colors: 'bg-emerald-100 text-emerald-700' },
  { id: 'movements', title: 'Movimientos de inventario', description: 'Ingresos, salidas, ajustes, traslados y producción', icon: SlidersHorizontal, colors: 'bg-amber-100 text-amber-700' },
  { id: 'purchases', title: 'Compras e importaciones', description: 'Documentos registrados y sus importes', icon: ArrowDownToLine, colors: 'bg-violet-100 text-violet-700' },
  { id: 'production', title: 'Órdenes de producción', description: 'Producciones registradas y sus salidas', icon: Factory, colors: 'bg-pink-100 text-pink-700' },
]

export const movementLabels: Record<string, string> = { PURCHASE_RECEIPT: 'Ingreso por compra nacional', IMPORT_RECEIPT: 'Ingreso por importación', SALE_OUT: 'Salida de inventario', PRODUCTION_CONSUMPTION: 'Consumo en producción', PRODUCTION_OUTPUT: 'Ingreso por producción', TRANSFER_IN: 'Transferencia recibida', TRANSFER_OUT: 'Transferencia enviada', ADJUSTMENT_IN: 'Ajuste de ingreso', ADJUSTMENT_OUT: 'Salida de producto', ADJUSTMENT_WASTE: 'Merma', INITIAL_STOCK: 'Stock inicial' }

export const purchaseLabels: Record<string, string> = { DRAFT: 'Borrador', APPROVED: 'Aprobada', RECEIVED: 'Recibida', CANCELLED: 'Anulada', IN_TRANSIT: 'En tránsito' }

export const productionLabels: Record<string, string> = { PLANNED: 'Planificada', IN_PROGRESS: 'En producción', COMPLETED: 'Completada', CANCELLED: 'Cancelada' }

export const roleLabels: Record<string, string> = { MERCHANDISE: 'Mercadería', SUPPLY: 'Insumo', FINISHED_PRODUCT: 'Producto terminado' }

export const dateKey = (value: string) => value.slice(0, 10)

export const localDate = (value: string) => new Date(value).toLocaleDateString('es-PE')

export const amount = (value: number) => new Intl.NumberFormat('es-PE', { maximumFractionDigits: 3 }).format(value)

export const Select = ({ children, value, onChange }: { children: React.ReactNode; value: string; onChange: (value: string) => void }) => <select value={value} onChange={event => onChange(event.target.value)} className="h-9 w-full rounded-md border border-border bg-[#f4f7fb] px-3 text-sm outline-none focus:border-brand">{children}</select>

export function exportCsv(name: string, headers: string[], rows: (string | number)[][]) {
  const safe = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`
  const blob = new Blob([`\uFEFF${[headers, ...rows].map(row => row.map(safe).join(';')).join('\n')}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${name}-${dateKey(new Date().toISOString())}.csv`; link.click(); URL.revokeObjectURL(url)
}

export function usePagination<T>(rows: T[]) {
  const [requestedPage, setRequestedPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const page = Math.min(requestedPage, totalPages)
  return { page, totalPages, rows: rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), goTo: setRequestedPage }
}

export function Pagination({ page, totalPages, total, goTo }: { page: number; totalPages: number; total: number; goTo: (page: number) => void }) {
  if (total <= PAGE_SIZE) return null
  const first = (page - 1) * PAGE_SIZE + 1; const last = Math.min(page * PAGE_SIZE, total)
  return <footer className="flex flex-wrap items-center justify-between gap-3 px-1 pt-4 text-xs text-muted"><span>Mostrando {first}–{last} de {total} registros</span><div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={page === 1} onClick={() => goTo(page - 1)}><ChevronLeft className="h-3.5 w-3.5" />Anterior</Button><span className="font-medium text-slate-700">Página {page} de {totalPages}</span><Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => goTo(page + 1)}>Siguiente<ChevronRight className="h-3.5 w-3.5" /></Button></div></footer>
}

export function Empty({ children }: { children: React.ReactNode }) { return <tr><td colSpan={20} className="p-10 text-center text-sm text-muted">{children}</td></tr> }

export function ExcelButton({ onClick }: { onClick: () => void }) { return <Button size="sm" variant="outline" onClick={onClick}><FileSpreadsheet className="h-4 w-4 text-emerald-600" />Exportar Excel</Button> }
