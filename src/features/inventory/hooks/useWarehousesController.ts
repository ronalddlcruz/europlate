import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { type WarehousePayload } from '@/features/inventory/components/warehouses-shared'
import {
  createWarehouse,
  deleteWarehouse,
  listSites,
  listWarehouseResponsibles,
  listWarehouses,
  renameWarehouse,
  updateWarehouse,
  type Warehouse,
} from '@/features/inventory/services/inventory-api.service'

export function useWarehousesController() {
  const client = useQueryClient()
  const { session } = useAuth()
  const permissions = session?.user.permissions ?? []
  const canManage =
    (permissions.includes('*') || permissions.includes('users.manage')) &&
    (permissions.includes('*') || permissions.includes('operations.global'))
  const canEdit = canManage || permissions.includes('inventory.manage')
  const canRename = canEdit
  const warehouses = useQuery({
    queryKey: ['inventory', 'warehouses'],
    queryFn: listWarehouses,
    staleTime: 0,
    refetchOnMount: 'always',
  })
  const responsibles = useQuery({
    queryKey: ['inventory', 'warehouse-responsibles'],
    queryFn: listWarehouseResponsibles,
    enabled: canEdit,
  })
  const sites = useQuery({
    queryKey: ['inventory', 'sites'],
    queryFn: listSites,
    enabled: canEdit,
  })
  const [editing, setEditing] = useState<Warehouse>()
  const [renaming, setRenaming] = useState<Warehouse>()
  const [modal, setModal] = useState(false)
  const [notice, setNotice] = useState('')
  const notify = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3200)
  }
  const sync = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: ['inventory'], refetchType: 'all' }),
      client.invalidateQueries({ queryKey: ['reports'], refetchType: 'all' }),
      client.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'all' }),
    ])
  const save = useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: WarehousePayload }) =>
      id ? updateWarehouse(id, payload) : createWarehouse(payload),
    onSuccess: () => {
      setModal(false)
      void sync()
      notify('Almacén guardado y sincronizado.')
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : 'No se pudo guardar el almacén.'),
  })
  const rename = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameWarehouse(id, name),
    onSuccess: (saved) => {
      client.setQueryData<Warehouse[]>(['inventory', 'warehouses'], (current) =>
        current?.map((warehouse) => (warehouse.id === saved.id ? saved : warehouse)),
      )
      setRenaming(undefined)
      void sync()
      notify('Nombre del almacén actualizado.')
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : 'No se pudo cambiar el nombre.'),
  })
  const remove = useMutation({
    mutationFn: deleteWarehouse,
    onSuccess: () => {
      void sync()
      notify('Almacén eliminado.')
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : 'No se puede eliminar este almacén.'),
  })

  return {
    client,
    session,
    canManage,
    canEdit,
    canRename,
    warehouses,
    responsibles,
    sites,
    editing,
    setEditing,
    renaming,
    setRenaming,
    modal,
    setModal,
    notice,
    setNotice,
    notify,
    sync,
    save,
    rename,
    remove,
  }
}
