import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DetailDialog } from '@/features/purchases/components/dialogs/DetailDialog'
import { PurchaseDialog } from '@/features/purchases/components/dialogs/PurchaseDialog'
import { PurchasesTable } from '@/features/purchases/components/tables/PurchasesTable'
import { usePurchasesController } from '@/features/purchases/hooks/usePurchasesController'

export function PurchasesPage() {
  const model = usePurchasesController()
  const { catalogQuery, productsCatalogQuery, modal, setModal, selected, detailQuery, notice, createMutation } = model
  return <div className="mx-auto max-w-7xl">
<section className="card">
<header className="flex flex-wrap items-center justify-between gap-3">
<div>
<h1 className="text-sm font-semibold">Compras Nacionales</h1>
<p className="mt-1 text-xs text-muted">Órdenes de compra y recepción de productos.</p>
</div>
<Button size="sm" onClick={() => setModal('new')} disabled={catalogQuery.isLoading || catalogQuery.isError}>
<Plus className="h-4 w-4" />Nueva compra</Button>
</header>
<div className="mt-4 overflow-x-auto">
<PurchasesTable model={model} />
</div>
</section>{modal === 'new' && catalogQuery.data && productsCatalogQuery.data && <PurchaseDialog catalog={catalogQuery.data} productsCatalog={productsCatalogQuery.data} saving={createMutation.isPending} onClose={() => setModal(null)} onSave={async payload => { try { await createMutation.mutateAsync(payload); setModal(null) } catch { /* El error ya se muestra en la notificación y en el formulario. */ } }} />}{modal === 'detail' && selected && <DetailDialog purchase={detailQuery.data ?? selected} onClose={() => setModal(null)} />}{notice && <div className="fixed bottom-6 right-6 z-[60] rounded-md border border-border border-l-4 border-l-emerald-600 bg-white px-4 py-3 text-sm shadow-panel">{notice}</div>}</div>
}
