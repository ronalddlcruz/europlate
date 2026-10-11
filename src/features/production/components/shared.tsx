import { type ProductionStatus } from '../services/production-api.service';

export type Tab = 'orders' | 'active'

export const statusClass: Record<ProductionStatus, string> = { Planificada: 'bg-amber-100 text-amber-700', 'En producción': 'bg-blue-100 text-blue-700', Completada: 'bg-emerald-100 text-emerald-700', Cancelada: 'bg-red-100 text-red-700' }

export const Status = ({ status }: { status: ProductionStatus }) => <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass[status]}`}>{status}</span>

export function DetailField({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-border bg-white p-3.5"><p className="text-[10px] font-semibold uppercase tracking-[.45px] text-slate-500">{label}</p><p className="mt-1.5 text-sm font-semibold text-ink">{value}</p></div> }
