import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('h-10 w-full rounded-md border border-border bg-[#f4f7fb] px-3 text-sm text-ink outline-none placeholder:text-slate-400 focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand', className)} {...props} />
}
