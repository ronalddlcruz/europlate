import { dehydrate, hydrate, QueryClient } from '@tanstack/react-query'
import { listCustomsAgents } from '../features/customs-agents/services/customs-agent-api.service'
import { listCustomers } from '../features/customers/services/customer-api.service'
import { listImports, loadImportCatalog } from '../features/imports/services/import-api.service'
import { listAdjustments, loadInventoryCatalog, listMovements, listStock, listTransfers, listWarehouses } from '../features/inventory/services/inventory-api.service'
import { loadCatalog } from '../features/products/services/product-api.service'
import { listProductionOrders, loadProductionCatalog } from '../features/production/services/production-api.service'
import { listPurchases, loadPurchaseCatalog } from '../features/purchases/services/purchase-api.service'
import { listExchangeRates } from '../features/settings/services/exchange-rate-api.service'
import { listSuppliers } from '../features/suppliers/services/supplier-api.service'

const cachePrefix = 'europlate.query-cache'
const cacheVersion = 1
const maxCacheAge = 24 * 60 * 60_000
let activeUserId: string | null = null
let stopPersistence: (() => void) | undefined
let persistTimer: number | undefined
let isRefreshingCoreData = false

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Al hidratar datos previos, React Query los muestra de inmediato y los
      // actualiza de forma silenciosa cuando ya no están frescos.
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
})

const storageKey = (userId: string) => `${cachePrefix}.v${cacheVersion}.${userId}`

function saveActiveCache() {
  if (!activeUserId) return
  try {
    const state = dehydrate(queryClient, {
      shouldDehydrateQuery: query => query.state.status === 'success',
    })
    localStorage.setItem(storageKey(activeUserId), JSON.stringify({ savedAt: Date.now(), state }))
  } catch {
    // Un navegador sin espacio o con storage restringido no debe afectar el ERP.
  }
}

function beginPersistence(userId: string) {
  stopPersistence?.()
  activeUserId = userId
  stopPersistence = queryClient.getQueryCache().subscribe(() => {
    window.clearTimeout(persistTimer)
    persistTimer = window.setTimeout(saveActiveCache, 250)
  })
}

/** Restaura datos del último uso del mismo usuario antes de renderizar módulos. */
export function restoreQueryCache(userId: string) {
  if (activeUserId === userId) return
  stopPersistence?.()
  activeUserId = null
  queryClient.clear()

  try {
    const cached = JSON.parse(localStorage.getItem(storageKey(userId)) ?? 'null') as {
      savedAt?: number
      state?: Parameters<typeof hydrate>[1]
    } | null
    if (cached?.savedAt && Date.now() - cached.savedAt < maxCacheAge && cached.state) hydrate(queryClient, cached.state)
  } catch {
    localStorage.removeItem(storageKey(userId))
  }

  beginPersistence(userId)
}

/** Protege los datos comerciales al cerrar sesión o cambiar de usuario. */
export function clearQueryCache(userId?: string) {
  const scope = userId ?? activeUserId
  if (scope) localStorage.removeItem(storageKey(scope))
  if (!userId || userId === activeUserId) {
    stopPersistence?.()
    stopPersistence = undefined
    activeUserId = null
    window.clearTimeout(persistTimer)
    queryClient.clear()
  }
}

/**
 * Actualiza los módulos principales sin bloquear la navegación. Al terminar,
 * su estado más reciente vuelve a guardarse en la caché persistente.
 */
export function refreshCoreDataInBackground() {
  if (!activeUserId || isRefreshingCoreData) return
  isRefreshingCoreData = true
  const prefetches = [
    () => queryClient.prefetchQuery({ queryKey: ['products', 'catalog'], queryFn: loadCatalog, staleTime: 0 }),
    () => queryClient.prefetchQuery({ queryKey: ['suppliers'], queryFn: listSuppliers, staleTime: 0 }),
    () => queryClient.prefetchQuery({ queryKey: ['customers'], queryFn: listCustomers, staleTime: 0 }),
    () => queryClient.prefetchQuery({ queryKey: ['customs-agents'], queryFn: listCustomsAgents, staleTime: 0 }),
    () => queryClient.prefetchQuery({ queryKey: ['purchases'], queryFn: listPurchases, staleTime: 0 }),
    () => queryClient.prefetchQuery({ queryKey: ['purchases', 'catalog'], queryFn: loadPurchaseCatalog, staleTime: 0 }),
    () => queryClient.prefetchQuery({ queryKey: ['imports'], queryFn: listImports, staleTime: 0 }),
    () => queryClient.prefetchQuery({ queryKey: ['imports', 'catalog'], queryFn: loadImportCatalog, staleTime: 0 }),
    () => queryClient.prefetchQuery({ queryKey: ['production'], queryFn: listProductionOrders, staleTime: 0 }),
    () => queryClient.prefetchQuery({ queryKey: ['production', 'catalog'], queryFn: loadProductionCatalog, staleTime: 0 }),
    () => queryClient.prefetchQuery({ queryKey: ['inventory', 'stock'], queryFn: listStock, staleTime: 0 }),
    () => queryClient.prefetchQuery({ queryKey: ['inventory', 'catalog'], queryFn: loadInventoryCatalog, staleTime: 0 }),
    () => queryClient.prefetchQuery({ queryKey: ['inventory', 'warehouses'], queryFn: listWarehouses, staleTime: 0 }),
    () => queryClient.prefetchQuery({ queryKey: ['inventory', 'movements'], queryFn: listMovements, staleTime: 0 }),
    () => queryClient.prefetchQuery({ queryKey: ['inventory', 'transfers'], queryFn: listTransfers, staleTime: 0 }),
    () => queryClient.prefetchQuery({ queryKey: ['inventory', 'adjustments'], queryFn: listAdjustments, staleTime: 0 }),
    () => queryClient.prefetchQuery({ queryKey: ['exchange-rates'], queryFn: listExchangeRates, staleTime: 0 }),
  ]
  void Promise.allSettled(prefetches.map(prefetch => prefetch()))
    .finally(() => { isRefreshingCoreData = false })
}
