import {
AttributeDefinitionDialog
} from "../components/attribute-catalog";
import {
CategoryConfigurationDialog,
SubcategoryEditDialog
} from "../components/category-configuration";
import { UnitDialog } from '../components/dialogs/UnitDialog';
import { VariantDialog } from '../components/dialogs/VariantDialog';
import { ProductWizard } from "../components/product-wizard";
import { ProductsNavigation } from "../components/products-navigation";
import { useProductsController } from '../hooks/useProductsController';
import { ProductsCatalogPage } from './products-catalog-page';
import { ProductsConfigurationPage } from './products-configuration-page';

export function ProductsPage() {
  const model = useProductsController()
  const { queryClient, navigate, pathname, catalog, products, bases, variants, units, categories, attributes, modal, setModal, roleFilter, setRoleFilter, statusFilter, setStatusFilter, search, setSearch, notice, setNotice, productsPage, setProductsPage, isConfiguration, configurationTab, openCatalog, openConfiguration, notify, refreshCatalog, createAttributeForCategory, refreshProductConsumers, synchronizeAttributeDefinition, syncProductionCatalogProduct, removeProductFromProductionCatalog, warmProductionCatalog, productMutation, statusMutation, deleteProductMutation, unitMutation, deleteUnitMutation, categoryMutation, attributeMutation, filteredBases, orderedBases, pageSize, totalProductPages, currentProductsPage, visibleBases, saveVariant, toggleVariantStatus } = model
  return (
    <div className="-mx-2 max-w-none sm:-mx-4 lg:-mx-[3%]">
      <ProductsNavigation
        isConfiguration={isConfiguration}
        configurationTab={configurationTab}
        onOpenCatalog={openCatalog}
        onOpenConfiguration={openConfiguration}
      />
      {isConfiguration ? <ProductsConfigurationPage model={model} /> : <ProductsCatalogPage model={model} />}
      {modal?.type === "base" && (
        <ProductWizard
          key={modal.item?.id ?? "new-product"}
          item={modal.item}
          variants={
            modal.item
              ? variants.filter((variant) => variant.baseId === modal.item!.id)
              : []
          }
          products={bases}
          categories={categories}
          units={units}
          readOnly={modal.readOnly}
          onClose={() => setModal(null)}
          onSave={({ base, variants: savedVariants }) =>
            productMutation.mutate({
              base,
              nextVariants: savedVariants,
              editing: Boolean(modal.item),
            })
          }
        />
      )}
      {modal?.type === "variant" && (
        <VariantDialog
          item={modal.item}
          base={bases.find((base) => base.id === modal.item?.baseId)!}
          units={units}
          onClose={() => setModal(null)}
          onSave={(item) => saveVariant(item, Boolean(modal.item))}
        />
      )}
      {modal?.type === "unit" && (
        <UnitDialog
          item={modal.item}
          onClose={() => setModal(null)}
          onSave={(item) =>
            unitMutation.mutate({ item, editing: Boolean(modal.item) })
          }
        />
      )}
      {modal?.type === "category" && (
        <CategoryConfigurationDialog
          item={modal.item}
          definitions={attributes}
          products={bases}
          onCreateAttribute={createAttributeForCategory}
          onClose={() => setModal(null)}
          onSave={(item) =>
            categoryMutation.mutate({ item, editing: modal.editing ?? Boolean(modal.item) })
          }
        />
      )}
      {modal?.type === "subcategory" && (
        <SubcategoryEditDialog
          category={modal.category}
          item={modal.item}
          definitions={attributes}
          hasProducts={bases.some(
            (base) => base.subcategoryId === modal.item.id,
          )}
          onClose={() => setModal(null)}
          onSave={(item) =>
            categoryMutation.mutate({
              item: {
                ...modal.category,
                subcategories: modal.category.subcategories.map(
                  (subcategory) =>
                    subcategory.id === item.id ? item : subcategory,
                ),
              },
              editing: true,
            })
          }
        />
      )}
      {modal?.type === "attribute" && (
        <AttributeDefinitionDialog
          item={modal.item}
          editing={modal.editing ?? Boolean(modal.item)}
          attributes={attributes}
          onClose={() => setModal(null)}
          onSave={(item) =>
            attributeMutation.mutate({
              item,
              editing: modal.editing ?? Boolean(modal.item),
            })
          }
        />
      )}
      {notice && (
        <div className="fixed bottom-6 right-6 z-[60] rounded-md border border-border border-l-4 border-l-emerald-600 bg-white px-4 py-3 text-sm shadow-panel">
          {notice}
        </div>
      )}
    </div>
  );
}
