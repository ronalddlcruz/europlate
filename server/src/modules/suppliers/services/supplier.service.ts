import type { Prisma } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma.client.js'
import { AppError } from '../../../shared/errors/app-error.js'
import { supplierRepository } from '../repositories/supplier.repository.js'
import type { CreateSupplierInput, UpdateSupplierInput } from '../schemas/supplier.schema.js'

const duplicateError = () => new AppError('SUPPLIER_TAX_ID_EXISTS', 'Ya existe un proveedor con este RUC / Tax ID.', 409)

export const supplierService = {
  list(companyId: string, filters: { search?: string; status?: 'ACTIVE' | 'INACTIVE'; type?: 'NATIONAL' | 'FOREIGN' }) {
    const where: Prisma.SupplierWhereInput = {
      companyId,
      ...(filters.status && { status: filters.status }),
      ...(filters.type && { type: filters.type }),
      ...(filters.search && { OR: [{ name: { contains: filters.search, mode: 'insensitive' } }, { taxId: { contains: filters.search, mode: 'insensitive' } }] }),
    }
    return supplierRepository.findMany(where)
  },
  async getById(companyId: string, id: string) {
    const supplier = await supplierRepository.findById(id, companyId)
    if (!supplier) throw new AppError('SUPPLIER_NOT_FOUND', 'Proveedor no encontrado.', 404)
    return supplier
  },
  async create(companyId: string, input: CreateSupplierInput) {
    if (await supplierRepository.findByTaxId(companyId, input.taxId)) throw duplicateError()
    return supplierRepository.create(prisma, { ...input, company: { connect: { id: companyId } } })
  },
  async update(companyId: string, id: string, input: UpdateSupplierInput) {
    await this.getById(companyId, id)
    if (input.taxId) {
      const duplicate = await supplierRepository.findByTaxId(companyId, input.taxId)
      if (duplicate && duplicate.id !== id) throw duplicateError()
    }
    return supplierRepository.update(prisma, id, input)
  },
  async remove(companyId: string, id: string) {
    await this.getById(companyId, id)
    await supplierRepository.remove(prisma, id)
  },
}
