import { ImportStatus, ProductStatus, PurchaseStatus, type Prisma, type PrismaClient } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma.client.js'
type Database = PrismaClient | Prisma.TransactionClient
export const inventoryRepository = {
  stock: (companyId: string) => prisma.stock.findMany({ where: { warehouse: { companyId } }, include: { product: { include: { presentations: { where: { status: 'ACTIVE' }, include: { unit: true }, orderBy: { name: 'asc' } } } }, warehouse: true } }),
  // Activos es la vista inicial; el filtro permite consultar historial sin
  // combinarlo con la operación diaria.
  // Productos, stock y kardex comparten el mismo orden por código del catálogo.
  stockProducts: (status?: ProductStatus) => prisma.product.findMany({ where: { ...(status && { status }), presentations: { some: {} } }, orderBy: [{ code: 'asc' }, { id: 'asc' }], include: { category: { select: { name: true } }, subcategory: { select: { name: true } }, presentations: { include: { unit: true }, orderBy: { name: 'asc' } } } }),
  costSources: (companyId: string) => Promise.all([
    prisma.purchaseItem.findMany({
      where: { purchase: { companyId, status: PurchaseStatus.RECEIVED } },
      select: { productId: true, quantity: true, unitPrice: true, presentation: { select: { factor: true } }, purchase: { select: { currency: true } } },
    }),
    prisma.importItem.findMany({
      where: { import: { companyId, status: ImportStatus.RECEIVED } },
      select: { importId: true, productId: true, quantity: true, unitCostUsd: true, presentation: { select: { factor: true } }, import: { select: { currency: true, customsCostUsd: true, customsCostPen: true } } },
    }),
    prisma.inventoryMovement.findMany({
      where: { type: 'INITIAL_STOCK', warehouse: { companyId } },
      select: { productId: true, quantity: true, presentation: { select: { factor: true, openingUnitCostPen: true, openingUnitCostUsd: true, openingUnitCostCurrency: true } } },
    }),
  ]),
  currentExchangeRate: (companyId: string) => prisma.exchangeRate.findFirst({ where: { companyId }, select: { value: true }, orderBy: [{ effectiveDate: 'desc' }, { createdAt: 'desc' }] }),
  reserved: (companyId: string) => prisma.productionMaterial.findMany({ where: { status: 'RESERVED', shareReservation: false, warehouse: { companyId } }, include: { product: { include: { presentations: { where: { status: 'ACTIVE' }, select: { factor: true }, orderBy: { name: 'asc' }, take: 1 } } } } }),
  movements: (companyId: string, scope?: { userId: string; warehouseIds: string[] }) => prisma.inventoryMovement.findMany({ where: { warehouse: { companyId }, ...(scope && { warehouseId: { in: scope.warehouseIds }, createdByUserId: scope.userId }) }, include: { product: { include: { presentations: { where: { status: 'ACTIVE' }, include: { unit: true }, take: 1 } } }, warehouse: true, presentation: { include: { unit: true } }, createdBy: true }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] }),
  transfers: (companyId: string, scope?: { userId: string; warehouseIds: string[] }) => prisma.stockTransfer.findMany({ where: { companyId, ...(scope && { createdByUserId: scope.userId, fromWarehouseId: { in: scope.warehouseIds }, toWarehouseId: { in: scope.warehouseIds } }) }, include: { product: true, presentation: { include: { unit: true } }, fromWarehouse: true, toWarehouse: true, createdBy: true }, orderBy: { createdAt: 'desc' } }),
  adjustments: (companyId: string, scope?: { userId: string; warehouseIds: string[] }) => prisma.inventoryAdjustment.findMany({ where: { companyId, ...(scope && { createdByUserId: scope.userId, warehouseId: { in: scope.warehouseIds } }) }, include: { product: true, presentation: { include: { unit: true } }, warehouse: true, customer: true, createdBy: true }, orderBy: { createdAt: 'desc' } }),
  warehouses: (companyId: string) => prisma.warehouse.findMany({ where: { companyId }, include: { responsible: { select: { id: true, name: true, email: true } } }, orderBy: { name: 'asc' } }),
  warehouseResponsibles: (companyId: string) => prisma.user.findMany({ where: { companyId, status: 'ACTIVE' }, select: { id: true, name: true, email: true, roles: { select: { role: { select: { key: true, name: true } } } } }, orderBy: { name: 'asc' } }),
  catalog: (companyId: string, warehouseIds?: string[]) => Promise.all([
    prisma.product.findMany({ where: { status: 'ACTIVE', presentations: { some: { status: 'ACTIVE' } } }, orderBy: { code: 'asc' }, include: { presentations: { where: { status: 'ACTIVE' }, include: { unit: true }, orderBy: { name: 'asc' } } } }),
    prisma.warehouse.findMany({ where: { companyId, status: 'ACTIVE', ...(warehouseIds && { id: { in: warehouseIds } }) }, orderBy: { name: 'asc' } }),
    prisma.customer.findMany({ where: { companyId, status: 'ACTIVE' }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]),
  createTransfer: (db: Database, data: Prisma.StockTransferCreateInput) => db.stockTransfer.create({ data, select: { id: true, createdAt: true, quantity: true, note: true, product: { select: { id: true, name: true } }, presentation: { select: { name: true, factor: true, unit: { select: { code: true, description: true } } } }, fromWarehouse: { select: { id: true, name: true } }, toWarehouse: { select: { id: true, name: true } }, createdBy: { select: { name: true, email: true } } } }),
  createAdjustment: (db: Database, data: Prisma.InventoryAdjustmentCreateInput) => db.inventoryAdjustment.create({ data, include: { product: true, presentation: { include: { unit: true } }, warehouse: true, customer: true, createdBy: true } }),
  createWarehouse: (data: Prisma.WarehouseCreateInput) => prisma.warehouse.create({ data, include: { responsible: { select: { id: true, name: true, email: true } } } }),
  updateWarehouse: (id: string, data: Prisma.WarehouseUpdateInput) => prisma.warehouse.update({ where: { id }, data, include: { responsible: { select: { id: true, name: true, email: true } } } }),
  findWarehouse: (id: string, companyId: string) => prisma.warehouse.findFirst({ where: { id, companyId } }),
  removeWarehouse: (id: string) => prisma.warehouse.delete({ where: { id } }),
}
