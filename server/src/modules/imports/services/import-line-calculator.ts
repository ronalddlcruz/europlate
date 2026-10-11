import { Prisma } from '@prisma/client'

export const importCalculationTypes = ['STANDARD', 'WEIGHT_BASED'] as const
export type ImportCalculationType = (typeof importCalculationTypes)[number]

export type ImportLineCalculationInput = {
  calculationType: ImportCalculationType
  quantity: number
  unitCostUsd: number
  weight?: number | null
}

const moneyScale = 2
const decimal = (value: number) => new Prisma.Decimal(value)

const isNonNegativeFinite = (value: number) => Number.isFinite(value) && value >= 0

/**
 * Fuente de verdad del cálculo de una línea de importación.
 * Las validaciones de negocio viven en el servicio; esta función mantiene la
 * operación determinista y preparada para futuras estrategias de cálculo.
 */
export function calculateImportLineSubtotal({ calculationType, quantity, unitCostUsd, weight }: ImportLineCalculationInput) {
  if (!isNonNegativeFinite(quantity) || !isNonNegativeFinite(unitCostUsd)) return decimal(0)
  if (calculationType === 'WEIGHT_BASED') {
    if (!Number.isFinite(weight) || !weight || weight <= 0) return decimal(0)
    return decimal(weight).mul(decimal(quantity)).mul(decimal(unitCostUsd)).toDecimalPlaces(moneyScale, Prisma.Decimal.ROUND_HALF_UP)
  }
  return decimal(quantity).mul(decimal(unitCostUsd)).toDecimalPlaces(moneyScale, Prisma.Decimal.ROUND_HALF_UP)
}
