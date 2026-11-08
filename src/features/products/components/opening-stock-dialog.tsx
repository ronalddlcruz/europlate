import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ClassificationPicker } from '@/features/products/components/classification-picker'
import { createAdjustment } from '@/features/inventory/services/inventory-api.service'
import {
  loadOpeningStocks,
  setOpeningStock,
  type OpeningStockBalance,
} from '@/features/products/services/product-api.service'
import { PRODUCT_CATALOG_QUERY_KEY } from '@/features/products/hooks/product-catalog.key'
import type { CatalogData } from '@/features/products/types/product-catalog.types'
import type { ProductBase, ProductWarehouse } from '@/features/products/types/product.types'

type Props = {
  product: ProductBase
  warehouses: ProductWarehouse[]
  onClose: () => void
  embedded?: boolean
  canAdjustStock?: boolean
  canManageOpeningStock?: boolean
}

type StockOperation = 'INITIAL' | 'IN' | 'OUT'

export function OpeningStockEditor({
  product,
  warehouses,
  onClose,
  embedded = false,
  canAdjustStock = false,
  canManageOpeningStock = false,
}: Props) {
  const client = useQueryClient()
  const balances = useQuery({
    queryKey: ['products', product.id, 'opening-stocks'],
    queryFn: () => loadOpeningStocks(product.id),
  })
  const [warehouseId, setWarehouseId] = useState('')
  const [operation, setOperation] = useState<StockOperation>(canAdjustStock ? 'IN' : 'INITIAL')
  const [quantity, setQuantity] = useState('')
  const [currency, setCurrency] = useState<'PEN' | 'USD'>('PEN')
  const [unitCost, setUnitCost] = useState('0')
  const [reason, setReason] = useState('')
  const current = balances.data?.find((entry) => entry.warehouseId === warehouseId)
  const available = current?.quantity ?? 0
  useEffect(() => {
    setCurrency(current?.currency ?? 'PEN')
    setUnitCost(String(current?.unitCost ?? 0))
  }, [current?.currency, current?.unitCost])
  const syncBalance = (saved: OpeningStockBalance) => {
    const previous = balances.data?.find((entry) => entry.warehouseId === saved.warehouseId)
    const difference = saved.quantity - (previous?.quantity ?? 0)
    client.setQueryData<CatalogData>(
      PRODUCT_CATALOG_QUERY_KEY,
      (catalog) =>
        catalog && {
          ...catalog,
          products: catalog.products.map((entry) =>
            entry.base.id === product.id
              ? {
                  ...entry,
                  variants: entry.variants.map((variant, index) =>
                    index === 0 ? { ...variant, stock: variant.stock + difference } : variant,
                  ),
                }
              : entry,
          ),
        },
    )
    client.setQueryData<OpeningStockBalance[]>(
      ['products', product.id, 'opening-stocks'],
      (entries) => [
        ...(entries ?? []).filter((entry) => entry.warehouseId !== saved.warehouseId),
        saved,
      ],
    )
    onClose()
    void client.invalidateQueries({ queryKey: ['products'] })
    void client.invalidateQueries({ queryKey: ['inventory'] })
    void client.invalidateQueries({ queryKey: ['dashboard'] })
  }
  const openingMutation = useMutation({
    mutationFn: (balance: OpeningStockBalance) => setOpeningStock(product.id, balance),
    onSuccess: syncBalance,
  })
  const adjustmentMutation = useMutation({
    mutationFn: ({
      type,
      amount,
      note,
      selectedWarehouseId,
    }: {
      type: 'IN' | 'OUT'
      amount: number
      note: string
      selectedWarehouseId: string
    }) =>
      createAdjustment({
        productId: product.id,
        warehouseId: selectedWarehouseId,
        type,
        quantity: amount,
        reason: note,
      }),
    onSuccess: (saved, variables) => {
      const factor = Number(saved.presentation?.factor ?? 1)
      const priorBalance = balances.data?.find(
        (entry) => entry.warehouseId === variables.selectedWarehouseId,
      )
      syncBalance({
        warehouseId: variables.selectedWarehouseId,
        quantity: Number(saved.newQuantity) / factor,
        currency: priorBalance?.currency ?? 'PEN',
        unitCost: priorBalance?.unitCost ?? 0,
      })
    },
  })
  const amount = Number(quantity)
  const cost = Number(unitCost)
  const isInitial = operation === 'INITIAL'
  const mutationError = openingMutation.error ?? adjustmentMutation.error
  const saving = openingMutation.isPending || adjustmentMutation.isPending
  const valid =
    Boolean(warehouseId && quantity.trim()) &&
    Number.isFinite(amount) &&
    amount >= 0 &&
    (isInitial ? Number.isFinite(cost) && cost >= 0 : amount > 0 && reason.trim().length >= 3) &&
    (operation !== 'OUT' || (available > 0 && amount <= available)) &&
    (isInitial ? canManageOpeningStock : canAdjustStock)
  const save = () => {
    if (!valid || saving) return
    if (operation === 'INITIAL') {
      openingMutation.mutate({ warehouseId, quantity: amount, currency, unitCost: cost })
    } else {
      adjustmentMutation.mutate({
        type: operation,
        amount,
        note: reason.trim(),
        selectedWarehouseId: warehouseId,
      })
    }
  }
  return (
    <section className="space-y-4 rounded-xl border border-border bg-white p-5">
      <h2 className="text-sm font-semibold text-ink">4. Stock del producto</h2>
      <p className="text-xs text-muted">
        Ingresa o retira stock en el almacén elegido. La carga inicial permite fijar el saldo y su
        costo antes de registrar otros movimientos.
      </p>
      {embedded && (
        <p className="text-xs text-muted">
          El stock se guarda por almacén. Si también cambiaste datos generales, guárdalos primero
          con «Guardar producto».
        </p>
      )}
      <div className="text-xs font-semibold text-slate-700">
        Almacén
        <div className="mt-1.5">
          <ClassificationPicker
            items={warehouses.map((warehouse) => ({
              id: warehouse.id,
              name: warehouse.name,
              code: warehouse.site.name,
            }))}
            value={warehouseId}
            onChange={(id) => {
              setWarehouseId(id)
              setOperation(canAdjustStock ? 'IN' : 'INITIAL')
              setQuantity('')
              setReason('')
            }}
            placeholder="Buscar almacén..."
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-slate-700">
          Operación
          <select
            className="input mt-1.5 w-full"
            value={operation}
            onChange={(event) => {
              setOperation(event.target.value as StockOperation)
              setQuantity('')
            }}
          >
            {canAdjustStock && <option value="IN">Ingreso</option>}
            {canAdjustStock && (
              <option value="OUT" disabled={available <= 0}>
                Salida
              </option>
            )}
            {canManageOpeningStock && <option value="INITIAL">Carga inicial y costo</option>}
          </select>
        </label>
        <label className="block text-xs font-semibold text-slate-700">
          {isInitial
            ? 'Nuevo saldo total'
            : operation === 'IN'
              ? 'Cantidad a ingresar'
              : 'Cantidad a retirar'}
          <Input
            className="mt-1.5"
            type="number"
            min="0"
            step="0.001"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
          {warehouseId && (
            <span className="mt-1 block font-normal text-muted" role="status">
              Stock actual en este almacén: <strong>{available}</strong>
            </span>
          )}
        </label>
        {isInitial && (
          <label className="block text-xs font-semibold text-slate-700">
            Moneda
            <select
              className="input mt-1.5 w-full"
              value={currency}
              onChange={(event) => setCurrency(event.target.value as 'PEN' | 'USD')}
            >
              <option value="PEN">Soles (S/)</option>
              <option value="USD">Dólares (USD)</option>
            </select>
          </label>
        )}
      </div>
      {isInitial && (
        <label className="block text-xs font-semibold text-slate-700">
          Costo unitario actual
          <Input
            className="mt-1.5"
            type="number"
            min="0"
            step="0.0001"
            value={unitCost}
            onChange={(event) => setUnitCost(event.target.value)}
          />
        </label>
      )}
      {!isInitial && (
        <label className="block text-xs font-semibold text-slate-700">
          Motivo del movimiento
          <Input
            className="mt-1.5"
            value={reason}
            maxLength={1000}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Ej. Corrección de conteo físico"
          />
        </label>
      )}
      {operation === 'OUT' && warehouseId && available <= 0 && (
        <p className="text-sm text-amber-700">Este almacén no tiene stock para retirar.</p>
      )}
      {operation === 'OUT' && amount > available && available > 0 && (
        <p className="text-sm text-amber-700">La salida supera el stock disponible.</p>
      )}
      {balances.isError && (
        <p className="text-sm text-red-600">No se pudo cargar el stock del producto.</p>
      )}
      {(openingMutation.isError || adjustmentMutation.isError) && (
        <p className="text-sm text-red-600">
          {mutationError instanceof Error
            ? mutationError.message
            : 'No se pudo guardar el movimiento de stock.'}
        </p>
      )}
      <div className="flex justify-end">
        <Button
          type="button"
          disabled={saving || balances.isLoading || balances.isError || !valid}
          onClick={save}
        >
          {saving ? 'Guardando...' : isInitial ? 'Guardar carga inicial' : 'Guardar movimiento'}
        </Button>
      </div>
    </section>
  )
}

export function OpeningStockDialog(props: Props) {
  return (
    <Dialog open title={`Editar stock · ${props.product.name}`} onClose={props.onClose}>
      <OpeningStockEditor {...props} />
    </Dialog>
  )
}
