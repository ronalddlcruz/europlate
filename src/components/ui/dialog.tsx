import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface DialogProps { open: boolean; title: string; children: ReactNode; onClose: () => void; footer?: ReactNode; wide?: boolean; extraWide?: boolean }
export function Dialog({ open, title, children, onClose, footer, wide, extraWide }: DialogProps) {
  if (!open) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4" role="dialog" aria-modal="true" aria-label={title}>
    <section className={`max-h-[92vh] w-full overflow-auto rounded-[10px] border border-border bg-white shadow-panel ${extraWide ? 'max-w-[1280px]' : wide ? 'max-w-[1080px]' : 'max-w-[680px]'}`}>
      <header className="flex items-center justify-between border-b border-border bg-[#f7f9fc] px-6 py-4"><h2 className="text-[15px] font-semibold">{title}</h2><button onClick={onClose} className="text-slate-400 hover:text-red-600" aria-label="Cerrar"><X className="h-5 w-5" /></button></header>
      <div className="p-5 sm:p-6">{children}</div>
      {footer && <footer className="flex justify-end gap-2 border-t border-border bg-[#f7f9fc] px-6 py-3.5">{footer}</footer>}
    </section>
  </div>
}
