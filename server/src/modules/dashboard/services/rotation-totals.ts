import { monthOfEvent } from './dashboard-period.js'

export type RotationMovement = {
  type: string
  productId: string
  code: string
  product: string
  quantity: number
  createdAt: Date | string
}

export type RotatingProduct = {
  productId: string
  code: string
  name: string
  units: number
  outboundUnits: number
  consumedUnits: number
  movements: number
}

/** Rotación = salida real a terceros o consumo en producción; nunca ingresos ni traslados internos. */
export function topRotatingProducts(movements: RotationMovement[], period: string, limit = 5): RotatingProduct[] {
  const byProduct = new Map<string, RotatingProduct>()
  for (const movement of movements) {
    if (movement.type !== 'ADJUSTMENT_OUT' && movement.type !== 'PRODUCTION_CONSUMPTION') continue
    if (movement.quantity >= 0 || monthOfEvent(movement.createdAt) !== period) continue
    const units = Math.abs(movement.quantity)
    const product = byProduct.get(movement.productId) ?? {
      productId: movement.productId, code: movement.code, name: movement.product,
      units: 0, outboundUnits: 0, consumedUnits: 0, movements: 0,
    }
    product.units += units
    product.movements++
    if (movement.type === 'ADJUSTMENT_OUT') product.outboundUnits += units
    else product.consumedUnits += units
    byProduct.set(movement.productId, product)
  }
  return [...byProduct.values()].sort((a, b) => b.units - a.units || a.code.localeCompare(b.code)).slice(0, limit)
}
