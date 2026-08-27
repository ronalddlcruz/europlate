import type { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma.client.js'
type Database = PrismaClient | Prisma.TransactionClient
export const inventoryRepository = {
  stock: (companyId: string) => prisma.stock.findMany({ where: { warehouse: { companyId } }, include: { product: { include: { presentations: { where: { status: 'ACTIVE' }, include: { unit: true }, orderBy: { name: 'asc' } } } }, warehouse: true } }),
  reserved: (companyId: string) => prisma.productionMaterial.findMany({ where: { status: 'RESERVED', warehouse: { companyId } }, include: { presentation: true } }),
  movements: (companyId: string) => prisma.inventoryMovement.findMany({ where: { warehouse: { companyId } }, include: { product: { include: { presentations: { where: { status: 'ACTIVE' }, include: { unit: true }, take: 1 } } }, warehouse: true, presentation: { include: { unit: true } }, createdBy: true }, orderBy: { createdAt: 'desc' } }),
  transfers: (companyId: string) => prisma.stockTransfer.findMany({ where: { companyId }, include: { product: true, presentation: { include: { unit: true } }, fromWarehouse: true, toWarehouse: true, createdBy: true }, orderBy: { createdAt: 'desc' } }),
  adjustments: (companyId: string) => prisma.inventoryAdjustment.findMany({ where: { companyId }, include: { product: true, presentation: { include: { unit: true } }, warehouse: true, createdBy: true }, orderBy: { createdAt: 'desc' } }),
  warehouses: (companyId: string) => prisma.warehouse.findMany({ where: { companyId }, orderBy: { name: 'asc' } }),
  catalog: (companyId: string) => Promise.all([prisma.product.findMany({ where: { status: 'ACTIVE', presentations: { some: { status: 'ACTIVE' } } }, orderBy: { name: 'asc' }, include: { presentations: { where: { status: 'ACTIVE' }, include: { unit: true }, orderBy: { name: 'asc' } } } }), prisma.warehouse.findMany({ where: { companyId, status: 'ACTIVE' }, orderBy: { name: 'asc' } })]),
  createTransfer: (db: Database, data: Prisma.StockTransferCreateInput) => db.stockTransfer.create({ data, include: { product: true, presentation: { include: { unit: true } }, fromWarehouse: true, toWarehouse: true, createdBy: true } }),
  createAdjustment: (db: Database, data: Prisma.InventoryAdjustmentCreateInput) => db.inventoryAdjustment.create({ data, include: { product: true, presentation: { include: { unit: true } }, warehouse: true, createdBy: true } }),
  createWarehouse: (data: Prisma.WarehouseCreateInput) => prisma.warehouse.create({ data }),
  updateWarehouse: (id: string, data: Prisma.WarehouseUpdateInput) => prisma.warehouse.update({ where: { id }, data }),
  findWarehouse: (id: string, companyId: string) => prisma.warehouse.findFirst({ where: { id, companyId } }),
  removeWarehouse: (id: string) => prisma.warehouse.delete({ where: { id } }),
}
