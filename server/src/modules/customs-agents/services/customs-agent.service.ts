import type { Prisma } from '@prisma/client'
import { prisma } from '../../../infrastructure/database/prisma.client.js'
import { AppError } from '../../../shared/errors/app-error.js'
import { customsAgentRepository } from '../repositories/customs-agent.repository.js'
import type { CreateCustomsAgentInput, UpdateCustomsAgentInput } from '../schemas/customs-agent.schema.js'

const duplicateRuc = () => new AppError('CUSTOMS_AGENT_RUC_EXISTS', 'Ya existe un agente con este RUC.', 409)
export const customsAgentService = {
  list(companyId: string, filters: { search?: string; status?: 'ACTIVE' | 'INACTIVE' }) {
    const where: Prisma.CustomsAgentWhereInput = { companyId, ...(filters.status && { status: filters.status }), ...(filters.search && { OR: [{ name: { contains: filters.search, mode: 'insensitive' } }, { ruc: { contains: filters.search, mode: 'insensitive' } }, { contactName: { contains: filters.search, mode: 'insensitive' } }] }) }
    return customsAgentRepository.findMany(where)
  },
  async getById(companyId: string, id: string) { const agent = await customsAgentRepository.findById(id, companyId); if (!agent) throw new AppError('CUSTOMS_AGENT_NOT_FOUND', 'Agente de aduana no encontrado.', 404); return agent },
  async create(companyId: string, input: CreateCustomsAgentInput) { if (input.ruc && await customsAgentRepository.findByRuc(companyId, input.ruc)) throw duplicateRuc(); return customsAgentRepository.create(prisma, { ...input, company: { connect: { id: companyId } } }) },
  async update(companyId: string, id: string, input: UpdateCustomsAgentInput) { await this.getById(companyId, id); if (input.ruc) { const duplicate = await customsAgentRepository.findByRuc(companyId, input.ruc); if (duplicate && duplicate.id !== id) throw duplicateRuc() } return customsAgentRepository.update(prisma, id, input) },
  async remove(companyId: string, id: string) { await this.getById(companyId, id); await customsAgentRepository.remove(prisma, id) },
}
