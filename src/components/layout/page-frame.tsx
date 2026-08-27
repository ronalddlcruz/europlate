import type { ReactNode } from 'react'

type PageFrameProps = {
  children: ReactNode
}

/** Marco común: evita que cada módulo calcule su propio ancho y centrado. */
export function PageFrame({ children }: PageFrameProps) {
  return <div className="page-frame">{children}</div>
}
