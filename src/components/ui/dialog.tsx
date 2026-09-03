import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface DialogProps { open: boolean; title: string; children: ReactNode; onClose: () => void; footer?: ReactNode; wide?: boolean; extraWide?: boolean; a4?: boolean }
export function Dialog({ open, title, children, onClose, footer, wide, extraWide, a4 }: DialogProps) {
  if (!open) return null
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
    <section className={`max-h-[94dvh] w-full overflow-auto rounded-t-[14px] border border-border bg-white shadow-panel sm:max-h-[92vh] sm:rounded-[10px] ${extraWide ? 'max-w-[1280px]' : wide ? 'max-w-[1080px]' : a4 ? 'max-w-[860px]' : 'max-w-[680px]'}`}>
      <header className="flex items-center justify-between border-b border-border bg-[#f7f9fc] px-4 py-3 sm:px-6 sm:py-4"><h2 className="pr-4 text-[15px] font-semibold">{title}</h2><button onClick={onClose} className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600" aria-label="Cerrar"><X className="h-5 w-5" /></button></header>
      <div className="p-4 sm:p-6">{children}</div>
      {footer && <footer className="flex flex-col-reverse gap-2 border-t border-border bg-[#f7f9fc] px-4 py-3 sm:flex-row sm:justify-end sm:px-6 sm:py-3.5">{footer}</footer>}
    </section>
  </div>
}
