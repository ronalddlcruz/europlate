import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { Dialog } from '../../../components/ui/dialog'
import { ProductionOrderDialog } from '../components/production-order-dialog'
import { consumeProductionMaterial, createProductionOrder, deleteProductionOrder, getProductionOrder, listProductionOrders, loadProductionCatalog, type ProductionCatalog, type ProductionOrder, type ProductionPayload, type ProductionStatus } from '../services/production-api.service'

type Tab = 'orders' | 'active'
const statusClass: Record<ProductionStatus, string> = { Planificada: 'bg-amber-100 text-amber-700', 'En producción': 'bg-blue-100 text-blue-700', Completada: 'bg-emerald-100 text-emerald-700', Cancelada: 'bg-red-100 text-red-700' }
const Status = ({ status }: { status: ProductionStatus }) => <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass[status]}`}>{status}</span>

export function ProductionPage() {
  const client = useQueryClient(); const [tab, setTab] = useState<Tab>('orders'); const [newOrder, setNewOrder] = useState(false); const [viewing, setViewing] = useState<ProductionOrder | null>(null); const [notice, setNotice] = useState('')
  const ordersQuery = useQuery({ queryKey: ['production'], queryFn: listProductionOrders, staleTime: 30_000 }); const catalogQuery = useQuery({ queryKey: ['production', 'catalog'], queryFn: loadProductionCatalog, staleTime: 0, gcTime: 15 * 60_000, refetchOnMount: 'always', refetchOnWindowFocus: true })
  const detailQuery = useQuery({ queryKey: ['production', 'detail', viewing?.id], queryFn: () => getProductionOrder(viewing!.id), enabled: Boolean(viewing && !viewing.id.startsWith('pending-')), staleTime: 0 })
  const notify = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 3200) }
  const refreshInventoryViews = () => Promise.all([
    client.invalidateQueries({ queryKey: ['inventory'], refetchType: 'all' }),
    client.invalidateQueries({ queryKey: ['reports'], refetchType: 'all' }),
    client.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'all' }),
    client.invalidateQueries({ queryKey: ['purchases', 'catalog'], refetchType: 'all' }),
    client.invalidateQueries({ queryKey: ['imports', 'catalog'], refetchType: 'all' }),
  ])
  const createMutation = useMutation({
    mutationFn: createProductionOrder,
    onMutate: async payload => {
      await client.cancelQueries({ queryKey: ['production'] })
      const previous = client.getQueryData<ProductionOrder[]>(['production'])
      const catalog = client.getQueryData<ProductionCatalog>(['production', 'catalog'])
      const product = catalog?.products.find(item => item.id === payload.productId)
      const warehouse = catalog?.warehouses.find(item => item.id === payload.warehouseId)
      const temporaryId = `pending-${crypto.randomUUID()}`
      const pendingOrder: ProductionOrder = {
        id: temporaryId,
        number: 'En cola…',
        productId: payload.productId,
        warehouseId: payload.warehouseId,
        product: product?.name ?? 'Producto terminado',
        unit: product?.unit ?? '—',
        unitName: product?.unitName ?? product?.unit ?? '—',
        warehouse: warehouse?.name ?? 'Almacén seleccionado',
        quantity: payload.quantity,
        date: payload.scheduledAt.slice(0, 10),
        status: 'Completada',
        note: payload.note ?? null,
        outputDispatched: payload.outputDispatched,
        outputJustification: payload.outputJustification ?? null,
        materials: payload.materials.map((line, index) => {
          const material = catalog?.materials.find(item => item.id === line.productId)
          return {
            id: temporaryId + ':' + index,
            productId: line.productId,
            warehouseId: line.warehouseId,
            product: material?.name ?? 'Insumo',
            code: material?.code ?? '—',
            warehouse: catalog?.warehouses.find(item => item.id === line.warehouseId)?.name ?? 'Almacén',
            unit: material?.unit ?? '—',
            unitName: material?.unitName ?? material?.unit ?? '—',
            quantity: line.quantity,
            status: 'Reservado' as const,
            immediateConsumption: line.immediateConsumption,
            shareReservation: Boolean(line.shareReservation),
          }
        }),
      }
      client.setQueryData<ProductionOrder[]>(['production'], current => [pendingOrder, ...(current ?? [])])
      setNewOrder(false)
      notify(payload.outputDispatched ? 'Producción y salida en cola: registrando en la base de datos…' : 'Producción en cola: registrando en la base de datos…')
      return { previous, temporaryId }
    },
    onSuccess: async (order, _payload, context) => {
      client.setQueryData<ProductionOrder[]>(['production'], current => [order, ...(current ?? []).filter(item => item.id !== context?.temporaryId)])
      setViewing(current => current?.id === context?.temporaryId ? order : current)
      await Promise.all([
        client.invalidateQueries({ queryKey: ['production'], refetchType: 'all' }),
        client.invalidateQueries({ queryKey: ['production', 'catalog'], refetchType: 'all' }),
        refreshInventoryViews(),
      ])
      notify('Orden registrada y tabla sincronizada con la base de datos.')
    },
    onError: (error, _payload, context) => {
      client.setQueryData(['production'], context?.previous)
      notify(error instanceof Error ? error.message : 'No se pudo crear la orden.')
    },
  })
  const consumeMutation = useMutation({ mutationFn: ({ orderId, materialId }: { orderId: string; materialId: string }) => consumeProductionMaterial(orderId, materialId), onSuccess: async order => { client.setQueryData<ProductionOrder[]>(['production'], current => current?.map(item => item.id === order.id ? order : item) ?? [order]); await Promise.all([client.invalidateQueries({ queryKey: ['production'], refetchType: 'all' }), client.invalidateQueries({ queryKey: ['production', 'catalog'], refetchType: 'all' }), refreshInventoryViews()]); notify('Insumo consumido y stock actualizado.') }, onError: error => notify(error instanceof Error ? error.message : 'No se pudo consumir el insumo.') })
  const deleteMutation = useMutation({ mutationFn: deleteProductionOrder, onSuccess: (_, id) => { client.setQueryData<ProductionOrder[]>(['production'], current => current?.filter(item => item.id !== id) ?? []); notify('Orden eliminada.') }, onError: error => notify(error instanceof Error ? error.message : 'Solo se eliminan órdenes planificadas.') })
  const orders = ordersQuery.data ?? []
  return <div className="mx-auto w-full max-w-[1540px]"><nav className="mb-5 flex gap-1 border-b border-border bg-white/70 px-2" aria-label="Secciones de producción"><button onClick={() => setTab('orders')} className={`border-b-2 px-5 py-3 text-[13px] font-medium ${tab === 'orders' ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink'}`}>Órdenes de Producción</button><button onClick={() => setTab('active')} className={`border-b-2 px-5 py-3 text-[13px] font-medium ${tab === 'active' ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink'}`}>Productos en Producción</button></nav>{tab === 'orders' ? <section className="card"><header className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-sm font-semibold">Órdenes de Producción</h1><p className="mt-1 text-xs text-muted">Registra y controla la fabricación de productos terminados.</p></div><Button size="sm" onClick={() => setNewOrder(true)} disabled={catalogQuery.isLoading || catalogQuery.isError}><Plus className="h-4 w-4" />Nueva orden</Button></header><OrdersTable orders={orders} loading={ordersQuery.isLoading} failed={ordersQuery.isError} onView={setViewing} onDelete={id => deleteMutation.mutate(id)} /></section> : <ProductionMaterials orders={orders} loading={ordersQuery.isLoading} consuming={consumeMutation.isPending} onConsume={(orderId, materialId) => consumeMutation.mutate({ orderId, materialId})} />}{newOrder && catalogQuery.data && <ProductionOrderDialog catalog={catalogQuery.data} saving={createMutation.isPending} onClose={() => setNewOrder(false)} onSave={payload => { createMutation.mutate(payload); return Promise.resolve() }} />}{viewing && <ProductionOrderDetail order={detailQuery.data ?? viewing} loading={detailQuery.isLoading} failed={detailQuery.isError} onClose={() => setViewing(null)} />}{notice && <div className="fixed bottom-6 right-6 z-[60] max-w-sm rounded-md border border-border border-l-4 border-l-emerald-600 bg-white px-4 py-3 text-sm shadow-panel">{notice}</div>}</div>
}

function OrdersTable({ orders, loading, failed, onView, onDelete }: { orders: ProductionOrder[]; loading: boolean; failed: boolean; onView: (order: ProductionOrder) => void; onDelete: (id: string) => void }) { return <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="bg-[#f7f9fc] text-[11px] uppercase tracking-[.5px] text-muted">{['N° Orden', 'Producto terminado', 'Cantidad', 'Fecha de producción', 'Estado', ''].map(value => <th className="border-y border-border px-4 py-3 font-semibold" key={value}>{value}</th>)}</tr></thead><tbody>{loading ? <tr><td colSpan={6} className="p-10 text-center text-sm text-muted">Cargando órdenes desde la base de datos…</td></tr> : failed ? <tr><td colSpan={6} className="p-10 text-center text-sm text-red-600">No se pudieron cargar las órdenes.</td></tr> : orders.length ? orders.map(order => <tr key={order.id} className="border-b border-border text-[13px]"><td className="px-4 py-3.5 font-mono font-bold text-brand">{order.number}</td><td className="px-4 py-3.5 font-medium">{order.product}</td><td className="px-4 py-3.5 font-mono">{order.quantity} {order.unitName}</td><td className="px-4 py-3.5 text-slate-600">{order.date}</td><td className="px-4 py-3.5"><Status status={order.status} />{order.outputDispatched && <span className="ml-2 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700">↗ Salida de inventario</span>}</td><td className="whitespace-nowrap px-4 py-3 text-right"><Button size="sm" variant="outline" onClick={() => onView(order)}><Eye className="h-3.5 w-3.5" />Ver detalle</Button>{(order.status === 'Planificada' || order.status === 'Cancelada') && <button aria-label="Eliminar orden" onClick={() => onDelete(order.id)} className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded border border-red-200 bg-red-50 text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>}</td></tr>) : <tr><td colSpan={6} className="p-10 text-center text-sm text-muted">Aún no hay órdenes de producción registradas.</td></tr>}</tbody></table></div> }

function ProductionMaterials({ orders, loading, consuming, onConsume }: { orders: ProductionOrder[]; loading: boolean; consuming: boolean; onConsume: (orderId: string, materialId: string) => void }) {
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

function ProductionOrderDetail({ order, loading, failed, onClose }: { order: ProductionOrder; loading: boolean; failed: boolean; onClose: () => void }) {
  return <Dialog open wide title="Detalle de Orden de Producción" onClose={onClose} footer={<Button variant="outline" onClick={onClose}>Cerrar</Button>}>
    <div className="space-y-5">
      {failed && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">No se pudo actualizar el detalle. Se muestra la última versión disponible de la orden.</p>}
      <section className="rounded-lg border border-blue-100 bg-blue-50/60 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-xs font-bold text-brand">{order.number}</p><h2 className="mt-1 text-base font-semibold text-ink">{order.product}</h2><p className="mt-1 text-xs text-muted">Producto terminado registrado en la orden.</p></div><div className="text-right"><Status status={order.status} />{order.outputDispatched && <span className="ml-2 inline-block rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700">↗ Salida de inventario</span>}</div></div>
      </section>
      <section className="grid gap-3 sm:grid-cols-3"><DetailField label="Cantidad producida" value={`${order.quantity} ${order.unitName}`} /><DetailField label="Almacén de destino" value={order.warehouse} /><DetailField label="Fecha de producción" value={order.date} /></section>
      <section className="rounded-lg border border-border bg-[#f8fafc] p-4"><p className="text-[11px] font-semibold uppercase tracking-[.45px] text-slate-600">Observación</p><p className="mt-2 text-sm text-slate-700">{order.note || 'Sin observación registrada.'}</p></section>
      {order.outputDispatched && <section className="rounded-lg border border-amber-200 bg-amber-50 p-4"><p className="text-[11px] font-semibold uppercase tracking-[.45px] text-amber-800">Salida de inventario</p><p className="mt-2 text-sm text-amber-900">{order.outputJustification || 'Salida registrada junto con la orden de producción.'}</p></section>}
      <section><div className="mb-3 flex items-end justify-between gap-3"><div><h3 className="text-sm font-semibold text-ink">Insumos de la orden</h3><p className="mt-1 text-xs text-muted">Materiales consumidos o reservados para esta producción.</p></div><span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{order.materials.length} {order.materials.length === 1 ? 'insumo' : 'insumos'}</span></div>{loading && <p className="mb-2 text-xs text-muted">Actualizando detalle…</p>}<div className="overflow-x-auto rounded-lg border border-border"><table className="w-full min-w-[680px] text-left"><thead><tr className="bg-[#f7f9fc] text-[11px] uppercase tracking-[.45px] text-muted">{['Código', 'Insumo', 'Almacén', 'Cantidad', 'Tipo', 'Estado'].map(value => <th key={value} className="border-b border-border px-3 py-3 font-semibold">{value}</th>)}</tr></thead><tbody>{order.materials.length ? order.materials.map(material => <tr key={material.id} className="border-b border-border last:border-0 text-[13px]"><td className="px-3 py-3 font-mono text-xs text-brand">{material.code}</td><td className="px-3 py-3 font-medium text-ink">{material.product}</td><td className="px-3 py-3 text-slate-600">{material.warehouse}</td><td className="px-3 py-3 font-mono font-semibold text-brand">{material.quantity} {material.unitName}</td><td className="px-3 py-3">{material.shareReservation ? <span className="rounded bg-violet-100 px-2 py-1 text-[10px] font-semibold text-violet-700">Compartido</span> : material.immediateConsumption ? <span className="rounded bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700">Inmediato</span> : <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">Reservado</span>}</td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${material.status === 'Consumido' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{material.status}</span></td></tr>) : <tr><td colSpan={6} className="p-6 text-center text-sm text-muted">Esta orden no tiene insumos registrados.</td></tr>}</tbody></table></div></section>
    </div>
  </Dialog>
}

function DetailField({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-border bg-white p-3.5"><p className="text-[10px] font-semibold uppercase tracking-[.45px] text-slate-500">{label}</p><p className="mt-1.5 text-sm font-semibold text-ink">{value}</p></div> }
