import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type Tone = 'emerald' | 'blue' | 'red' | 'amber'
const toneClasses: Record<Tone, string> = { emerald: 'text-emerald-600', blue: 'text-brand', red: 'text-red-600', amber: 'text-amber-600' }
const chartToneClasses: Record<Tone, string> = { emerald: 'bg-emerald-600', blue: 'bg-brand', red: 'bg-red-600', amber: 'bg-amber-600' }

export function DashboardMetric({ label, value, detail, tone, chart }: { label: string; value: string; detail: string; tone: Tone; chart?: number[] }) {
  return <article className="relative min-h-[116px] overflow-hidden rounded-[10px] border border-border bg-white p-4 shadow-card transition-shadow hover:shadow-panel"><div className="relative z-10"><p className="text-[10px] font-semibold uppercase tracking-[.55px] text-muted">{label}</p><strong className={`mt-2 block font-mono text-[25px] font-bold leading-none ${toneClasses[tone]}`}>{value}</strong><p className="mt-2 text-[11px] text-muted">{detail}</p></div>{chart && <div className="absolute bottom-0 right-3 flex h-10 items-end gap-1 opacity-25">{chart.map((height, index) => <span key={index} className={`w-1.5 rounded-t ${chartToneClasses[tone]}`} style={{ height: `${height}%` }} />)}</div>}</article>
}

export function DashboardPanel({ title, action, icon: Icon, titleClassName = '', children }: { title: string; action?: string; icon?: LucideIcon; titleClassName?: string; children: ReactNode }) {
  return <article className="min-h-0 rounded-[10px] border border-border bg-white p-4 shadow-card sm:p-5"><header className="mb-3 flex items-center justify-between gap-3"><h3 className={`flex items-center gap-1.5 text-[14px] font-semibold sm:text-[15px] ${titleClassName}`}>{Icon && <Icon className="h-4 w-4 text-brand" />}{title}</h3>{action && <span className="text-xs text-muted">{action}</span>}</header>{children}</article>
}
