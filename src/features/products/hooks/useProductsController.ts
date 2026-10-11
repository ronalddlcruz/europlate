import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { ConfigurationTab } from '@/features/products/components/products-navigation'
import type { ProductModal } from '@/features/products/types/product-modal.types'
import { useProductCatalog } from '@/features/products/hooks/useProductCatalog'
import { useProductList } from '@/features/products/hooks/useProductList'
import { useProductOperations } from '@/features/products/hooks/useProductOperations'
import { useUnitOperations } from '@/features/products/hooks/useUnitOperations'
import { useCategoryOperations } from '@/features/products/hooks/useCategoryOperations'
import { useAttributeOperations } from '@/features/products/hooks/useAttributeOperations'

export function useProductsController() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const {
    catalog,
    bases,
    variants,
    units,
    categories,
    attributes,
    refreshCatalog,
    refreshProductConsumers,
  } = useProductCatalog()
  const [modal, setModal] = useState<ProductModal>(null)
  const [notice, setNotice] = useState('')
  const {
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    setProductsPage,
    orderedBases,
    pageSize,
    totalProductPages,
    currentProductsPage,
    visibleBases,
  } = useProductList({ bases, variants, categories })
  const isConfiguration = pathname.startsWith('/productos/configuracion')
  const configurationTab: ConfigurationTab = pathname.endsWith('/atributos')
    ? 'attributes'
    : pathname.endsWith('/unidades')
      ? 'units'
      : 'categories'
  const openCatalog = () => navigate('/productos')
  const openConfiguration = (tab: ConfigurationTab = 'categories') =>
    navigate(
      `/productos/configuracion/${tab === 'categories' ? 'categorias' : tab === 'attributes' ? 'atributos' : 'unidades'}`,
    )
  const notify = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2800)
  }
  const {
    productMutation,
    deleteProductMutation,
    saveVariant,
    toggleVariantStatus,
  } = useProductOperations({
    units,
    bases,
    variants,
    setModal,
    setSearch,
    notify,
    refreshCatalog,
    refreshProductConsumers,
  })
  const { unitMutation, deleteUnitMutation } = useUnitOperations({
    setModal,
    notify,
    refreshCatalog,
  })
  const { categoryMutation } = useCategoryOperations({ setModal, notify })
  const { createAttributeForCategory, attributeMutation } =
    useAttributeOperations({ setModal, notify, refreshProductConsumers })
  return {
    catalog,
    bases,
    variants,
    units,
    categories,
    attributes,
    modal,
    setModal,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    notice,
    setProductsPage,
    isConfiguration,
    configurationTab,
    openCatalog,
    openConfiguration,
    createAttributeForCategory,
    productMutation,
    deleteProductMutation,
    unitMutation,
    deleteUnitMutation,
    categoryMutation,
    attributeMutation,
    orderedBases,
    pageSize,
    totalProductPages,
    currentProductsPage,
    visibleBases,
    saveVariant,
    toggleVariantStatus,
  }
}
