import { Pencil,Trash2 } from 'lucide-react'
import { useSettingsController } from '../../hooks/useSettingsController'
import { amount,date,Mini } from '../shared'

export function SettingsTable({ model }: { model: ReturnType<typeof useSettingsController> }) {
  const { client, modal, setModal, editing, setEditing, notice, setNotice, query, rates, current, invalidate, say, save, automatic, remove } = model
  return (<table className="w-full min-w-[680px] text-left"><thead><tr className="bg-[#f7f9fc] text-[11px] uppercase tracking-[.5px] text-muted">{['Fecha', 'Valor', 'Usuario', 'Origen / observación', ''].map(value => <th className="border-y border-border px-4 py-2.5" key={value}>{value}</th>)}</tr></thead><tbody>{query.isLoading ? <tr><td colSpan={5} className="p-8 text-center text-sm text-muted">Cargando tipos de cambio…</td></tr> : rates.map(rate => <tr key={rate.id} className="border-b border-border text-[13px]"><td className="px-4 py-3">{date(rate)}</td><td className="px-4 py-3 font-mono font-bold text-brand">S/ {amount(rate).toFixed(4)}</td><td className="px-4 py-3 text-xs text-slate-600">{rate.createdBy?.email ?? 'Sistema'}</td><td className="px-4 py-3 text-slate-600">{rate.source ?? 'Manual'}{rate.note && ` · ${rate.note}`}</td><td className="px-4 py-3 text-right"><Mini onClick={() => { setEditing(rate); setModal(true) }}><Pencil className="h-3.5 w-3.5"/></Mini><Mini danger onClick={() => { if (window.confirm('¿Eliminar este tipo de cambio?')) remove.mutate(rate.id) }}><Trash2 className="h-3.5 w-3.5"/></Mini></td></tr>)}</tbody></table>)
}
