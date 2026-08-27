import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type Tone = 'emerald' | 'blue' | 'red' | 'amber'
const toneClasses: Record<Tone, string> = { emerald: 'text-emerald-600', blue: 'text-brand', red: 'text-red-600', amber: 'text-amber-600' }

export function DashboardMetric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: Tone }) {
  return <article className="min-h-[145px] rounded-[10px] border border-border bg-white p-6 shadow-card"><p className="text-[11px] font-semibold uppercase tracking-[.6px] text-muted">{label}</p><strong className={`mt-4 block font-mono text-[30px] font-bold ${toneClasses[tone]}`}>{value}</strong><p className="mt-2 text-xs text-muted">{detail}</p></article>
}

export function DashboardPanel({ title, action, icon: Icon, titleClassName = '', children }: { title: string; action?: string; icon?: LucideIcon; titleClassName?: string; children: ReactNode }) {
  return <article className="min-h-[246px] rounded-[10px] border border-border bg-white p-6 shadow-card"><header className="mb-4 flex items-center justify-between gap-3"><h3 className={`flex items-center gap-1 text-base font-semibold ${titleClassName}`}>{Icon && <Icon className="h-4 w-4" />}{title}</h3>{action && <span className="text-sm text-muted">{action}</span>}</header>{children}</article>
}
