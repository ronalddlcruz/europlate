import { prisma } from '../../../infrastructure/database/prisma.client.js'
export const inventoryRepository = { getStock: () => prisma.stock.findMany({ include: { product: true, warehouse: true } }) }
