import { dehydrate, hydrate, QueryClient } from '@tanstack/react-query'

const cachePrefix = 'europlate.query-cache'
const cacheVersion = 1
const maxCacheAge = 24 * 60 * 60_000
let activeUserId: string | null = null
let stopPersistence: (() => void) | undefined
let persistTimer: number | undefined

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
