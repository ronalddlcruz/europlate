import type { ReactNode, SelectHTMLAttributes } from 'react'
import { Input } from '../../../../components/ui/input'

export function Heading({ n, title, text }: { n: string; title: string; text: string }) {
  return <div className="mb-4 flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{n}</span><div><h3 className="text-base font-semibold">{title}</h3><p className="text-xs text-muted">{text}</p></div></div>
}

export function Label({ children }: { children: ReactNode }) {
  return <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.4px] text-slate-600">{children}</span>
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label><Label>{label}</Label>{children}</label>
}

export function Select({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="h-10 w-full rounded-md border border-border bg-[#f4f7fb] px-3 text-sm" {...props}>{children}</select>
}

export function Numeric({ value, onChange, min = 0 }: { value: number; onChange: (v: number) => void; min?: number }) {
  return <Input type="number" min={min} step="any" value={value} onFocus={e => e.currentTarget.select()} onChange={e => onChange(e.target.value === '' ? min : Number(e.target.value))} />
}

export function Summary({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-[11px] font-semibold uppercase tracking-[.4px] text-muted">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>
}

export function ErrorText({ value }: { value: string }) {
  return <p className="text-xs font-medium text-red-600">{value}</p>
}
