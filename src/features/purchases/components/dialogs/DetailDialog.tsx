import { ExternalLink,FileText,Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { type Purchase } from '@/features/purchases/services/purchase-api.service'
import { money,Status } from '@/features/purchases/components/shared'

export function DetailDialog({ purchase, onClose }: { purchase: Purchase; onClose: () => void }) {
  const currency = purchase.currency === 'PEN' ? 'S/ ' : 'USD '
  const formatDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
  return <Dialog open title={`Detalle de compra · ${purchase.number}`} onClose={onClose} a4 footer={<Button onClick={onClose}>Cerrar detalle</Button>}>
    <div className="space-y-4">
      <section className="grid gap-px overflow-hidden rounded-lg border border-blue-200 bg-blue-100 sm:grid-cols-[1.35fr_1fr_1fr]">
        <div className="bg-white px-4 py-3">
<p className="text-[10px] font-semibold uppercase tracking-[.6px] text-muted">Total registrado</p>
<p className="mt-0.5 font-mono text-xl font-bold text-emerald-600">{currency}{money(purchase.total)}</p>
<p className="mt-0.5 text-xs text-muted">{purchase.lines.length} línea(s) de producto</p>
</div>
        <div className="bg-white px-4 py-3">
<p className="text-[10px] font-semibold uppercase tracking-[.6px] text-muted">Estado de recepción</p>
<div className="mt-1.5">
<Status status={purchase.status} />
</div>
<p className="mt-1.5 text-xs text-muted">Ingreso: {formatDate(purchase.receiptDate)}</p>
</div>
        <div className="bg-white px-4 py-3">
<p className="text-[10px] font-semibold uppercase tracking-[.6px] text-muted">Comprobante</p>
<p className="mt-1 text-sm font-semibold text-ink">{purchase.invoice}</p>
<p className="mt-0.5 text-xs text-muted">Compra: {formatDate(purchase.date)}</p>
</div>
      </section>

      <section className="rounded-lg border border-border bg-slate-50/60 p-4">
<div className="mb-3 flex items-center gap-2">
<span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100 text-brand">
<Package className="h-4 w-4" />
</span>
<h3 className="text-sm font-semibold">Información de la compra</h3>
</div>
<div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
<div>
<p className="text-[10px] font-semibold uppercase tracking-[.5px] text-muted">Proveedor</p>
<p className="mt-1 font-medium text-ink">{purchase.supplier}</p>
</div>
<div>
<p className="text-[10px] font-semibold uppercase tracking-[.5px] text-muted">N° orden</p>
<p className="mt-1 font-mono font-medium text-ink">{purchase.number}</p>
</div>
<div>
<p className="text-[10px] font-semibold uppercase tracking-[.5px] text-muted">Fecha de compra</p>
<p className="mt-1 font-medium text-ink">{formatDate(purchase.date)}</p>
</div>
<div>
<p className="text-[10px] font-semibold uppercase tracking-[.5px] text-muted">Moneda</p>
<p className="mt-1 font-medium text-ink">{purchase.currency}</p>
</div>
</div>
</section>

      <section>
<div className="mb-3 flex items-center justify-between">
<div>
<h3 className="text-sm font-semibold">Productos recibidos</h3>
<p className="mt-0.5 text-xs text-muted">Detalle de cantidades, almacén y valorización.</p>
</div>
<span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{purchase.lines.length} producto(s)</span>
</div>
<div className="overflow-x-auto rounded-lg border border-border">
<table className="w-full min-w-[760px] text-left text-sm">
<thead className="bg-[#f7f9fc] text-[10px] uppercase tracking-[.5px] text-muted">
<tr>
<th className="px-4 py-3">Producto</th>
<th className="px-4 py-3">Presentación</th>
<th className="px-4 py-3">Almacén</th>
<th className="px-4 py-3 text-center">UM</th>
<th className="px-4 py-3 text-right">Cant.</th>
<th className="px-4 py-3 text-right">P. unit.</th>
<th className="px-4 py-3 text-right">Subtotal</th>
</tr>
</thead>
<tbody>{purchase.lines.map(line => <tr key={line.id} className="border-t border-border">
<td className="px-4 py-3 font-medium text-ink">{line.product}</td>
<td className="px-4 py-3 text-slate-600">{line.presentation}</td>
<td className="px-4 py-3 text-slate-600">{line.warehouse}</td>
<td className="px-4 py-3 text-center">
<span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{line.unit}</span>
</td>
<td className="px-4 py-3 text-right font-mono">{line.quantity}</td>
<td className="px-4 py-3 text-right font-mono">{currency}{money(line.price)}</td>
<td className="px-4 py-3 text-right font-mono font-semibold text-emerald-700">{currency}{money(line.quantity * line.price)}</td>
</tr>)}</tbody>
<tfoot>
<tr className="border-t border-border bg-slate-50">
<td colSpan={6} className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[.5px] text-muted">Total de compra</td>
<td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">{currency}{money(purchase.total)}</td>
</tr>
</tfoot>
</table>
</div>
</section>

      <section>
<div className="mb-2 flex items-center justify-between">
<div>
<h3 className="text-sm font-semibold">Documentos adjuntos</h3>
<p className="mt-0.5 text-xs text-muted">Comprobantes PDF asociados a esta compra.</p>
</div>
<span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-brand">{purchase.attachments.length} archivo(s)</span>
</div>{purchase.attachments.length ? <div className="grid gap-3">{purchase.attachments.map((document, index) => <article key={`${document.name}-${index}`} className="w-[190px] max-w-full overflow-hidden rounded-lg border border-border bg-white shadow-sm">
<div className="flex aspect-[3/4] items-center justify-center border-b border-border bg-gradient-to-br from-red-50 via-white to-slate-50">{document.link ? <iframe title={`Vista previa de ${document.name}`} src={`${document.link}#toolbar=0&navpanes=0&scrollbar=0`} className="h-full w-full border-0" /> : <FileText className="h-8 w-8 text-red-500" />}</div>
<div className="flex items-center gap-2.5 p-2.5">
<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-red-50 text-red-500">
<FileText className="h-3.5 w-3.5" />
</span>
<span className="min-w-0 flex-1">
<span className="block truncate text-sm font-medium text-ink">{document.name}</span>
<span className="text-xs text-muted">PDF{document.size ? ` · ${Math.max(1, Math.round(document.size / 1024))} KB` : ''}</span>
</span>{document.link && <a href={document.link} target="_blank" rel="noreferrer" aria-label={`Abrir ${document.name}`} className="rounded-md p-1.5 text-brand transition hover:bg-blue-50">
<ExternalLink className="h-4 w-4" />
</a>}</div>
</article>)}</div> : <div className="rounded-lg border border-dashed border-border bg-slate-50 px-4 py-5 text-center">
<FileText className="mx-auto h-6 w-6 text-slate-400" />
<p className="mt-2 text-sm font-medium text-slate-600">No hay comprobantes adjuntos</p>
<p className="mt-1 text-xs text-muted">Esta compra se registró sin archivos PDF.</p>
</div>}</section>
    </div>
  </Dialog>
}
