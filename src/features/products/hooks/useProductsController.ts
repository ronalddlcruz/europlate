import { useMutation,useQuery,useQueryClient } from "@tanstack/react-query";
import { useMemo,useState } from "react";
import { useLocation,useNavigate } from "react-router-dom";
import { matchesProductSearch } from "../../../lib/product-search";
import { loadProductionCatalog,type ProductionCatalog } from "../../production/services/production-api.service";
import { type ConfigurationTab } from "../components/products-navigation";
import { type CatalogData,type Modal } from '../components/shared';
import {
createAttributeDefinition,
createCatalogCategory,
createCatalogProduct,
createCatalogUnit,
deleteCatalogProduct,
deleteCatalogUnit,
loadCatalog,
updateAttributeDefinition,
updateCatalogCategory,
updateCatalogProduct,
updateCatalogUnit,
} from "../services/product-api.service";
import type {
Attribute,
AttributeDefinition,
ProductBase,
ProductCategory,
ProductRole,
ProductStatus,
ProductVariant,
Unit
} from "../types/product.types";

export function useProductsController() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const catalog = useQuery({
    queryKey: ["products", "catalog"],
    queryFn: loadCatalog,
  });
  const products = catalog.data?.products ?? [];
  const bases = products.map((product) => product.base);
  const variants = products.flatMap((product) => product.variants);
  const units = catalog.data?.units ?? [];
  const categories = catalog.data?.categories ?? [];
  const attributes = catalog.data?.attributes ?? [];
  const [modal, setModal] = useState<Modal>(null);
  const [roleFilter, setRoleFilter] = useState<"Todos" | ProductRole>("Todos");
  const [statusFilter, setStatusFilter] = useState<"Todos" | ProductStatus>(
    "Todos",
  );
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [productsPage, setProductsPage] = useState(1);
  const isConfiguration = pathname.startsWith("/productos/configuracion");
  const configurationTab: ConfigurationTab = pathname.endsWith("/atributos")
    ? "attributes"
    : pathname.endsWith("/unidades")
      ? "units"
      : "categories";
  const openCatalog = () => navigate("/productos");
  const openConfiguration = (tab: ConfigurationTab = "categories") =>
    navigate(
      `/productos/configuracion/${tab === "categories" ? "categorias" : tab === "attributes" ? "atributos" : "unidades"}`,
    );
  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  };
  const refreshCatalog = async () => {
    await queryClient.invalidateQueries({ queryKey: ["products", "catalog"] });
  };
  const createAttributeForCategory = async (
    attribute: Omit<AttributeDefinition, "id">,
  ) => {
    const saved = await createAttributeDefinition(attribute);
    queryClient.setQueryData<CatalogData>(["products", "catalog"], (current) =>
      current
        ? {
            ...current,
            attributes: [...current.attributes.filter((item) => item.id !== saved.id), saved]
              .sort((left, right) => left.name.localeCompare(right.name)),
          }
        : current,
    );
    return saved;
  };
  const refreshProductConsumers = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["inventory"], refetchType: "all" }),
      queryClient.invalidateQueries({ queryKey: ["reports"], refetchType: "all" }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"], refetchType: "all" }),
      queryClient.invalidateQueries({ queryKey: ["production", "catalog"], refetchType: "all" }),
      queryClient.invalidateQueries({ queryKey: ["imports", "catalog"], refetchType: "all" }),
      queryClient.invalidateQueries({ queryKey: ["purchases", "catalog"], refetchType: "all" }),
    ]);
  const synchronizeAttributeDefinition = (
    current: CatalogData,
    definition: AttributeDefinition,
  ): CatalogData => {
    const synchronizeConfigured = (attribute: Attribute) =>
      attribute.definitionId === definition.id
        ? {
            ...attribute,
            name: definition.name,
            type: definition.type,
            suffix: definition.suffix,
            definitionStatus: definition.status,
            isWeight: definition.isWeight,
          }
        : attribute;
    return {
      ...current,
      attributes: current.attributes.map((attribute) =>
        attribute.id === definition.id ? definition : attribute,
      ),
      categories: current.categories.map((category) => ({
        ...category,
        attributes: category.attributes.map(synchronizeConfigured),
        subcategories: category.subcategories.map((subcategory) => ({
          ...subcategory,
          attributes: subcategory.attributes.map(synchronizeConfigured),
        })),
      })),
      // Un producto conserva nombre, sufijo y valores como una instantánea;
      // solo recibe el estado maestro para mostrarlo como histórico.
      products: current.products.map((product) => ({
        ...product,
        base: {
          ...product.base,
          attributes: product.base.attributes.map((attribute) =>
            attribute.definitionId === definition.id
              ? { ...attribute, definitionStatus: definition.status }
              : attribute,
          ),
        },
      })),
    };
  };
  /**
   * Hace visible al instante el producto modificado en Nueva Orden de
   * Producción. El refetch posterior conserva disponible/stock confirmado.
   */
  const syncProductionCatalogProduct = (product: CatalogData["products"][number]) => {
    const activeVariant = product.variants.find((variant) => variant.status === "Activo");
    const mapped = activeVariant
      ? {
          id: product.base.id,
          code: product.base.code,
          name: product.base.name,
          unit: activeVariant.unit,
          unitName: units.find((unit) => unit.code === activeVariant.unit)?.description ?? activeVariant.unit,
          factor: activeVariant.factor,
          available: activeVariant.stock,
        }
      : null;
    const updateRole = (
      current: ProductionCatalog["products"],
      role: ProductRole,
    ) => {
      const eligible = Boolean(mapped && product.base.status === "Activo" && product.base.roles.includes(role));
      if (!eligible || !mapped) return current.filter((item) => item.id !== product.base.id);
      return [...current.filter((item) => item.id !== product.base.id), mapped].sort((left, right) => left.name.localeCompare(right.name));
    };
    queryClient.setQueryData<ProductionCatalog>(["production", "catalog"], (current) => current
      ? { ...current, products: updateRole(current.products, "Producto terminado"), materials: updateRole(current.materials, "Insumo") }
      : current,
    );
  };
  const removeProductFromProductionCatalog = (productId: string) => {
    queryClient.setQueryData<ProductionCatalog>(["production", "catalog"], (current) => current
      ? { ...current, products: current.products.filter((item) => item.id !== productId), materials: current.materials.filter((item) => item.id !== productId) }
      : current,
    );
  };
  const warmProductionCatalog = () => {
    // Si Producción aún no se visitó en esta sesión, iniciamos su carga al
    // guardar el producto para que Nueva Orden abra con el selector listo.
    if (queryClient.getQueryData<ProductionCatalog>(["production", "catalog"])) return;
    void queryClient.prefetchQuery({ queryKey: ["production", "catalog"], queryFn: loadProductionCatalog, staleTime: 0 });
  };
  const productMutation = useMutation({
    mutationFn: ({
      base,
      nextVariants,
      editing,
    }: {
      base: ProductBase;
      nextVariants: ProductVariant[];
      editing: boolean;
    }) =>
      editing
        ? updateCatalogProduct(base, nextVariants, units)
        : createCatalogProduct(base, nextVariants, units),
    onMutate: async ({ base, nextVariants, editing }) => {
      await queryClient.cancelQueries({ queryKey: ["products", "catalog"] });
      const previous = queryClient.getQueryData<CatalogData>([
        "products",
        "catalog",
      ]);
      queryClient.setQueryData<CatalogData>(
        ["products", "catalog"],
        (current) => {
          if (!current) return current;
          const product = { base, variants: nextVariants };
          const products = editing
            ? current.products.map((currentProduct) =>
                currentProduct.base.id === base.id ? product : currentProduct,
              )
            : [...current.products, product];
          return { ...current, products };
        },
      );
      setModal(null);
      return { previous, optimisticId: base.id, editing };
    },
    onSuccess: (saved, _variables, context) => {
      queryClient.setQueryData<CatalogData>(
        ["products", "catalog"],
        (current) => {
          if (!current) return current;
          const products = context?.editing
            ? current.products.map((product) =>
                product.base.id === saved.base.id ? saved : product,
              )
            : current.products.map((product) =>
                product.base.id === context?.optimisticId ? saved : product,
              );
          return { ...current, products };
        },
      );
      setSearch("");
      syncProductionCatalogProduct(saved);
      warmProductionCatalog();
      void refreshProductConsumers();
      notify("Producto guardado y verificado en la base de datos");
    },
    onError: (reason, _variables, context) => {
      if (context?.previous)
        queryClient.setQueryData(["products", "catalog"], context.previous);
      notify(
        reason instanceof Error
          ? `No se guardó el producto: ${reason.message}`
          : "No se pudo guardar el producto. Se restauró el cambio anterior.",
      );
    },
    onSettled: () => void refreshCatalog(),
  });
  const statusMutation = useMutation({
    mutationFn: ({
      base,
      nextVariants,
    }: {
      base: ProductBase;
      nextVariants: ProductVariant[];
    }) => updateCatalogProduct(base, nextVariants, units),
    onMutate: async ({ base, nextVariants }) => {
      await queryClient.cancelQueries({ queryKey: ["products", "catalog"] });
      const previous = queryClient.getQueryData<
        Awaited<ReturnType<typeof loadCatalog>>
      >(["products", "catalog"]);
      queryClient.setQueryData<Awaited<ReturnType<typeof loadCatalog>>>(
        ["products", "catalog"],
        (current) =>
          current
            ? {
                ...current,
                products: current.products.map((product) =>
                  product.base.id === base.id
                    ? { base, variants: nextVariants }
                    : product,
                ),
              }
            : current,
      );
      return { previous };
    },
    onError: (reason, _variables, context) => {
      if (context?.previous)
        queryClient.setQueryData(["products", "catalog"], context.previous);
      notify(
        reason instanceof Error
          ? reason.message
          : "No se pudo actualizar el estado del producto",
      );
    },
    onSuccess: (saved) => { syncProductionCatalogProduct(saved); warmProductionCatalog(); void refreshProductConsumers(); },
    onSettled: () => void refreshCatalog(),
  });
  const deleteProductMutation = useMutation({
    mutationFn: deleteCatalogProduct,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['products', 'catalog'] });
      const previous = queryClient.getQueryData<CatalogData>(['products', 'catalog']);
      queryClient.setQueryData<CatalogData>(['products', 'catalog'], current => current ? { ...current, products: current.products.filter(product => product.base.id !== id) } : current);
      return { previous };
    },
    onSuccess: (_result, id) => { removeProductFromProductionCatalog(id); warmProductionCatalog(); void refreshProductConsumers(); notify('Producto eliminado físicamente de la base de datos.'); },
    onError: (reason, _id, context) => {
      if (context?.previous) queryClient.setQueryData(['products', 'catalog'], context.previous);
      notify(reason instanceof Error ? reason.message : 'No se pudo eliminar el producto.');
    },
    onSettled: () => void refreshCatalog(),
  });
  const unitMutation = useMutation({
    mutationFn: ({ item, editing }: { item: Unit; editing: boolean }) =>
      editing ? updateCatalogUnit(item.id, item) : createCatalogUnit(item),
    onMutate: async ({ item, editing }) => {
      await queryClient.cancelQueries({ queryKey: ["products", "catalog"] });
      const previous = queryClient.getQueryData<CatalogData>([
        "products",
        "catalog",
      ]);
      queryClient.setQueryData<CatalogData>(
        ["products", "catalog"],
        (current) => {
          if (!current) return current;
          const units = editing
            ? current.units.map((unit) => (unit.id === item.id ? item : unit))
            : [...current.units, item];
          return {
            ...current,
            units: units.sort((left, right) =>
              left.code.localeCompare(right.code),
            ),
          };
        },
      );
      setModal(null);
      notify("Guardando unidad de medida en segundo plano…");
      return { previous, optimisticId: item.id, editing };
    },
    onSuccess: (saved, _variables, context) => {
      queryClient.setQueryData<CatalogData>(
        ["products", "catalog"],
        (current) => {
          if (!current) return current;
          const units = current.units.map((unit) =>
            context?.editing
              ? unit.id === saved.id
                ? saved
                : unit
              : unit.id === context?.optimisticId
                ? saved
                : unit,
          );
          return {
            ...current,
            units: units.sort((left, right) =>
              left.code.localeCompare(right.code),
            ),
          };
        },
      );
      notify("Unidad de medida guardada y verificada en la base de datos");
    },
    onError: (reason, _variables, context) => {
      if (context?.previous)
        queryClient.setQueryData(["products", "catalog"], context.previous);
      notify(
        reason instanceof Error
          ? `No se guardó la unidad: ${reason.message}`
          : "No se pudo guardar la unidad de medida. Se restauró el cambio anterior.",
      );
    },
    onSettled: () => void refreshCatalog(),
  });
  const deleteUnitMutation = useMutation({
    mutationFn: deleteCatalogUnit,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["products", "catalog"] });
      const previous = queryClient.getQueryData<CatalogData>([
        "products",
        "catalog",
      ]);
      queryClient.setQueryData<CatalogData>(
        ["products", "catalog"],
        (current) =>
          current
            ? {
                ...current,
                units: current.units.filter((unit) => unit.id !== id),
              }
            : current,
      );
      notify("Eliminando unidad de medida en segundo plano…");
      return { previous };
    },
    onSuccess: () => notify("Unidad de medida eliminada de la base de datos"),
    onError: (reason, _id, context) => {
      if (context?.previous)
        queryClient.setQueryData(["products", "catalog"], context.previous);
      notify(
        reason instanceof Error
          ? reason.message
          : "No se pudo eliminar la unidad. Se restauró el cambio anterior.",
      );
    },
    onSettled: () => void refreshCatalog(),
  });
  const categoryMutation = useMutation({
    mutationFn: async ({
      item,
      editing,
    }: {
      item: ProductCategory;
      editing: boolean;
    }) => {
      const { id: _id, ...payload } = item;
      return editing
        ? updateCatalogCategory(item.id, payload)
        : createCatalogCategory(payload);
    },
    onMutate: async ({ item, editing }) => {
      await queryClient.cancelQueries({ queryKey: ["products", "catalog"] });
      const previous = queryClient.getQueryData<CatalogData>([
        "products",
        "catalog",
      ]);
      queryClient.setQueryData<CatalogData>(
        ["products", "catalog"],
        (current) => {
          if (!current) return current;
          return {
            ...current,
            categories: editing
              ? current.categories.map((category) =>
                  category.id === item.id ? item : category,
                )
              : [...current.categories, item].sort((left, right) =>
                  left.name.localeCompare(right.name),
                ),
          };
        },
      );
      setModal(null);
      notify("Categoría guardándose en segundo plano…");
      return { previous, optimisticId: item.id, editing };
    },
    onSuccess: (saved, _variables, context) => {
      queryClient.setQueryData<CatalogData>(
        ["products", "catalog"],
        (current) => {
          if (!current) return current;
          const categories = context?.editing
            ? current.categories.map((category) =>
                category.id === saved.id ? saved : category,
              )
            : current.categories.map((category) =>
                category.id === context?.optimisticId ? saved : category,
              );
          return {
            ...current,
            categories: categories.sort((left, right) =>
              left.name.localeCompare(right.name),
            ),
          };
        },
      );
      notify("Categoría guardada y verificada en la base de datos");
    },
    onError: (reason, variables, context) => {
      if (context?.previous)
        queryClient.setQueryData(["products", "catalog"], context.previous);
      setModal({ type: "category", item: variables.item, editing: variables.editing });
      notify(
        reason instanceof Error
          ? `No se guardó la categoría: ${reason.message}`
          : "No se pudo guardar la categoría. Se restauró el cambio anterior.",
      );
    },
  });
  const attributeMutation = useMutation({
    mutationFn: async ({
      item,
      editing,
    }: {
      item: AttributeDefinition;
      editing: boolean;
    }) => {
      const { id: _id, ...payload } = item;
      return editing
        ? updateAttributeDefinition(item.id, payload)
        : createAttributeDefinition(payload);
    },
    onMutate: async ({ item, editing }) => {
      await queryClient.cancelQueries({ queryKey: ["products", "catalog"] });
      const previous = queryClient.getQueryData<CatalogData>([
        "products",
        "catalog",
      ]);
      queryClient.setQueryData<CatalogData>(
        ["products", "catalog"],
        (current) => {
          if (!current) return current;
          const next = editing
            ? synchronizeAttributeDefinition(current, item)
            : { ...current, attributes: [...current.attributes, item] };
          return { ...next, attributes: [...next.attributes].sort((left, right) => left.name.localeCompare(right.name)) };
        },
      );
      setModal(null);
      notify("Atributo guardándose en segundo plano…");
      return { previous, optimisticId: item.id, editing };
    },
    onSuccess: (saved, _variables, context) => {
      queryClient.setQueryData<CatalogData>(
        ["products", "catalog"],
        (current) => {
          if (!current) return current;
          const next = context?.editing
            ? synchronizeAttributeDefinition(current, saved)
            : { ...current, attributes: current.attributes.map((attribute) => attribute.id === context?.optimisticId ? saved : attribute) };
          return { ...next, attributes: [...next.attributes].sort((left, right) => left.name.localeCompare(right.name)) };
        },
      );
      void refreshProductConsumers();
      notify("Atributo guardado y verificado en la base de datos");
    },
    onError: (reason, variables, context) => {
      if (context?.previous)
        queryClient.setQueryData(["products", "catalog"], context.previous);
      setModal({
        type: "attribute",
        item: variables.item,
        editing: variables.editing,
      });
      notify(
        reason instanceof Error
          ? `No se guardó el atributo: ${reason.message}`
          : "No se pudo guardar el atributo. Se restauró el cambio anterior.",
      );
    },
  });
  const filteredBases = useMemo(
    () =>
      bases.filter(
        (base) => {
          // La fila expone el estado de su presentación de inventario. El
          // filtro debe evaluar ese mismo estado, no solo el estado base.
          const inventory = variants.find((variant) => variant.baseId === base.id);
          const visibleStatus = inventory?.status ?? base.status;
          const category = categories.find((item) => item.id === base.categoryId);
          const subcategory = category?.subcategories.find(
            (item) => item.id === base.subcategoryId,
          );
          const productVariants = variants.filter(
            (variant) => variant.baseId === base.id,
          );
          const searchableProductData = [
            base.name,
            base.code,
            base.categoryName,
            category?.name,
            base.subcategoryName,
            subcategory?.name,
            ...base.roles,
            ...base.attributes.flatMap((attribute) => [
              attribute.name,
              attribute.suffix,
            ]),
            ...productVariants.flatMap((variant) => [
              variant.name,
              variant.unit,
              ...Object.values(variant.values),
            ]),
          ]
            .filter(Boolean)
            .join(" ");
          return (
          (roleFilter === "Todos" || base.roles.includes(roleFilter)) &&
          (statusFilter === "Todos" || visibleStatus === statusFilter) &&
          matchesProductSearch(searchableProductData, search)
          );
        },
      ),
    [bases, variants, categories, roleFilter, statusFilter, search],
  );
  const orderedBases = useMemo(
    () =>
      [...filteredBases].sort((left, right) =>
        left.code.localeCompare(right.code, "es", {
          numeric: true,
          sensitivity: "base",
        }),
      ),
    [filteredBases],
  );
  const pageSize = 10;
  const totalProductPages = Math.max(
    1,
    Math.ceil(orderedBases.length / pageSize),
  );
  const currentProductsPage = Math.min(productsPage, totalProductPages);
  const visibleBases = orderedBases.slice(
    (currentProductsPage - 1) * pageSize,
    currentProductsPage * pageSize,
  );
  const saveVariant = (item: ProductVariant, editing: boolean) => {
    const base = bases.find((value) => value.id === item.baseId);
    if (!base) return;
    const nextVariants = editing
      ? variants
          .map((value) => (value.id === item.id ? item : value))
          .filter((value) => value.baseId === base.id)
      : [...variants.filter((value) => value.baseId === base.id), item];
    productMutation.mutate({ base, nextVariants, editing: true });
  };
  const toggleVariantStatus = (item: ProductVariant) => {
    const base = bases.find((value) => value.id === item.baseId);
    if (!base) return;
    const nextVariants = variants
      .filter((value) => value.baseId === base.id)
      .map((value) =>
        value.id === item.id
          ? {
              ...value,
              status: (value.status === "Activo"
                ? "Inactivo"
                : "Activo") as ProductStatus,
            }
          : value,
      );
    // El estado operativo pertenece al producto y a sus presentaciones. Al
    // inactivar la última presentación, el producto completo deja de estar
    // disponible en Inventario, reportes y demás catálogos operativos.
    const nextBase = {
      ...base,
      status: nextVariants.some((variant) => variant.status === "Activo")
        ? "Activo"
        : "Inactivo",
    } as ProductBase;
    statusMutation.mutate({ base: nextBase, nextVariants });
  };

  return { queryClient, navigate, pathname, catalog, products, bases, variants, units, categories, attributes, modal, setModal, roleFilter, setRoleFilter, statusFilter, setStatusFilter, search, setSearch, notice, setNotice, productsPage, setProductsPage, isConfiguration, configurationTab, openCatalog, openConfiguration, notify, refreshCatalog, createAttributeForCategory, refreshProductConsumers, synchronizeAttributeDefinition, syncProductionCatalogProduct, removeProductFromProductionCatalog, warmProductionCatalog, productMutation, statusMutation, deleteProductMutation, unitMutation, deleteUnitMutation, categoryMutation, attributeMutation, filteredBases, orderedBases, pageSize, totalProductPages, currentProductsPage, visibleBases, saveVariant, toggleVariantStatus }
}
