import type { ReactNode } from 'react'

type PageFrameProps = {
  children: ReactNode
  fullWidth?: boolean
}

/** Marco común: evita que cada módulo calcule su propio ancho y centrado. */
export function PageFrame({ children, fullWidth = false }: PageFrameProps) {
  return <div className={fullWidth ? 'page-frame page-frame--wide' : 'page-frame'}>{children}</div>
}
