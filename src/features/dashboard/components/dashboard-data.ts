export type DashboardMonth = { value: string; label: string }
export type RotationProduct = { name: string; code: string; unit: string; units: number; sales: string }
export type MonthlyPurchase = { label: string; value: number }

export const months: DashboardMonth[] = [{ value: '2026-08', label: 'Agosto 2026' }, { value: '2026-07', label: 'Julio 2026' }]
export const purchasesByMonth: MonthlyPurchase[] = [{ label: 'Ene', value: 4 }, { label: 'Feb', value: 4 }, { label: 'Mar', value: 78 }, { label: 'Abr', value: 4 }, { label: 'May', value: 4 }, { label: 'Jun', value: 4 }, { label: 'Jul', value: 4 }, { label: 'Ago', value: 4 }]
export const rotationByPeriod: Record<string, RotationProduct[]> = {
  '2026-08': [{ name: 'Papel couché 150 cm 90 g', code: 'PROD-014', unit: 'RESMA', units: 320, sales: 'S/ 18,240.00' }, { name: 'Cinta de embalaje', code: 'PROD-022', unit: 'ROLLO', units: 248, sales: 'S/ 2,480.00' }, { name: 'Placa offset', code: 'PROD-011', unit: 'UND', units: 186, sales: 'S/ 13,020.00' }, { name: 'Tinta offset negro 1 kg', code: 'PROD-006', unit: 'KG', units: 96, sales: 'S/ 5,760.00' }, { name: 'Cartón corrugado microcanal', code: 'PROD-019', unit: 'PLIEGO', units: 75, sales: 'S/ 6,375.00' }],
  '2026-07': [{ name: 'Placa offset', code: 'PROD-011', unit: 'UND', units: 224, sales: 'S/ 15,680.00' }, { name: 'Papel couché 150 cm 90 g', code: 'PROD-014', unit: 'RESMA', units: 198, sales: 'S/ 11,286.00' }, { name: 'Cartón corrugado microcanal', code: 'PROD-019', unit: 'PLIEGO', units: 142, sales: 'S/ 12,070.00' }, { name: 'Cinta de embalaje', code: 'PROD-022', unit: 'ROLLO', units: 88, sales: 'S/ 880.00' }],
}
