import { type ImportRecord } from '../services/import-api.service';

export function StatusBadge({ status }: { status: ImportRecord['status'] }) { return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${status === 'Recibido' ? 'bg-emerald-100 text-emerald-700' : status === 'En tránsito' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{status}</span> }

export function IconButton({ children, danger, onClick }: { children: React.ReactNode; danger?: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} className={`ml-1 inline-flex h-9 w-10 items-center justify-center rounded-md border ${danger ? 'border-red-300 bg-red-50 text-red-500' : 'border-border bg-white text-slate-700'}`}>{children}</button> }
