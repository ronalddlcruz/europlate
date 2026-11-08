import { z } from 'zod'

/**
 * Identificadores persistidos por Prisma (CUID) y por cargas históricas
 * (UUID), además de los ID hexadecimales de 32 caracteres usados por sedes
 * históricas. Todos son formatos válidos de claves internas; no se aceptan
 * valores arbitrarios.
 */
export const databaseIdSchema = z.union([
  z.string().cuid(),
  z.string().uuid(),
  z.string().regex(/^[0-9a-f]{32}$/i, 'ID histórico inválido.'),
])
