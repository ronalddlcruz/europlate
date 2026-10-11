export type ImportCalculationType = 'STANDARD' | 'WEIGHT_BASED'

export type ImportLineCalculationInput = {
  calculationType: ImportCalculationType
  quantity: number
  unitCostUsd: number
  weight?: number | null
}

const valid = (value: number) => Number.isFinite(value) && value >= 0

/** Vista previa del mismo cálculo que el backend valida al registrar. */
export function calculateImportLineSubtotal({ calculationType, quantity, unitCostUsd, weight }: ImportLineCalculationInput) {
  if (!valid(quantity) || !valid(unitCostUsd)) return 0
  if (calculationType === 'WEIGHT_BASED') {
    if (!Number.isFinite(weight) || !weight || weight <= 0) return 0
    return Math.round((weight * quantity * unitCostUsd + Number.EPSILON) * 100) / 100
  }
  return Math.round((quantity * unitCostUsd + Number.EPSILON) * 100) / 100
}
