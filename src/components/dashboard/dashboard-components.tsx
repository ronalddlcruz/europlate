import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type Tone = 'emerald' | 'blue' | 'red' | 'amber'
const toneClasses: Record<Tone, string> = { emerald: 'text-emerald-600', blue: 'text-brand', red: 'text-red-600', amber: 'text-amber-600' }

export function DashboardMetric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: Tone }) {
  return <article className="min-h-[110px] rounded-[10px] border border-border bg-white p-4 shadow-card sm:min-h-[128px] sm:p-5"><p className="text-[9px] font-semibold uppercase tracking-[.45px] text-muted sm:text-[10px] sm:tracking-[.6px]">{label}</p><strong className={`mt-2.5 block font-mono text-[24px] font-bold leading-none sm:mt-3 sm:text-[28px] ${toneClasses[tone]}`}>{value}</strong><p className="mt-2 text-[10px] text-muted sm:text-xs">{detail}</p></article>
}

export function DashboardPanel({ title, action, icon: Icon, titleClassName = '', children }: { title: string; action?: string; icon?: LucideIcon; titleClassName?: string; children: ReactNode }) {
  return <article className="min-h-0 rounded-[10px] border border-border bg-white p-4 shadow-card sm:min-h-[220px] sm:p-5"><header className="mb-3 flex items-center justify-between gap-3 sm:mb-4"><h3 className={`flex items-center gap-1 text-[14px] font-semibold sm:text-[15px] ${titleClassName}`}>{Icon && <Icon className="h-4 w-4" />}{title}</h3>{action && <span className="text-xs text-muted sm:text-sm">{action}</span>}</header>{children}</article>
}
