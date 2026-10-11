import {
Plus,
Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter,Metric,roles } from '@/features/products/components/shared';
import { GroupedProductsTable } from '@/features/products/components/tables/GroupedProductsTable';
import { useProductsController } from '@/features/products/hooks/useProductsController';

export function ProductsCatalogPage({ model }: { model: ReturnType<typeof useProductsController> }) {
  const { catalog, bases, variants, units, categories, setModal, roleFilter, setRoleFilter, statusFilter, setStatusFilter, search, setSearch, setProductsPage, deleteProductMutation, orderedBases, pageSize, totalProductPages, currentProductsPage, visibleBases, toggleVariantStatus } = model
  return ((
        <section className="rounded-xl border border-border bg-white p-6 shadow-card">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h1 className="text-sm font-semibold">Maestro de Productos</h1>
              <p className="mt-1 text-xs text-muted">
                Gestiona los productos, sus presentaciones y variantes.
              </p>
            </div>
            <Button size="sm" onClick={() => setModal({ type: "base" })}>
              <Plus className="h-4 w-4" />
              Nuevo producto
            </Button>
          </header>
          <div className="mt-5 grid divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
            <Metric
              label="Total de productos"
              value={orderedBases.length}
              detail="Según los filtros aplicados"
              tone="blue"
            />
            <Metric
              label="Categorías"
              value={categories.length}
              detail="Categorías visibles"
              tone="slate"
            />
            <Metric
              label="Productos activos"
              value={
                orderedBases.filter((base) => base.status === "Activo").length
              }
              detail="Disponibles para operar"
              tone="green"
            />
            <Metric
              label="Productos inactivos"
              value={
                orderedBases.filter((base) => base.status === "Inactivo").length
              }
              detail="Fuera de operaciones"
              tone="amber"
            />
          </div>
          <div className="mt-5 flex flex-col gap-4 rounded-xl border border-slate-200 bg-[#f8fafc] p-3.5 xl:flex-row xl:items-end">
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.4px] text-slate-500">
                Tipo de producto
              </p>
              <div className="flex flex-wrap gap-2">
                <Filter
                  values={["Todos", ...roles]}
                  active={roleFilter}
                  onChange={(value) => {
                    setRoleFilter(value as typeof roleFilter);
                    setProductsPage(1);
                  }}
                />
              </div>
            </div>
            <div className="min-w-0 xl:border-l xl:border-slate-200 xl:pl-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.4px] text-slate-500">
                Estado
              </p>
              <div className="flex gap-2">
                <Filter
                  values={["Todos", "Activo", "Inactivo"]}
                  active={statusFilter}
                  onChange={(value) => {
                    setStatusFilter(value as typeof statusFilter);
                    setProductsPage(1);
                  }}
                />
              </div>
            </div>
            <div className="relative w-full xl:ml-auto xl:max-w-[330px]">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.4px] text-slate-500">
                Buscar
              </p>
              <Search className="absolute left-3 top-[35px] h-4 w-4 text-muted" />
              <Input
                className="h-10 bg-white pl-9"
                placeholder="Buscar producto, categoría, subcategoría o medida..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setProductsPage(1);
                }}
              />
            </div>
          </div>
          {catalog.isLoading ? (
            <p className="py-10 text-center text-sm text-muted">
              Cargando catálogo desde la base de datos…
            </p>
          ) : catalog.isError ? (
            <p className="py-10 text-center text-sm text-red-600">
              No se pudo cargar el catálogo desde la base de datos.
            </p>
          ) : (
            <>
              <GroupedProductsTable
                bases={visibleBases}
                variants={variants}
                units={units}
                onEditBase={(item) => setModal({ type: "base", item })}
                onViewBase={(item) => setModal({ type: "base", item, readOnly: true })}
                onEditVariant={(variant) => {
                  const base = bases.find((item) => item.id === variant.baseId);
                  if (base) setModal({ type: "base", item: base });
                }}
                onToggleVariant={toggleVariantStatus}
                onDeleteProduct={(base) => {
                  if (window.confirm(`¿Eliminar físicamente el producto ${base.name}? Esta acción solo será posible si no tiene operaciones registradas.`)) deleteProductMutation.mutate(base.id);
                }}
              />
              {orderedBases.length > pageSize && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted">
                  <span>
                    Mostrando {(currentProductsPage - 1) * pageSize + 1}–
                    {Math.min(
                      currentProductsPage * pageSize,
                      orderedBases.length,
                    )}{" "}
                    de {orderedBases.length} productos
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentProductsPage === 1}
                      onClick={() =>
                        setProductsPage((page) => Math.max(1, page - 1))
                      }
                    >
                      Anterior
                    </Button>
                    <span className="font-medium text-ink">
                      Página {currentProductsPage} de {totalProductPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentProductsPage === totalProductPages}
                      onClick={() =>
                        setProductsPage((page) =>
                          Math.min(totalProductPages, page + 1),
                        )
                      }
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      ))
}
