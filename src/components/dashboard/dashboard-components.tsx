import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type Tone = 'emerald' | 'blue' | 'red' | 'amber'
const toneClasses: Record<Tone, string> = { emerald: 'text-emerald-600', blue: 'text-brand', red: 'text-red-600', amber: 'text-amber-600' }

export function DashboardMetric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: Tone }) {
  return <article className="min-h-[118px] rounded-[10px] border border-border bg-white p-3.5 shadow-card sm:min-h-[145px] sm:p-6"><p className="text-[9px] font-semibold uppercase tracking-[.45px] text-muted sm:text-[11px] sm:tracking-[.6px]">{label}</p><strong className={`mt-3 block font-mono text-[21px] font-bold leading-none sm:mt-4 sm:text-[30px] ${toneClasses[tone]}`}>{value}</strong><p className="mt-2 text-[10px] text-muted sm:text-xs">{detail}</p></article>
}

export function DashboardPanel({ title, action, icon: Icon, titleClassName = '', children }: { title: string; action?: string; icon?: LucideIcon; titleClassName?: string; children: ReactNode }) {
  return <article className="min-h-0 rounded-[10px] border border-border bg-white p-3.5 shadow-card sm:min-h-[246px] sm:p-6"><header className="mb-3 flex items-center justify-between gap-3 sm:mb-4"><h3 className={`flex items-center gap-1 text-[15px] font-semibold sm:text-base ${titleClassName}`}>{Icon && <Icon className="h-4 w-4" />}{title}</h3>{action && <span className="text-xs text-muted sm:text-sm">{action}</span>}</header>{children}</article>
}
