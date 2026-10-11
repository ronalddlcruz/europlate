import {
AttributeCatalog
} from "@/features/products/components/attribute-catalog";
import {
CategoryConfiguration
} from "@/features/products/components/category-configuration";
import { UnitsSection } from '@/features/products/components/sections/UnitsSection';
import { useProductsController } from '@/features/products/hooks/useProductsController';

export function ProductsConfigurationPage({ model }: { model: ReturnType<typeof useProductsController> }) {
  const { units, categories, attributes, setModal, configurationTab, deleteUnitMutation, attributeMutation } = model
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
