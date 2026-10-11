import {
Boxes,
Layers3,
Pencil,
Plus,
Search
} from "lucide-react";
import { useMemo,useState } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import type {
ConfiguredAttribute,
ProductCategory,
ProductStatus,
ProductSubcategory
} from "../types/product.types";
const statusStyle = (status: ProductStatus) =>
  status === "Activo"
    ? "bg-emerald-100 text-emerald-700"
    : "bg-slate-100 text-slate-600";

export function CategoryConfiguration({
  categories,
  onNew,
  onEdit,
  onEditSubcategory,
}: {
  categories: ProductCategory[];
  onNew: () => void;
  onEdit: (category: ProductCategory) => void;
  onEditSubcategory: (
    category: ProductCategory,
    subcategory: ProductSubcategory,
  ) => void;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [subcategoryType, setSubcategoryType] = useState<
    "Todas" | "Variables" | "Estándar"
  >("Todas");
  const ordered = useMemo(
    () =>
      [...categories].sort((left, right) =>
        left.name.localeCompare(right.name),
      ),
    [categories],
  );
  const filteredCategories = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return ordered.flatMap((category) => {
      const typedSubcategories = category.subcategories.filter(
        (subcategory) =>
          subcategoryType === "Todas" ||
          (subcategoryType === "Variables"
            ? subcategory.isVariable
            : !subcategory.isVariable),
      );
      if (!term) {
        return typedSubcategories.length || subcategoryType === "Todas"
          ? [{ category, subcategories: typedSubcategories }]
          : [];
      }
      const categoryMatches = `${category.name} ${category.code ?? ""} ${category.description ?? ""}`.toLocaleLowerCase().includes(term);
      const matchingSubcategories = typedSubcategories.filter((subcategory) =>
        `${subcategory.name} ${subcategory.code ?? ""} ${subcategory.description ?? ""}`.toLocaleLowerCase().includes(term),
      );
      return (categoryMatches && (typedSubcategories.length || subcategoryType === "Todas")) || matchingSubcategories.length
        ? [{ category, subcategories: categoryMatches ? typedSubcategories : matchingSubcategories }]
        : [];
    });
  }, [ordered, search, subcategoryType]);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleCategories = filteredCategories.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-border bg-white px-5 py-4 shadow-card">
        <div>
          <h1 className="text-sm font-semibold">Categorías y Subcategorías</h1>
          <p className="mt-1 text-xs text-muted">
            Organiza los tipos de producto y los atributos que heredan.
          </p>
        </div>
        <Button size="sm" onClick={onNew}>
          <Plus className="h-4 w-4" />
          Nueva categoría
        </Button>
      </header>
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.4px] text-slate-500">
            Tipos de producto
          </p>
          <div className="flex flex-wrap gap-2">
            {(["Todas", "Variables", "Estándar"] as const).map((type) => (
              <Button
                key={type}
                size="sm"
                variant={subcategoryType === type ? "default" : "outline"}
                onClick={() => {
                  setSubcategoryType(type);
                  setPage(1);
                }}
              >
                {type === "Variables" ? "Productos variables" : type}
              </Button>
            ))}
          </div>
        </div>
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="h-10 bg-white pl-9"
            placeholder="Buscar categoría o subcategoría…"
          />
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-blue-100 bg-white shadow-[0_8px_24px_rgba(37,99,235,0.07)]">
        <table className="w-full min-w-[920px] border-collapse text-left">
          <thead>
            <tr className="bg-[#eef6ff] text-[11px] uppercase tracking-[.5px] text-slate-500">
              <th className="border-b border-blue-100 px-5 py-3.5 font-semibold">
                Categoría
              </th>
              <th className="border-b border-blue-100 px-4 py-3.5 font-semibold">
                Código
              </th>
              <th className="border-b border-blue-100 px-4 py-3.5 font-semibold">
                Atributos comunes
              </th>
              <th className="border-b border-blue-100 px-4 py-3.5 font-semibold">
                Subcategoría / Tipo
              </th>
              <th className="border-b border-blue-100 px-4 py-3.5 font-semibold">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleCategories.length ? (
              visibleCategories.flatMap(({ category, subcategories: visibleSubcategories }) => {
                const subcategories = visibleSubcategories.length
                  ? visibleSubcategories
                  : [null];
                const rowSpan = subcategories.length;
                return subcategories.map((subcategory, index) => (
                  <tr
                    key={subcategory?.id ?? category.id}
                    className="group border-b border-slate-100 text-[13px] transition-colors hover:bg-[#f8fbff]"
                  >
                    {index === 0 && (
                      <>
                        <td
                          rowSpan={rowSpan}
                          className="w-[235px] border-r border-slate-100 border-l-4 border-l-blue-500 bg-[#fbfdff] px-5 align-middle"
                        >
                          <div className="flex items-start gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-100 text-blue-600">
                              <Boxes className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => onEdit(category)}
                                  className="truncate font-semibold text-ink transition hover:text-brand hover:underline"
                                  title="Editar categoría"
                                >
                                  {category.name}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onEdit(category)}
                                  className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-blue-600 opacity-0 transition hover:bg-blue-50 group-hover:opacity-100 focus:opacity-100"
                                  aria-label={`Editar categoría ${category.name}`}
                                  title="Editar categoría"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <span
                                className="mt-1 block truncate text-xs text-muted"
                                title={category.description || undefined}
                              >
                                {category.description || "Sin descripción"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td
                          rowSpan={rowSpan}
                          className="border-r border-slate-100 bg-[#fbfdff] px-4 align-middle font-mono text-[11px] font-bold text-blue-700"
                        >
                          {category.code || "—"}
                        </td>
                        <td
                          rowSpan={rowSpan}
                          className="w-[220px] border-r border-slate-100 bg-[#fbfdff] px-4 align-middle"
                        >
                          <CompactAttributes
                            attributes={category.attributes}
                            empty="Sin atributos"
                          />
                        </td>
                      </>
                    )}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="grid h-6 w-6 place-items-center rounded-md bg-blue-50 text-blue-600">
                          <Layers3 className="h-3.5 w-3.5" />
                        </span>
                        {subcategory ? (
                          <button
                            type="button"
                            onClick={() =>
                              onEditSubcategory(category, subcategory)
                            }
                            className="font-medium text-ink transition hover:text-brand hover:underline"
                            title="Editar subcategoría"
                          >
                            {subcategory.name}
                          </button>
                        ) : (
                          <span className="text-muted">Sin subcategorías</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {subcategory ? (
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyle(subcategory.status)}`}
                        >
                          {subcategory.status}
                        </span>
                      ) : (
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyle(category.status)}`}
                        >
                          {category.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ));
              })
            ) : (
              <tr>
                <td colSpan={5} className="p-10 text-center text-sm text-muted">
                  No hay categorías o subcategorías que coincidan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {filteredCategories.length > pageSize && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-muted">
          <span>
            Mostrando {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, filteredCategories.length)} de{" "}
            {filteredCategories.length} categorías
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Anterior
            </Button>
            <span className="font-medium text-ink">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() =>
                setPage((value) => Math.min(totalPages, value + 1))
              }
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function CompactAttributes({
  attributes,
  empty,
}: {
  attributes: ConfiguredAttribute[];
  empty: string;
}) {
  return attributes.length ? (
    <div
      className="flex items-center gap-2 text-xs"
      title={attributes
        .map(
          (attribute) =>
            `${attribute.name}${attribute.required ? " (obligatorio)" : ""}`,
        )
        .join(", ")}
    >
      <span className="truncate font-medium text-slate-700">
        {attributes
          .slice(0, 2)
          .map(
            (attribute) => `${attribute.name}${attribute.required ? " *" : ""}`,
          )
          .join(" · ")}
      </span>
      {attributes.length > 2 && (
        <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
          +{attributes.length - 2}
        </span>
      )}
    </div>
  ) : (
    <span className="text-xs text-muted">{empty}</span>
  );
}

export { CategoryConfigurationDialog } from './category-configuration-dialog';
export { SubcategoryEditDialog } from './subcategory-edit-dialog';
