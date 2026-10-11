import { Eye,Trash2 } from 'lucide-react'
import { usePurchasesController } from '@/features/purchases/hooks/usePurchasesController'
import { money,Status } from '@/features/purchases/components/shared'

export function PurchasesTable({ model }: { model: ReturnType<typeof usePurchasesController> }) {
  const { queryClient, purchasesQuery, catalogQuery, productsCatalogQuery, modal, setModal, selected, setSelected, detailQuery, notice, setNotice, notify, refreshPurchaseConsumers, createMutation, deleteMutation, purchases } = model
  return (<table className="w-full min-w-[750px] text-left">
<thead>
<tr className="bg-[#f7f9fc] text-[11px] uppercase tracking-[.5px] text-muted">{['N° OC', 'Proveedor', 'Fecha', 'Moneda', 'Total', 'Estado', ''].map(value => <th className="border-y border-border px-4 py-2.5" key={value}>{value}</th>)}</tr>
</thead>
<tbody>{purchasesQuery.isLoading ? <tr>
<td colSpan={7} className="p-10 text-center text-sm text-muted">Cargando compras desde la base de datos…</td>
</tr> : purchasesQuery.isError ? <tr>
<td colSpan={7} className="p-10 text-center text-sm text-red-600">No se pudieron cargar las compras.</td>
</tr> : purchases.length ? purchases.map(purchase => <tr key={purchase.id} className="border-b border-border text-[13px]">
<td className="px-4 py-3 font-mono font-bold text-brand">{purchase.number}</td>
<td className="px-4 py-3 font-medium">{purchase.supplier}</td>
<td className="px-4 py-3 text-slate-600">{purchase.date}</td>
<td className="px-4 py-3">{purchase.currency}</td>
<td className="px-4 py-3 font-mono">{purchase.currency === 'PEN' ? 'S/ ' : 'USD '}{money(purchase.total)}</td>
<td className="px-4 py-3">
<Status status={purchase.status} />
</td>
<td className="px-4 py-3 text-right">
<button aria-label="Ver compra" onClick={() => { setSelected(purchase); setModal('detail') }} className="inline-flex h-7 w-7 items-center justify-center rounded border border-border">
<Eye className="h-3.5 w-3.5" />
</button>
<button aria-label="Eliminar compra" onClick={() => deleteMutation.mutate(purchase.id)} className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded border border-red-200 bg-red-50 text-red-600">
<Trash2 className="h-3.5 w-3.5" />
</button>
</td>
</tr>) : <tr>
<td colSpan={7} className="p-10 text-center text-sm text-muted">Aún no hay compras registradas.</td>
</tr>}</tbody>
</table>)
}
