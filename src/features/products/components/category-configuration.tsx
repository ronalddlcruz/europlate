import { useEffect, useMemo, useRef, useState } from "react";
import {
  Boxes,
  ChevronDown,
  Layers3,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Dialog } from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import type {
  AttributeDefinition,
  ConfiguredAttribute,
  ProductBase,
  ProductCategory,
  ProductStatus,
  ProductSubcategory,
} from "../types/product.types";

const uid = () => crypto.randomUUID();
const freshSubcategory = (): ProductSubcategory => ({
  id: uid(),
  code: "",
  name: "",
  description: "",
  status: "Activo",
  isVariable: false,
  attributes: [],
});
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
  const ordered = useMemo(
    () =>
      [...categories].sort((left, right) =>
        left.name.localeCompare(right.name),
      ),
    [categories],
  );
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(ordered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleCategories = ordered.slice(
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
                Atributos particulares
              </th>
              <th className="border-b border-blue-100 px-4 py-3.5 font-semibold">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleCategories.length ? (
              visibleCategories.flatMap((category) => {
                const subcategories = category.subcategories.length
                  ? category.subcategories
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
                    <td className="max-w-[240px] px-4 py-3.5">
                      <CompactAttributes
                        attributes={subcategory?.attributes ?? []}
                        empty={subcategory ? "Hereda atributos comunes" : "—"}
                      />
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
                <td colSpan={6} className="p-10 text-center text-sm text-muted">
                  No hay categorías registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {ordered.length > pageSize && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-muted">
          <span>
            Mostrando {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, ordered.length)} de{" "}
            {ordered.length} categorías
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

export function SubcategoryEditDialog({
  category,
  item,
  definitions,
  hasProducts,
  onClose,
  onSave,
}: {
  category: ProductCategory;
  item: ProductSubcategory;
  definitions: AttributeDefinition[];
  hasProducts: boolean;
  onClose: () => void;
  onSave: (subcategory: ProductSubcategory) => void;
}) {
  const [name, setName] = useState(item.name);
  const [code, setCode] = useState(item.code ?? "");
  const [description, setDescription] = useState(item.description ?? "");
  const [status, setStatus] = useState<ProductStatus>(item.status);
  const [isVariable, setIsVariable] = useState(item.isVariable ?? false);
  const [attributes, setAttributes] = useState(item.attributes);
  const add = (definition: AttributeDefinition) =>
    setAttributes((current) =>
      current.some((attribute) => attribute.definitionId === definition.id)
        ? current
        : [...current, toConfigured(definition)],
    );
  const toggleRequired = (id: string) =>
    setAttributes((current) =>
      current.map((attribute) =>
        attribute.id === id
          ? { ...attribute, required: !attribute.required }
          : attribute,
      ),
    );
  const remove = (id: string) =>
    setAttributes((current) =>
      current
        .map((attribute) =>
          attribute.id === id && hasProducts
            ? { ...attribute, status: "Inactivo" as const }
            : attribute,
        )
        .filter((attribute) => attribute.id !== id || hasProducts),
    );
  return (
    <Dialog
      open
      wide
      title={`Editar tipo · ${item.name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button form="subcategory-edit" type="submit">
            Guardar tipo
          </Button>
        </>
      }
    >
      <form
        id="subcategory-edit"
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim())
            onSave({
              ...item,
              name: name.trim(),
              code: code.trim().toUpperCase() || null,
              description: description.trim() || null,
              status,
              isVariable,
              attributes,
            });
        }}
        className="grid gap-5 md:grid-cols-2"
      >
        <div className="rounded-lg border border-blue-100 bg-[#f8fbff] px-4 py-3 md:col-span-2">
          <p className="text-xs font-semibold text-brand">Categoría padre</p>
          <p className="mt-1 text-sm font-medium text-ink">{category.name}</p>
        </div>
        <Field label="Nombre del tipo *">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej. Dúplex"
            required
          />
        </Field>
        <Field label="Código">
          <Input
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="Ej. DUP"
          />
        </Field>
        <Field label="Descripción">
          <Input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Descripción del tipo"
          />
        </Field>
        <Field label="Estado">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as ProductStatus)}
            className="h-10 w-full rounded-md border border-border bg-[#f4f7fb] px-3 text-sm outline-none focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
          >
            <option>Activo</option>
            <option>Inactivo</option>
          </select>
        </Field>
        <label className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-3 text-sm md:col-span-2">
          <input
            type="checkbox"
            checked={isVariable}
            onChange={(event) => setIsVariable(event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-blue-600"
          />
          <span>
            <span className="block font-semibold text-ink">
              Producto variable
            </span>
            <span className="mt-0.5 block text-xs text-muted">
              No se crea en el catálogo. Sus atributos se completarán al
              registrar una compra o importación.
            </span>
          </span>
        </label>
        <div className="border-t border-dashed border-border pt-4 md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[.4px] text-slate-600">
            Atributos particulares
          </p>
          <p className="mt-1 text-xs text-muted">
            {hasProducts
              ? "Como este tipo ya tiene productos, quitar un atributo lo desactiva para proteger el historial."
              : "Puedes marcar un atributo como opcional o quitarlo antes de registrar productos."}
          </p>
          <div className="mt-3">
            <AttributePicker
              definitions={definitions}
              selected={attributes.map(
                (attribute) => attribute.definitionId ?? "",
              )}
              placeholder="Buscar atributo extra…"
              onSelect={add}
            />
            <AssociationList
              attributes={attributes}
              scope="subcategory"
              onToggleRequired={(_scope, id) => toggleRequired(id)}
              onRemove={remove}
            />
          </div>
        </div>
      </form>
    </Dialog>
  );
}

export function CategoryConfigurationDialog({
  item,
  definitions,
  products = [],
  onClose,
  onSave,
}: {
  item?: ProductCategory;
  definitions: AttributeDefinition[];
  products?: ProductBase[];
  onClose: () => void;
  onSave: (category: ProductCategory) => void;
}) {
  const [category, setCategory] = useState<ProductCategory>(
    item ?? {
      id: uid(),
      code: "",
      name: "",
      description: "",
      status: "Activo",
      attributes: [],
      subcategories: [],
    },
  );
  const [subcategory, setSubcategory] = useState(freshSubcategory());
  const [editingSubcategory, setEditingSubcategory] =
    useState<ProductSubcategory | null>(null);
  const addCommon = (definition: AttributeDefinition) =>
    setCategory((current) =>
      current.attributes.some(
        (attribute) => attribute.definitionId === definition.id,
      )
        ? current
        : {
            ...current,
            attributes: [...current.attributes, toConfigured(definition)],
          },
    );
  const addExtra = (definition: AttributeDefinition) =>
    setSubcategory((current) =>
      current.attributes.some(
        (attribute) => attribute.definitionId === definition.id,
      )
        ? current
        : {
            ...current,
            attributes: [...current.attributes, toConfigured(definition)],
          },
    );
  const toggleRequired = (scope: "category" | "subcategory", id: string) =>
    scope === "category"
      ? setCategory((current) => ({
          ...current,
          attributes: current.attributes.map((attribute) =>
            attribute.id === id
              ? { ...attribute, required: !attribute.required }
              : attribute,
          ),
        }))
      : setSubcategory((current) => ({
          ...current,
          attributes: current.attributes.map((attribute) =>
            attribute.id === id
              ? { ...attribute, required: !attribute.required }
              : attribute,
          ),
        }));
  const saveSubcategory = () => {
    if (!subcategory.name.trim()) return;
    setCategory((current) => ({
      ...current,
      subcategories: [
        ...current.subcategories,
        { ...subcategory, name: subcategory.name.trim() },
      ],
    }));
    setSubcategory(freshSubcategory());
  };
  const categoryToSave = () => {
    const pendingSubcategory = subcategory.name.trim()
      ? {
          ...subcategory,
          name: subcategory.name.trim(),
          code: subcategory.code?.trim() || null,
          description: subcategory.description?.trim() || null,
        }
      : null;
    return {
      ...category,
      name: category.name.trim(),
      code: category.code?.trim() || null,
      description: category.description?.trim() || null,
      subcategories: pendingSubcategory
        ? [...category.subcategories, pendingSubcategory]
        : category.subcategories,
    };
  };
  return (
    <>
      <Dialog
        open
        wide
        title={item ? `Editar categoría · ${item.name}` : "Nueva categoría"}
        onClose={onClose}
        footer={
          <>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button form="category-config" type="submit">
              Guardar categoría
            </Button>
          </>
        }
      >
        <form
          id="category-config"
          onSubmit={(event) => {
            event.preventDefault();
            if (category.name.trim()) onSave(categoryToSave());
          }}
          className="space-y-6"
        >
          <section className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre de categoría *">
              <Input
                value={category.name}
                onChange={(event) =>
                  setCategory((value) => ({
                    ...value,
                    name: event.target.value,
                  }))
                }
                placeholder="Ej. Cartón"
                required
              />
            </Field>
            <Field label="Código (opcional)">
              <Input
                value={category.code ?? ""}
                onChange={(event) =>
                  setCategory((value) => ({
                    ...value,
                    code: event.target.value.toUpperCase(),
                  }))
                }
                placeholder="Ej. CART"
              />
            </Field>
            <Field label="Descripción" full>
              <Input
                value={category.description ?? ""}
                onChange={(event) =>
                  setCategory((value) => ({
                    ...value,
                    description: event.target.value,
                  }))
                }
                placeholder="Descripción de la categoría"
              />
            </Field>
          </section>
          <section className="rounded-lg border border-border">
            <header className="border-b border-border bg-[#f8fbff] px-4 py-3">
              <h3 className="text-sm font-semibold">Atributos comunes</h3>
              <p className="mt-1 text-xs text-muted">
                Los heredan todos los tipos de esta categoría.
              </p>
            </header>
            <div className="p-4">
              <AttributePicker
                definitions={definitions}
                selected={category.attributes.map(
                  (attribute) => attribute.definitionId ?? "",
                )}
                placeholder="Buscar atributo para asociar…"
                onSelect={addCommon}
              />
              <AssociationList
                attributes={category.attributes}
                scope="category"
                onToggleRequired={toggleRequired}
                onRemove={(id) =>
                  setCategory((value) => ({
                    ...value,
                    attributes: value.attributes.filter(
                      (attribute) => attribute.id !== id,
                    ),
                  }))
                }
              />
            </div>
          </section>
          <section className="rounded-lg border border-border">
            <header className="border-b border-border bg-[#f8fbff] px-4 py-3">
              <h3 className="text-sm font-semibold">
                Nueva subcategoría / tipo
              </h3>
              <p className="mt-1 text-xs text-muted">
                Hereda los atributos comunes y puede asociar atributos extra.
              </p>
            </header>
            <div className="grid gap-4 p-4 md:grid-cols-2">
              <Field label="Nombre del tipo *">
                <Input
                  value={subcategory.name}
                  onChange={(event) =>
                    setSubcategory((value) => ({
                      ...value,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Ej. Dúplex"
                />
              </Field>
              <Field label="Código">
                <Input
                  value={subcategory.code ?? ""}
                  onChange={(event) =>
                    setSubcategory((value) => ({
                      ...value,
                      code: event.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="Ej. DUP"
                />
              </Field>
              <label className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-3 text-sm md:col-span-2">
                <input
                  type="checkbox"
            checked={subcategory.isVariable ?? false}
                  onChange={(event) =>
                    setSubcategory((value) => ({
                      ...value,
                      isVariable: event.target.checked,
                    }))
                  }
                  className="mt-0.5 h-4 w-4 accent-blue-600"
                />
                <span>
                  <span className="block font-semibold text-ink">
                    Producto variable
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    Los valores de sus atributos se registrarán únicamente
                    durante una compra o importación.
                  </span>
                </span>
              </label>
              <div className="md:col-span-2">
                <AttributePicker
                  definitions={definitions}
                  selected={[
                    ...category.attributes,
                    ...subcategory.attributes,
                  ].map((attribute) => attribute.definitionId ?? "")}
                  placeholder="Buscar atributo extra…"
                  onSelect={addExtra}
                />
              </div>
              <div className="md:col-span-2">
                <AssociationList
                  attributes={subcategory.attributes}
                  scope="subcategory"
                  onToggleRequired={toggleRequired}
                  onRemove={(id) =>
                    setSubcategory((value) => ({
                      ...value,
                      attributes: value.attributes.filter(
                        (attribute) => attribute.id !== id,
                      ),
                    }))
                  }
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="md:col-span-2"
                onClick={saveSubcategory}
              >
                <Plus className="h-4 w-4" />
                Agregar subcategoría
              </Button>
            </div>
            <div className="space-y-2 border-t border-border p-4">
              {category.subcategories.map((value) => (
                <button
                  type="button"
                  key={value.id}
                  onClick={() => setEditingSubcategory(value)}
                  className="flex w-full items-center gap-3 rounded-md border border-border px-3 py-2 text-left transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <span className="flex-1 text-sm font-medium">
                    {value.name}
                  </span>
                  <span className="text-xs text-muted">
                    {value.attributes.length
                      ? value.attributes
                          .map((attribute) => attribute.name)
                          .join(", ")
                      : "Sin atributos extra"}
                  </span>
                  <Pencil className="h-4 w-4 text-brand" />
                </button>
              ))}
            </div>
          </section>
        </form>
      </Dialog>
      {editingSubcategory && (
        <SubcategoryEditDialog
          category={category}
          item={editingSubcategory}
          definitions={definitions}
          hasProducts={products.some(
            (product) => product.subcategoryId === editingSubcategory.id,
          )}
          onClose={() => setEditingSubcategory(null)}
          onSave={(saved) => {
            setCategory((current) => ({
              ...current,
              subcategories: current.subcategories.map((subcategory) =>
                subcategory.id === saved.id ? saved : subcategory,
              ),
            }));
            setEditingSubcategory(null);
          }}
        />
      )}
    </>
  );
}

function AttributePicker({
  definitions,
  selected,
  placeholder,
  onSelect,
}: {
  definitions: AttributeDefinition[];
  selected: string[];
  placeholder: string;
  onSelect: (definition: AttributeDefinition) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const list = definitions.filter(
    (item) =>
      item.status === "Activo" &&
      !selected.includes(item.id) &&
      `${item.code} ${item.name}`.toLowerCase().includes(query.toLowerCase()),
  );
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  return (
    <div ref={ref} className="relative">
      <div
        className={`flex h-11 items-center rounded-md border bg-white px-3 ${open ? "border-brand ring-1 ring-brand" : "border-border"}`}
      >
        <Search className="mr-2 h-4 w-4 text-slate-400" />
        <input
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label="Mostrar atributos"
        >
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-white shadow-panel">
          <p className="border-b border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-[.4px] text-muted">
            Atributos · {list.length} resultado(s)
          </p>
          <div className="max-h-52 overflow-y-auto">
            {list.length ? (
              list.map((definition) => (
                <button
                  type="button"
                  key={definition.id}
                  onClick={() => {
                    onSelect(definition);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-blue-50"
                >
                  <span className="rounded bg-blue-50 px-2 py-1 font-mono text-[10px] font-bold text-brand">
                    {definition.code}
                  </span>
                  <span>
                    <span className="block text-sm font-medium">
                      {definition.name}
                    </span>
                    <span className="text-xs text-muted">
                      {definition.type}
                      {definition.suffix && ` · ${definition.suffix}`}
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <p className="p-4 text-center text-sm text-muted">
                No hay atributos disponibles.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
function AssociationList({
  attributes,
  scope,
  onToggleRequired,
  onRemove,
}: {
  attributes: ConfiguredAttribute[];
  scope: "category" | "subcategory";
  onToggleRequired: (scope: "category" | "subcategory", id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="mt-3 space-y-2">
      {attributes.map((attribute) => (
        <div
          key={attribute.id}
          className="flex flex-wrap items-center gap-3 rounded-md border border-border px-3 py-2 text-sm"
        >
          <Tag className="h-4 w-4 text-brand" />
          <span className="flex-1 font-medium">{attribute.name}</span>
          <span className="text-xs text-muted">
            {attribute.type}
            {attribute.suffix && ` · ${attribute.suffix}`}
          </span>
          {attribute.status === "Inactivo" && (
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
              Inactivo
            </span>
          )}
          <button
            type="button"
            onClick={() => onToggleRequired(scope, attribute.id)}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${attribute.required ? "bg-blue-100 text-brand" : "bg-slate-100 text-slate-600"}`}
          >
            {attribute.required ? "Obligatorio" : "Opcional"}
          </button>
          <button
            type="button"
            onClick={() => onRemove(attribute.id)}
            className="text-red-600"
            aria-label={
              attribute.status === "Inactivo"
                ? `Reactivar o conservar ${attribute.name}`
                : `Quitar ${attribute.name}`
            }
            title={
              attribute.status === "Inactivo"
                ? "Atributo inactivo"
                : `Quitar ${attribute.name}`
            }
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
function AttributeChips({
  label,
  attributes,
}: {
  label: string;
  attributes: ConfiguredAttribute[];
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.4px] text-slate-600">
        <Tag className="h-3.5 w-3.5 text-brand" />
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {attributes.length ? (
          attributes.map((attribute) => (
            <span
              key={attribute.id}
              className="rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-xs"
            >
              {attribute.name}
              {attribute.required && " *"}
            </span>
          ))
        ) : (
          <span className="text-xs text-muted">No configurados.</span>
        )}
      </div>
    </div>
  );
}
function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={full ? "block md:col-span-2" : "block"}>
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.4px] text-slate-600">
        {label}
      </span>
      {children}
    </label>
  );
}
function toConfigured(definition: AttributeDefinition): ConfiguredAttribute {
  return {
    id: uid(),
    definitionId: definition.id,
    name: definition.name,
    type: definition.type,
    suffix: definition.suffix,
    required: false,
    status: definition.status,
  };
}
