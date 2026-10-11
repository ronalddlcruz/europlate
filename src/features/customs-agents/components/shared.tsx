import { type AgentStatus,type CustomsAgent } from '@/features/customs-agents/services/customs-agent-api.service';

export const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="block"><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.4px] text-slate-600">{label}</span>{children}</label>

export const sortAgents = (items: CustomsAgent[]) => [...items].sort((a, b) => a.name.localeCompare(b.name, 'es'))

export function StatusBadge({ status }: { status: AgentStatus }) { return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${status === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{status}</span> }

export function IconButton({ children, label, danger, onClick }: { children: React.ReactNode; label: string; danger?: boolean; onClick: () => void }) { return <button title={label} aria-label={label} onClick={onClick} className={`ml-1 inline-flex h-9 w-10 items-center justify-center rounded-md border ${danger ? 'border-red-300 bg-red-50 text-red-500' : 'border-border bg-white text-slate-700'}`}>{children}</button> }

export function Toast({ children }: { children: React.ReactNode }) { return <div className="fixed bottom-6 right-6 z-[60] rounded-md border border-border border-l-4 border-l-emerald-600 bg-white px-4 py-3 text-sm shadow-panel">{children}</div> }
