import { AdjustmentDialog } from '@/features/inventory/components/inventory-dialogs/AdjustmentDialog'
import { TransferDialog } from '@/features/inventory/components/inventory-dialogs/TransferDialog'
import { Header } from '@/features/inventory/components/inventory-shared'
import { AdjustmentTable } from '@/features/inventory/components/tables/AdjustmentTable'
import { MovementTable } from '@/features/inventory/components/tables/MovementTable'
import { SimpleTable } from '@/features/inventory/components/tables/SimpleTable'
import { StockTable } from '@/features/inventory/components/tables/StockTable'
import { useInventoryController } from '@/features/inventory/hooks/useInventoryController'

export function InventoryPage() {
  const { tab, setTab, modal, setModal, stockStatus, setStockStatus, notice, transferDraft, setTransferDraft, stock, catalog, movements, transfers, adjustments, warehouses, transferStock, transfer, adjustment, submitTransfer, submitAdjustment, tabs } = useInventoryController()
  return <div className="inventory-module mx-auto w-full max-w-[1540px]">
    <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-border bg-white px-2">
      {tabs.map(([key, label]) => <button key={key} onClick={() => setTab(key)} className={`whitespace-nowrap border-b-2 px-5 py-3 text-[13px] font-medium ${tab === key ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink'}`}>{label}</button>)}
    </nav>
    {tab === 'stock' && <section className="card"><header className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-sm font-semibold">Stock Actual</h1></header><StockTable records={stock.data ?? []} warehouses={warehouses.data ?? []} loading={stock.isLoading} status={stockStatus} onStatusChange={setStockStatus} /></section>}
    {tab === 'adjustments' && <section className="card"><Header title="Ajustes de Inventario" action="Registrar Ajuste" onAction={() => setModal('adjustment')} /><AdjustmentTable rows={adjustments.data ?? []} loading={adjustments.isLoading} /></section>}
    {tab === 'transfers' && <section className="card">
      <Header title="Transferencia entre Almacenes" action="Nueva Transferencia" actionDisabled={transfer.isPending} onAction={() => { setTransferDraft(null); setModal('transfer') }} />
      <SimpleTable headers={['Fecha', 'Producto', 'Origen', 'Destino', 'Cantidad', 'Usuario']} rows={(transfers.data ?? []).map(row => [row.date, row.product, row.origin, row.destination, `${row.quantity} ${row.unitName}`, row.user])} loading={transfers.isLoading} empty="Sin transferencias registradas." />
    </section>}
    {tab === 'movements' && <MovementTable rows={movements.data ?? []} loading={movements.isLoading} />}
    {modal === 'transfer' && catalog.data && <TransferDialog catalog={catalog.data} stock={transferStock.data ?? []} saving={transfer.isPending} initialValues={transferDraft} onClose={() => setModal(null)} onSave={submitTransfer} />}
    {modal === 'adjustment' && catalog.data && <AdjustmentDialog catalog={catalog.data} stock={stock.data ?? []} saving={adjustment.isPending} onClose={() => setModal(null)} onSave={submitAdjustment} />}
    {notice && <div className="fixed bottom-6 right-6 z-[60] rounded-md border border-border border-l-4 border-l-emerald-600 bg-white px-4 py-3 text-sm shadow-panel">{notice}</div>}
  </div>
}
