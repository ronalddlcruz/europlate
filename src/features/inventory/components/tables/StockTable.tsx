import { Search } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { type StockRecord,type StockStatusFilter,type Warehouse } from '../../services/inventory-api.service'
import { InventoryMetric,StockAmount } from '../inventory-shared'

export function StockTable({ records, warehouses, loading, status, onStatusChange }: { records: StockRecord[]; warehouses: Warehouse[]; loading: boolean; status: StockStatusFilter; onStatusChange: (status: StockStatusFilter) => void }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const activeWarehouses = warehouses.filter(item => item.status === 'ACTIVE')
  const visibleRecords = records
    .filter(item => `${item.code} ${item.category} ${item.subcategory} ${item.product}`.toLowerCase().includes(search.toLowerCase()))
    .sort((left, right) => left.code.localeCompare(right.code, 'es', { numeric: true, sensitivity: 'base' }))
  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(visibleRecords.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginatedRecords = visibleRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const columns = 12 + activeWarehouses.length
  const totalStock = records.reduce((sum, item) => sum + item.total, 0)
  const totalInventoryUnits = records.reduce((sum, item) => sum + item.total / (item.factor > 0 ? item.factor : 1), 0)
  const formatQuantity = (value: number) => value.toLocaleString('es-PE', { maximumFractionDigits: 2 })
  const inventoryValuation = records.reduce((sum, item) => sum + item.costPen, 0)
  const reservedStock = records.reduce((sum, item) => sum + item.inProduction, 0)
  const lowStock = records.filter(item => item.total < item.minimum * item.factor).length
  return <>
    <div className="mb-5 grid divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100 bg-slate-50/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
      <InventoryMetric label="Total existencias" value={`${formatQuantity(totalInventoryUnits)} UM`} detail={`${formatQuantity(totalStock)} unidades físicas registradas`} tone="blue" highlightDetail />
      <InventoryMetric label="Valorización del inventario (S/)" value={`S/ ${inventoryValuation.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} detail="Valor del stock recibido" tone="green" />
      <InventoryMetric label="En producción" value={reservedStock.toLocaleString('es-PE')} detail="Unidades comprometidas" tone="green" />
      <InventoryMetric label="Alertas de stock" value={lowStock} detail="Por debajo del mínimo" tone="amber" />
    </div>
    <style>{`.inventory-module { max-width: none !important; padding-left: 1rem; padding-right: 1rem; } .inventory-module > section.card > header > div:last-child { display: none; }`}</style>
    <div className="mt-5 rounded-xl border border-slate-200 bg-[#f8fafc] p-3.5">
      <div className="flex flex-wrap items-end gap-5">
        <label className="block max-w-[430px] flex-1">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[.4px] text-slate-500">Buscar</span>
          <span className="relative block max-w-[430px]"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><Input value={search} onChange={event => { setSearch(event.target.value); setPage(1) }} className="h-9 bg-white pl-9" placeholder="Buscar producto, categoría o tipo…" /></span>
        </label>
        <div>
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[.4px] text-slate-500">Estado</span>
          <div className="flex gap-2">{([['ALL', 'Todos'], ['ACTIVE', 'Activo'], ['INACTIVE', 'Inactivo']] as const).map(([value, label]) => <Button key={value} type="button" size="sm" variant={status === value ? 'default' : 'outline'} onClick={() => { onStatusChange(value); setPage(1) }}>{label}</Button>)}</div>
        </div>
      </div>
    </div>
    <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[1440px] text-left">
      <thead><tr className="bg-[#f7f9fc] text-[11px] uppercase tracking-[.45px] text-muted">
        {['Código', 'Categoría', 'Subcategoría', 'Producto', 'Estado', 'Unidad de inventario', 'Stock total'].map(value =>
          <th key={value} className={`border-y border-border px-4 py-3 font-semibold ${value === 'Código' ? 'w-[94px] min-w-[94px] whitespace-nowrap px-3' : ''}`}>{value}</th>)}
        {activeWarehouses.map(item => <th key={item.id} className="border-y border-l-2 border-border px-4 py-3 text-right font-semibold text-brand">{item.name}</th>)}
        {['Disponible (no en prod.)', 'En producción (UM inv.)', 'Stock mín.', 'Costo total (USD)', 'Costo total (S/)'].map(value =>
          <th key={value} className={`border-y border-border px-4 py-3 font-semibold ${value === 'Stock mín.' ? 'min-w-[150px] whitespace-nowrap text-center' : ''}`}>{value}</th>)}
      </tr></thead>
      <tbody>{loading ? <tr><td colSpan={columns} className="p-10 text-center text-sm text-muted">Cargando stock desde la base de datos…</td></tr> : paginatedRecords.length ? paginatedRecords.map(item => {
        const low = item.total < item.minimum * item.factor
        const unitName = item.unitName ?? item.unit
        return <tr key={item.productId} className="border-b border-border text-[13px] hover:bg-slate-50/70">
          <td className="w-[94px] min-w-[94px] whitespace-nowrap px-3 py-3.5 font-mono text-[10px] font-bold tracking-tight text-brand">{item.code}</td>
          <td className="max-w-[190px] px-4 py-3.5"><span className="inline-block max-w-full truncate rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-brand" title={item.category}>{item.category}</span></td>
          <td className="max-w-[190px] px-4 py-3.5 text-slate-700"><span className="block truncate" title={item.subcategory}>{item.subcategory}</span></td>
          <td className="max-w-[360px] px-4 py-3.5 font-medium text-ink"><span className="block truncate" title={item.product}>{item.product}</span></td>
          <td className="px-4 py-3.5"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{item.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}</span></td>
          <td className="px-4 py-3.5 text-muted">{unitName}</td>
          <td className={`px-4 py-3.5 text-right font-mono font-bold ${low ? 'text-red-600' : 'text-emerald-600'}`}><StockAmount quantity={item.total} unitName={unitName} factor={item.factor} />{low && ' ⚠'}</td>
          {activeWarehouses.map(warehouse => { const entry = item.warehouses.find(candidate => candidate.id === warehouse.id); return <td key={warehouse.id} className="border-l-2 border-border px-4 py-3.5 text-right font-mono">{entry ? <StockAmount quantity={entry.quantity} unitName={unitName} factor={item.factor} /> : '—'}</td> })}
          <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-600"><StockAmount quantity={item.available} unitName={unitName} factor={item.factor} /></td>
          <td className="px-4 py-3.5 text-right font-mono font-bold text-brand">{item.inProduction ? <StockAmount quantity={item.inProduction} unitName={unitName} factor={item.factor} /> : '—'}</td>
          <td className="min-w-[150px] whitespace-nowrap px-4 py-3.5 text-center font-mono">{item.minimum} {unitName}</td>
          <td className="px-4 py-3.5 text-right font-mono text-amber-600">USD {item.costUsd.toFixed(2)}</td>
          <td className="px-4 py-3.5 text-right font-mono text-emerald-600">S/ {item.costPen.toFixed(2)}</td>
        </tr>
      }) : <tr><td colSpan={columns} className="p-10 text-center text-sm text-muted">No hay productos que coincidan con la búsqueda.</td></tr>}</tbody>
    </table></div>
    {visibleRecords.length > pageSize && <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-4 text-xs text-muted"><span>Mostrando {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, visibleRecords.length)} de {visibleRecords.length} productos</span><div className="flex items-center gap-2"><button type="button" disabled={currentPage === 1} onClick={() => setPage(value => Math.max(1, value - 1))} className="disabled:text-slate-300">‹ Anterior</button><span className="font-medium text-slate-700">Página {currentPage} de {totalPages}</span><button type="button" disabled={currentPage === totalPages} onClick={() => setPage(value => Math.min(totalPages, value + 1))} className="disabled:text-slate-300">Siguiente ›</button></div></div>}
  </>
}
