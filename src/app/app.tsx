import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../layouts/app/app-layout'
import { LoginPage } from '../features/auth/pages/login-page'
import { DashboardPage } from '../features/dashboard/pages/dashboard-page'
import { ProductsPage } from '../features/products/pages/products-page'
import { InventoryPage } from '../features/inventory/pages/inventory-page'
import { PurchasesPage } from '../features/purchases/pages/purchases-page'
import { ProductionPage } from '../features/production/pages/production-page'
import { UsersPage } from '../features/users/pages/users-page'
import { ReportsPage } from '../features/reports/pages/reports-page'
import { SettingsPage } from '../features/settings/pages/settings-page'
import { SuppliersPage } from '../features/suppliers/pages/suppliers-page'
import { CustomsAgentsPage } from '../features/customs-agents/pages/customs-agents-page'
import { ImportsPage } from '../features/imports/pages/imports-page'

export function App() {
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<AppLayout />}><Route path="/dashboard" element={<DashboardPage />} /><Route path="/productos" element={<ProductsPage />} /><Route path="/proveedores" element={<SuppliersPage />} /><Route path="/agentes-aduana" element={<CustomsAgentsPage />} /><Route path="/inventario" element={<InventoryPage />} /><Route path="/compras" element={<PurchasesPage />} /><Route path="/importaciones" element={<ImportsPage />} /><Route path="/produccion" element={<ProductionPage />} /><Route path="/usuarios" element={<UsersPage />} /><Route path="/reportes" element={<ReportsPage />} /><Route path="/configuracion" element={<SettingsPage />} /></Route>
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
}
