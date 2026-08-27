import { api } from '../../../lib/api-client'

export type AgentStatus = 'Activo' | 'Inactivo'
export type CustomsAgent = { id: string; name: string; ruc: string; contact: string; phone: string; email: string; status: AgentStatus }
type ApiCustomsAgent = { id: string; name: string; ruc: string | null; contactName: string | null; phone: string | null; email: string | null; status: 'ACTIVE' | 'INACTIVE' }
const toAgent = (agent: ApiCustomsAgent): CustomsAgent => ({ id: agent.id, name: agent.name, ruc: agent.ruc ?? '', contact: agent.contactName ?? '', phone: agent.phone ?? '', email: agent.email ?? '', status: agent.status === 'ACTIVE' ? 'Activo' : 'Inactivo' })
const toPayload = (agent: Omit<CustomsAgent, 'id'>) => ({ name: agent.name, ruc: agent.ruc || undefined, contactName: agent.contact || undefined, phone: agent.phone || undefined, email: agent.email || undefined, status: agent.status === 'Activo' ? 'ACTIVE' : 'INACTIVE' })
export async function listCustomsAgents() { return (await api<ApiCustomsAgent[]>('/api/customs-agents')).map(toAgent) }
export async function createCustomsAgent(agent: Omit<CustomsAgent, 'id'>) { return toAgent(await api<ApiCustomsAgent>('/api/customs-agents', { method: 'POST', body: JSON.stringify(toPayload(agent)) })) }
export async function updateCustomsAgent(id: string, agent: Omit<CustomsAgent, 'id'>) { return toAgent(await api<ApiCustomsAgent>(`/api/customs-agents/${id}`, { method: 'PATCH', body: JSON.stringify(toPayload(agent)) })) }
export async function deleteCustomsAgent(id: string) { await api<void>(`/api/customs-agents/${id}`, { method: 'DELETE' }) }
