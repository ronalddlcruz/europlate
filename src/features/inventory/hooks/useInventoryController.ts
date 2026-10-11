import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query'
import { useEffect,useRef,useState } from 'react'
import { type Tab } from '../components/inventory-shared'
import { createAdjustment,createTransfer,listAdjustments,listMovements,listStock,listTransfers,listWarehouses,loadInventoryCatalog,movementFromAdjustment,movementsFromTransfer,transferFromCreated,type Movement,type StockRecord,type StockStatusFilter,type Transfer } from '../services/inventory-api.service'

export function useInventoryController() {
  const client = useQueryClient(); const [tab, setTab] = useState<Tab>('stock'); const [modal, setModal] = useState<'transfer' | 'adjustment' | null>(null); const [stockStatus, setStockStatus] = useState<StockStatusFilter>('ACTIVE'); const [notice, setNotice] = useState('')
  const [transferDraft, setTransferDraft] = useState<Parameters<typeof createTransfer>[0] | null>(null)
  const noticeTimer = useRef<number | undefined>(undefined)
  // La referencia evita dos solicitudes antes de que React alcance a repintar
  // el botón deshabilitado tras el primer clic.
  const transferInFlight = useRef(false)
  const adjustmentInFlight = useRef(false)
  const stock = useQuery({ queryKey: ['inventory', 'stock', stockStatus], queryFn: () => listStock(stockStatus), staleTime: 0, refetchOnMount: 'always' }); const catalog = useQuery({ queryKey: ['inventory', 'catalog'], queryFn: loadInventoryCatalog }); const movements = useQuery({ queryKey: ['inventory', 'movements'], queryFn: listMovements, enabled: tab === 'movements', staleTime: 0 }); const transfers = useQuery({ queryKey: ['inventory', 'transfers'], queryFn: listTransfers }); const adjustments = useQuery({ queryKey: ['inventory', 'adjustments'], queryFn: listAdjustments }); const warehouses = useQuery({ queryKey: ['inventory', 'warehouses'], queryFn: listWarehouses })
  const transferStock = useQuery({ queryKey: ['inventory', 'stock', 'ACTIVE'], queryFn: () => listStock('ACTIVE'), enabled: modal === 'transfer', staleTime: 0, refetchOnMount: 'always' })
  const notify = (message: string, duration: number | null = 3200) => {
    window.clearTimeout(noticeTimer.current)
    setNotice(message)
    if (duration !== null) noticeTimer.current = window.setTimeout(() => setNotice(''), duration)
  }
  useEffect(() => () => window.clearTimeout(noticeTimer.current), [])
  const showNewMovements = (incoming: Movement[]) => {
    client.setQueryData<Movement[]>(['inventory', 'movements'], current => {
      if (current?.some(item => item.reference === incoming[0]?.reference)) return current
      return [...incoming, ...(current ?? [])]
    })
  }
  const transfer = useMutation({
    mutationFn: createTransfer,
    onSuccess: created => {
      showNewMovements(movementsFromTransfer(created))
      client.setQueryData<Transfer[]>(['inventory', 'transfers'], current => [transferFromCreated(created), ...(current ?? []).filter(item => item.id !== created.id)])
      const baseQuantity = Number(created.quantity) * Number(created.presentation?.factor ?? 1)
      for (const [queryKey] of client.getQueriesData<StockRecord[]>({ queryKey: ['inventory', 'stock'] })) {
        client.setQueryData<StockRecord[]>(queryKey, current => current?.map(record => {
          if (record.productId !== created.product.id) return record
          const warehouses = record.warehouses.map(entry => entry.id === created.fromWarehouse.id
            ? { ...entry, quantity: Math.max(0, entry.quantity - baseQuantity) }
            : entry.id === created.toWarehouse.id
              ? { ...entry, quantity: entry.quantity + baseQuantity }
              : entry)
          if (!warehouses.some(entry => entry.id === created.toWarehouse.id)) warehouses.push({ id: created.toWarehouse.id, name: created.toWarehouse.name, quantity: baseQuantity })
          return { ...record, warehouses }
        }))
      }
      setTransferDraft(null)
      notify('Transferencia registrada y stock actualizado.')
    },
    onError: e => {
      void client.invalidateQueries({ queryKey: ['inventory', 'stock', 'ACTIVE'] })
      setModal('transfer')
      notify(e instanceof Error ? e.message : 'No se pudo transferir.')
    },
    onSettled: () => { transferInFlight.current = false },
  })
  const adjustment = useMutation({
    mutationFn: createAdjustment,
    // Cerramos de inmediato; la actualización de consultas queda en segundo plano.
    onSuccess: created => { showNewMovements([movementFromAdjustment(created)]); setModal(null); notify('Ajuste aplicado y registrado en auditoría.') },
    onError: e => notify(e instanceof Error ? e.message : 'No se pudo aplicar el ajuste.'),
    onSettled: () => { adjustmentInFlight.current = false },
  })
  const submitTransfer = (payload: Parameters<typeof createTransfer>[0]) => {
    if (transferInFlight.current || transfer.isPending) return
    transferInFlight.current = true
    setTransferDraft(payload)
    setModal(null)
    notify('Registrando transferencia…', null)
    transfer.mutate(payload)
  }
  const submitAdjustment = (payload: Parameters<typeof createAdjustment>[0]) => {
    if (adjustmentInFlight.current || adjustment.isPending) return
    adjustmentInFlight.current = true
    adjustment.mutate(payload)
  }
  const tabs: [Tab, string][] = [['stock', 'Stock Actual'], ['adjustments', 'Ajuste de Inventario'], ['transfers', 'Transferencias'], ['movements', 'Movimientos']]

  return { client, tab, setTab, modal, setModal, stockStatus, setStockStatus, notice, setNotice, transferDraft, setTransferDraft, noticeTimer, transferInFlight, adjustmentInFlight, stock, catalog, movements, transfers, adjustments, warehouses, transferStock, notify, showNewMovements, transfer, adjustment, submitTransfer, submitAdjustment, tabs }
}
