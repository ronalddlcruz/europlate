import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { type Report } from '../components/shared'
import { loadMovementsReport,loadProductionReport,loadPurchasesReport,loadStockReport } from '../services/report-api.service'

export function useReportsController() {
  const [report, setReport] = useState<Report>('stock')
  // Cada sección carga únicamente sus propios datos; Compras ya no espera
  // la valorización del inventario ni el historial de movimientos.
  const stock = useQuery({ queryKey: ['reports', 'stock'], queryFn: ({ signal }) => loadStockReport(signal), enabled: report === 'stock', staleTime: 30_000 })
  const movements = useQuery({ queryKey: ['reports', 'movements'], queryFn: ({ signal }) => loadMovementsReport(signal), enabled: report === 'movements', staleTime: 30_000 })
  const purchases = useQuery({ queryKey: ['reports', 'purchases'], queryFn: ({ signal }) => loadPurchasesReport(signal), enabled: report === 'purchases', staleTime: 30_000 })
  const production = useQuery({ queryKey: ['reports', 'production'], queryFn: ({ signal }) => loadProductionReport(signal), enabled: report === 'production', staleTime: 30_000 })
  const activeQuery = report === 'stock' ? stock : report === 'movements' ? movements : report === 'purchases' ? purchases : production

  return { report, setReport, stock, movements, purchases, production, activeQuery }
}
