import type { Prisma } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma.client.js'
import { AppError } from '../../../shared/errors/app-error.js'
import { customerRepository } from '../repositories/customer.repository.js'
import type { CreateCustomerInput, UpdateCustomerInput } from '../schemas/customer.schema.js'

export const customerService = {
  list(companyId: string, filters: { search?: string; status?: 'ACTIVE' | 'INACTIVE' }) {
    const where: Prisma.CustomerWhereInput = { companyId, ...(filters.status && { status: filters.status }), ...(filters.search && { OR: [{ name: { contains: filters.search, mode: 'insensitive' } }, { phone: { contains: filters.search, mode: 'insensitive' } }, { email: { contains: filters.search, mode: 'insensitive' } }] }) }
    return customerRepository.findMany(where)
  },
  async getById(companyId: string, id: string) {
    const customer = await customerRepository.findById(id, companyId)
    if (!customer) throw new AppError('CUSTOMER_NOT_FOUND', 'Cliente no encontrado.', 404)
    return customer
  },
  create(companyId: string, input: CreateCustomerInput) { return customerRepository.create(prisma, { ...input, company: { connect: { id: companyId } } }) },
  async update(companyId: string, id: string, input: UpdateCustomerInput) { await this.getById(companyId, id); return customerRepository.update(prisma, id, input) },
  async remove(companyId: string, id: string) { await this.getById(companyId, id); await customerRepository.remove(prisma, id) },
}
