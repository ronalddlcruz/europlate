import { Prisma } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma.client.js'
import { AppError } from '../../../shared/errors/app-error.js'
import {
  assertWarehouseScope,
  resolveOperationScope,
} from '../../../shared/security/operation-scope.js'
import type { OpeningStockInput } from '../schemas/product.schema.js'

type Actor = { companyId: string; userId: string }

export const productOpeningStockService = {
  async list(productId: string, actor: Actor) {
    const scope = await resolveOperationScope(actor.companyId, actor.userId)
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        presentations: { orderBy: { name: 'asc' }, take: 1, select: { factor: true } },
      },
    })
    if (!product) throw new AppError('PRODUCT_NOT_FOUND', 'Producto no encontrado.', 404)
    const stocks = await prisma.stock.findMany({
      where: {
        productId,
        warehouse: { companyId: actor.companyId },
        ...(scope && { warehouseId: { in: scope.warehouseIds } }),
      },
      select: {
        warehouseId: true,
        quantity: true,
        openingUnitCostCurrency: true,
        openingUnitCostPen: true,
        openingUnitCostUsd: true,
      },
    })
    const factor = product.presentations[0]?.factor ?? new Prisma.Decimal(1)
    return stocks.map((stock) => ({
      warehouseId: stock.warehouseId,
      quantity: Number(stock.quantity.div(factor)),
      currency: stock.openingUnitCostCurrency,
      unitCost: Number(
        stock.openingUnitCostCurrency === 'USD'
          ? (stock.openingUnitCostUsd ?? 0)
          : (stock.openingUnitCostPen ?? 0),
      ),
    }))
  },

  async set(productId: string, warehouseId: string, input: OpeningStockInput, actor: Actor) {
    assertWarehouseScope(await resolveOperationScope(actor.companyId, actor.userId), [warehouseId])
    return prisma.$transaction(
      async (db) => {
        // Serializa correcciones simultáneas del mismo saldo, incluidos reintentos.
        await db.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${productId}), hashtext(${warehouseId}))`
        const [product, warehouse] = await Promise.all([
          db.product.findUnique({
            where: { id: productId },
            select: {
              id: true,
              code: true,
              presentations: {
                orderBy: { name: 'asc' },
                take: 1,
                select: { id: true, factor: true },
              },
            },
          }),
          db.warehouse.findFirst({
            where: { id: warehouseId, companyId: actor.companyId, status: 'ACTIVE' },
            select: { id: true },
          }),
        ])
        const presentation = product?.presentations[0]
        if (!product || !presentation || !warehouse)
          throw new AppError(
            'OPENING_STOCK_REFERENCE_INVALID',
            'Producto o almacén no disponible.',
            422,
          )

        const previous = await db.stock.findUnique({
          where: { productId_warehouseId: { productId, warehouseId } },
          select: {
            quantity: true,
            openingUnitCostCurrency: true,
            openingUnitCostPen: true,
            openingUnitCostUsd: true,
          },
        })
        const target = new Prisma.Decimal(input.quantity)
          .mul(presentation.factor)
          .toDecimalPlaces(3)
        const delta = target.minus(previous?.quantity ?? 0)
        const oldCost =
          previous?.openingUnitCostCurrency === 'USD'
            ? previous.openingUnitCostUsd
            : previous?.openingUnitCostPen
        const costChanged =
          previous?.openingUnitCostCurrency !== input.currency ||
          !(oldCost ?? new Prisma.Decimal(0)).equals(input.unitCost)
        if (delta.isZero() && !costChanged) return { warehouseId, ...input }

        // Después de operar el producto, las diferencias deben registrarse como ajustes de inventario.
        const operated = await db.inventoryMovement.findFirst({
          where: { productId, warehouseId, type: { not: 'INITIAL_STOCK' } },
          select: { id: true },
        })
        if (operated)
          throw new AppError(
            'OPENING_STOCK_CLOSED',
            'Este producto ya tiene movimientos en el almacén. Registra un ajuste de inventario.',
            409,
          )

        const cost = new Prisma.Decimal(input.unitCost)
        await db.stock.upsert({
          where: { productId_warehouseId: { productId, warehouseId } },
          create: {
            productId,
            warehouseId,
            quantity: target,
            openingUnitCostCurrency: input.currency,
            openingUnitCostPen: input.currency === 'PEN' ? cost : null,
            openingUnitCostUsd: input.currency === 'USD' ? cost : null,
          },
          update: {
            quantity: target,
            openingUnitCostCurrency: input.currency,
            openingUnitCostPen: input.currency === 'PEN' ? cost : null,
            openingUnitCostUsd: input.currency === 'USD' ? cost : null,
          },
        })
        if (!delta.isZero() || costChanged) {
          await db.inventoryMovement.create({
            data: {
              productId,
              presentationId: presentation.id,
              warehouseId,
              createdByUserId: actor.userId,
              type: 'INITIAL_STOCK',
              quantity: delta,
              reference: `TOMA-${product.code}`,
              note: 'Carga inicial registrada desde la ficha del producto.',
              openingUnitCostCurrency: input.currency,
              openingUnitCostPen: input.currency === 'PEN' ? cost : null,
              openingUnitCostUsd: input.currency === 'USD' ? cost : null,
            },
          })
        }
        const totals = await db.stock.aggregate({
          where: { productId, warehouse: { companyId: actor.companyId } },
          _sum: { quantity: true },
        })
        await db.productPresentation.update({
          where: { id: presentation.id },
          data: {
            currentStock: (totals._sum.quantity ?? new Prisma.Decimal(0)).div(presentation.factor),
          },
        })
        return { warehouseId, ...input }
      },
      { maxWait: 10_000, timeout: 30_000 },
    )
  },
}
