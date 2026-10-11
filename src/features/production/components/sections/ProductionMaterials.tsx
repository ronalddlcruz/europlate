import { Button } from '../../../../components/ui/button';
import { type ProductionOrder } from '../../services/production-api.service';


export function ProductionMaterials({ orders, loading, consuming, onConsume }: { orders: ProductionOrder[]; loading: boolean; consuming: boolean; onConsume: (orderId: string, materialId: string) => void }) {
  const groups = new Map<string, { code: string; product: string; warehouse: string; unitName: string; quantity: number; items: { orderId: string; materialId: string; number: string }[] }>()
  for (const order of orders) for (const material of order.materials.filter(item => item.status === 'Reservado')) {
    const key = `${material.productId}:${material.warehouseId}`
    const group = groups.get(key) ?? { code: material.code, product: material.product, warehouse: material.warehouse, unitName: material.unitName, quantity: 0, items: [] }
    if (!material.shareReservation) group.quantity += material.quantity
    group.items.push({ orderId: order.id, materialId: material.id, number: order.number })
    groups.set(key, group)
  }
  const rows = [...groups.values()]
  return <section className="card"><header><h1 className="text-sm font-semibold">Productos en Producción</h1><p className="mt-1 text-xs text-muted">Insumos reservados y compartidos entre órdenes. Al consumir, se descuenta una sola vez la unidad reservada y se cierran todas sus referencias.</p></header><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[860px] text-left"><thead><tr className="bg-[#f7f9fc] text-[11px] uppercase tracking-[.5px] text-muted">{['Código', 'Insumo', 'Almacén', 'Cantidad reservada', 'Órdenes que lo usan', 'Estado', ''].map(value => <th className="border-y border-border px-4 py-3 font-semibold" key={value}>{value}</th>)}</tr></thead><tbody>{loading ? <tr><td colSpan={7} className="p-10 text-center text-sm text-muted">Cargando reservas…</td></tr> : rows.length ? rows.map(row => <tr key={`${row.code}:${row.warehouse}`} className="border-b border-border text-[13px]"><td className="px-4 py-3.5 font-mono text-xs text-muted">{row.code}</td><td className="px-4 py-3.5 font-medium">{row.product}</td><td className="px-4 py-3.5">{row.warehouse}</td><td className="px-4 py-3.5 font-mono font-bold text-brand">{row.quantity} {row.unitName}</td><td className="px-4 py-3.5">{row.items.map(item => <span key={item.materialId} className="mr-1 inline-block rounded bg-blue-50 px-2 py-1 font-mono text-xs text-brand">{item.number}</span>)}</td><td className="px-4 py-3.5"><span className="text-xs text-blue-700">Reservado</span></td><td className="px-4 py-3 text-right"><Button size="sm" variant="outline" disabled={consuming} onClick={() => onConsume(row.items[0].orderId, row.items[0].materialId)} className="border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100">{consuming ? 'Guardando…' : 'Consumido'}</Button></td></tr>) : <tr><td colSpan={7} className="p-10 text-center text-sm text-muted">No hay productos en producción.</td></tr>}</tbody></table></div></section>
}
