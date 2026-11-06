import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ClassificationPicker } from '@/features/products/components/product-wizard'
import {
  loadOpeningStocks,
  setOpeningStock,
  type OpeningStockBalance,
} from '@/features/products/services/product-api.service'
import { PRODUCT_CATALOG_QUERY_KEY } from '@/features/products/hooks/product-catalog.key'
import type { CatalogData } from '@/features/products/types/product-catalog.types'
import type { ProductBase, ProductWarehouse } from '@/features/products/types/product.types'

type Props = { product: ProductBase; warehouses: ProductWarehouse[]; onClose: () => void }

export function OpeningStockDialog({ product, warehouses, onClose }: Props) {
  const client = useQueryClient()
  const balances = useQuery({
    queryKey: ['products', product.id, 'opening-stocks'],
    queryFn: () => loadOpeningStocks(product.id),
  })
  const [warehouseId, setWarehouseId] = useState('')
  const [quantity, setQuantity] = useState('0')
  const [currency, setCurrency] = useState<'PEN' | 'USD'>('PEN')
  const [unitCost, setUnitCost] = useState('0')
  const current = balances.data?.find((entry) => entry.warehouseId === warehouseId)
  useEffect(() => {
    setQuantity(String(current?.quantity ?? 0))
    setCurrency(current?.currency ?? 'PEN')
    setUnitCost(String(current?.unitCost ?? 0))
  }, [warehouseId, current?.quantity, current?.currency, current?.unitCost])
  const mutation = useMutation({
    mutationFn: (balance: OpeningStockBalance) => setOpeningStock(product.id, balance),
    onSuccess: (saved) => {
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
    },
  })
  const amount = Number(quantity)
  const cost = Number(unitCost)
  return (
    <Dialog
      open
      title={`Editar producto · ${product.name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={
              mutation.isPending ||
              balances.isLoading ||
              balances.isError ||
              !warehouseId ||
              !quantity.trim() ||
              !unitCost.trim() ||
              !Number.isFinite(amount) ||
              amount < 0 ||
              !Number.isFinite(cost) ||
              cost < 0
            }
            onClick={() =>
              mutation.mutate({ warehouseId, quantity: amount, currency, unitCost: cost })
            }
          >
            {mutation.isPending ? 'Guardando...' : 'Guardar carga inicial'}
          </Button>
        </>
      }
    >
      <section className="space-y-4 rounded-xl border border-border bg-white p-5">
        <h2 className="text-sm font-semibold text-ink">4. Datos de Carga Inicial</h2>
        <p className="text-xs text-muted">
          Registra el saldo físico y el costo unitario en uno de tus almacenes. Puedes volver para
          registrar el otro.
        </p>
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
              onChange={setWarehouseId}
              placeholder="Buscar almacén..."
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-700">
            Stock actual
            <Input
              className="mt-1.5"
              type="number"
              min="0"
              step="0.001"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </label>
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
        </div>
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
        {balances.isError && (
          <p className="text-sm text-red-600">No se pudo cargar el stock del producto.</p>
        )}
        {mutation.isError && (
          <p className="text-sm text-red-600">
            {mutation.error instanceof Error
              ? mutation.error.message
              : 'No se pudo guardar la carga inicial.'}
          </p>
        )}
      </section>
    </Dialog>
  )
}
