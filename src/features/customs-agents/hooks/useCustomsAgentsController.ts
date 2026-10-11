import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query'
import { useMemo,useState } from 'react'
import { sortAgents } from '../components/shared'
import { createCustomsAgent,deleteCustomsAgent,listCustomsAgents,updateCustomsAgent,type CustomsAgent } from '../services/customs-agent-api.service'

export function useCustomsAgentsController() {
  const queryClient = useQueryClient()
  const agentsQuery = useQuery({ queryKey: ['customs-agents'], queryFn: listCustomsAgents })
  const agents = agentsQuery.data ?? []
  const [modalItem, setModalItem] = useState<CustomsAgent | null | undefined>(undefined)
  const [search, setSearch] = useState(''); const [notice, setNotice] = useState('')
  const notify = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 2800) }
  const saveMutation = useMutation({ mutationFn: ({ item, editing }: { item: Omit<CustomsAgent, 'id'>; editing?: CustomsAgent }) => editing ? updateCustomsAgent(editing.id, item) : createCustomsAgent(item), onSuccess: (saved) => { queryClient.setQueryData<CustomsAgent[]>(['customs-agents'], current => sortAgents([...(current ?? []).filter(item => item.id !== saved.id), saved])); void queryClient.invalidateQueries({ queryKey: ['customs-agents'] }); void queryClient.invalidateQueries({ queryKey: ['imports', 'catalog'], refetchType: 'all' }); setSearch(''); setModalItem(undefined); notify('Agente guardado y sincronizado con la base de datos') }, onError: error => notify(error instanceof Error ? error.message : 'No se pudo guardar el agente') })
  const removeMutation = useMutation({ mutationFn: deleteCustomsAgent, onSuccess: (_, id) => { queryClient.setQueryData<CustomsAgent[]>(['customs-agents'], current => current?.filter(item => item.id !== id) ?? []); void queryClient.invalidateQueries({ queryKey: ['customs-agents'] }); notify('Agente eliminado de la base de datos') }, onError: error => notify(error instanceof Error ? error.message : 'No se pudo eliminar el agente') })
  const filtered = useMemo(() => agents.filter(agent => `${agent.name} ${agent.ruc} ${agent.contact} ${agent.email}`.toLowerCase().includes(search.toLowerCase())), [agents, search])

  return { queryClient, agentsQuery, agents, modalItem, setModalItem, search, setSearch, notice, setNotice, notify, saveMutation, removeMutation, filtered }
}
