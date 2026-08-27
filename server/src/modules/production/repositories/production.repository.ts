import { prisma } from '../../../infrastructure/database/prisma.client.js'
export const productionRepository = { findMany: () => prisma.productionOrder.findMany({ include: { product: true, materials: true } }) }
