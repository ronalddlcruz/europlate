import { productionRepository } from '../repositories/production.repository.js'
export const productionService = { list: () => productionRepository.findMany() }
