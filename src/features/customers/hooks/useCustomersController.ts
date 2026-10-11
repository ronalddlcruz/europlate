import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query'
import { useMemo,useState } from 'react'
import { sortCustomers } from '@/features/customers/components/shared'
import { createCustomer,deleteCustomer,listCustomers,updateCustomer,type Customer } from '@/features/customers/services/customer-api.service'

const EMPTY_CUSTOMERS: Customer[] = []

export function useCustomersController() {
  const queryClient = useQueryClient(); const customersQuery = useQuery({ queryKey: ['customers'], queryFn: listCustomers }); const customers = customersQuery.data ?? EMPTY_CUSTOMERS
  const [query, setQuery] = useState(''); const [modalItem, setModalItem] = useState<Customer | null | undefined>(undefined); const [notice, setNotice] = useState('')
  const notify = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 2800) }
  const syncCustomerPickers = (customer?: Customer, removedId?: string) => {
    const updateCatalog = <T extends { customers: { id: string; name: string }[] }>(current: T | undefined) => {
      if (!current) return current
      const customers = customer
        ? [...current.customers.filter(item => item.id !== customer.id), { id: customer.id, name: customer.name }].sort((left, right) => left.name.localeCompare(right.name, 'es'))
        : current.customers.filter(item => item.id !== removedId)
      return { ...current, customers }
    }
    queryClient.setQueriesData({ queryKey: ['production', 'catalog'] }, updateCatalog)
    queryClient.setQueriesData({ queryKey: ['inventory', 'catalog'] }, updateCatalog)
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: ['customers'], refetchType: 'all' }),
      queryClient.invalidateQueries({ queryKey: ['production', 'catalog'], refetchType: 'all' }),
      queryClient.invalidateQueries({ queryKey: ['inventory', 'catalog'], refetchType: 'all' }),
    ])
  }
  const saveMutation = useMutation({ mutationFn: ({ item, editing }: { item: Omit<Customer, 'id'>; editing?: Customer }) => editing ? updateCustomer(editing.id, item) : createCustomer(item), onSuccess: saved => { queryClient.setQueryData<Customer[]>(['customers'], current => sortCustomers([...(current ?? []).filter(item => item.id !== saved.id), saved])); syncCustomerPickers(saved); setQuery(''); setModalItem(undefined); notify('Cliente guardado y disponible de inmediato en los buscadores') }, onError: error => notify(error instanceof Error ? error.message : 'No se pudo guardar el cliente') })
  const removeMutation = useMutation({ mutationFn: deleteCustomer, onSuccess: (_, id) => { queryClient.setQueryData<Customer[]>(['customers'], current => current?.filter(item => item.id !== id) ?? []); syncCustomerPickers(undefined, id); notify('Cliente eliminado de la base de datos') }, onError: error => notify(error instanceof Error ? error.message : 'No se pudo eliminar el cliente') })
  const visible = useMemo(() => customers.filter(customer => `${customer.name} ${customer.ruc} ${customer.phone} ${customer.email} ${customer.address}`.toLowerCase().includes(query.toLowerCase())), [customers, query])


  return { queryClient, customersQuery, customers, query, setQuery, modalItem, setModalItem, notice, setNotice, notify, syncCustomerPickers, saveMutation, removeMutation, visible }
}
