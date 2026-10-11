import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useAuth } from '../../auth/hooks/use-auth'
import { type WarehousePayload } from '../components/warehouses-shared'
import {
createWarehouse,deleteWarehouse,listWarehouseResponsibles,listWarehouses,
updateWarehouse,type Warehouse
} from '../services/inventory-api.service'

export function useWarehousesController() {
  const client = useQueryClient()
  const { session } = useAuth()
  const canManage = Boolean(session?.user.permissions.includes('*') || session?.user.permissions.includes('users.manage'))
  const warehouses = useQuery({ queryKey: ['inventory', 'warehouses'], queryFn: listWarehouses, staleTime: 0, refetchOnMount: 'always' })
  const responsibles = useQuery({ queryKey: ['inventory', 'warehouse-responsibles'], queryFn: listWarehouseResponsibles, enabled: canManage })
  const [editing, setEditing] = useState<Warehouse>()
  const [modal, setModal] = useState(false)
  const [notice, setNotice] = useState('')
  const notify = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 3200) }
  const sync = () => Promise.all([
    client.invalidateQueries({ queryKey: ['inventory'], refetchType: 'all' }),
    client.invalidateQueries({ queryKey: ['reports'], refetchType: 'all' }),
    client.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'all' }),
  ])
  const save = useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: WarehousePayload }) => id ? updateWarehouse(id, payload) : createWarehouse(payload),
    onSuccess: () => { setModal(false); void sync(); notify('Almacén guardado y sincronizado.') },
    onError: error => notify(error instanceof Error ? error.message : 'No se pudo guardar el almacén.'),
  })
  const remove = useMutation({
    mutationFn: deleteWarehouse,
    onSuccess: () => { void sync(); notify('Almacén eliminado.') },
    onError: error => notify(error instanceof Error ? error.message : 'No se puede eliminar este almacén.'),
  })

  return { client, session, canManage, warehouses, responsibles, editing, setEditing, modal, setModal, notice, setNotice, notify, sync, save, remove }
}
