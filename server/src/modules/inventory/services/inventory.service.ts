import { inventoryRepository } from '../repositories/inventory.repository.js'
export const inventoryService = { getStock: () => inventoryRepository.getStock() }
