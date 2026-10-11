import {
AttributeCatalog
} from "@/features/products/components/attribute-catalog";
import {
CategoryConfiguration
} from "@/features/products/components/category-configuration";
import { UnitsSection } from '@/features/products/components/sections/UnitsSection';
import { useProductsController } from '@/features/products/hooks/useProductsController';

export function ProductsConfigurationPage({ model }: { model: ReturnType<typeof useProductsController> }) {
  const { queryClient, navigate, pathname, catalog, products, bases, variants, units, categories, attributes, modal, setModal, roleFilter, setRoleFilter, statusFilter, setStatusFilter, search, setSearch, notice, setNotice, productsPage, setProductsPage, isConfiguration, configurationTab, openCatalog, openConfiguration, notify, refreshCatalog, createAttributeForCategory, refreshProductConsumers, synchronizeAttributeDefinition, syncProductionCatalogProduct, removeProductFromProductionCatalog, warmProductionCatalog, productMutation, statusMutation, deleteProductMutation, unitMutation, deleteUnitMutation, categoryMutation, attributeMutation, filteredBases, orderedBases, pageSize, totalProductPages, currentProductsPage, visibleBases, saveVariant, toggleVariantStatus } = model
  return ((
        <section>
          {configurationTab === "categories" ? (
            <CategoryConfiguration
              categories={categories}
              onNew={() => setModal({ type: "category" })}
              onEdit={(item) => setModal({ type: "category", item })}
              onEditSubcategory={(category, item) =>
                setModal({ type: "subcategory", category, item })
              }
            />
          ) : configurationTab === "attributes" ? (
            <AttributeCatalog
              attributes={attributes}
              onNew={() => setModal({ type: "attribute" })}
              onEdit={(item) => setModal({ type: "attribute", item })}
              onToggleStatus={(item) =>
                attributeMutation.mutate({
                  item: {
                    ...item,
                    status: item.status === "Activo" ? "Inactivo" : "Activo",
                  },
                  editing: true,
                })
              }
            />
          ) : (
            <UnitsSection
              units={units}
              onNew={() => setModal({ type: "unit" })}
              onEdit={(item) => setModal({ type: "unit", item })}
              onDelete={(id) => deleteUnitMutation.mutate(id)}
            />
          )}
        </section>
      ))
}
