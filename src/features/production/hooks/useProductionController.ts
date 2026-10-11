import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { type Tab } from '../components/shared'
import { consumeProductionMaterial,createProductionOrder,deleteProductionOrder,getProductionOrder,listProductionOrders,loadProductionCatalog,type ProductionCatalog,type ProductionOrder } from '../services/production-api.service'

export function useProductionController() {
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

  return { client, tab, setTab, newOrder, setNewOrder, viewing, setViewing, notice, setNotice, ordersQuery, catalogQuery, detailQuery, notify, refreshInventoryViews, createMutation, consumeMutation, deleteMutation, orders }
}
