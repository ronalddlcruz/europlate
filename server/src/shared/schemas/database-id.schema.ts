import { z } from 'zod'

/**
 * Identificadores persistidos por Prisma (CUID) y por cargas históricas
 * (UUID). Ambos son formatos válidos de claves internas, nunca se aceptan
 * valores arbitrarios.
 */
export const databaseIdSchema = z.union([
  z.string().cuid(),
  z.string().uuid(),
])
