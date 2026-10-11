import {
Pencil,
Plus
} from "lucide-react";
import { useRef,useState } from "react";
import { Button } from "../../../components/ui/button";
import { Dialog } from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import type {
AttributeDefinition,
ProductBase,
ProductCategory,
ProductSubcategory
} from "../types/product.types";
import { AssociationList,AttributePicker,Field,freshSubcategory,toConfigured,uid } from './category-dialog-fields';
import { SubcategoryEditDialog } from './subcategory-edit-dialog';

export function CategoryConfigurationDialog({
  item,
  definitions,
  products = [],
  onCreateAttribute,
  onClose,
  onSave,
}: {
  item?: ProductCategory;
  definitions: AttributeDefinition[];
  products?: ProductBase[];
  onCreateAttribute: (attribute: Omit<AttributeDefinition, "id">) => Promise<AttributeDefinition>;
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
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickType, setQuickType] = useState<AttributeDefinition["type"]>("Texto");
  const [quickSuffix, setQuickSuffix] = useState("");
  const [quickWeight, setQuickWeight] = useState(false);
  const [quickError, setQuickError] = useState("");
  const [quickSaving, setQuickSaving] = useState(false);
  const quickSavingRef = useRef(false);
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
  const createQuickAttribute = async () => {
    if (quickSavingRef.current) return;
    const name = quickName.trim();
    if (!name) {
      setQuickError("Escribe el nombre del atributo.");
      return;
    }
    const existing = definitions.find((definition) =>
      definition.name.trim().localeCompare(name, undefined, { sensitivity: "accent" }) === 0,
    );
    if (existing) {
      if (existing.status === "Inactivo") {
        setQuickError("Este atributo ya existe, pero está inactivo. Reactívalo desde Atributos.");
        return;
      }
      addCommon(existing);
      setQuickOpen(false);
      setQuickName("");
      setQuickType("Texto");
      setQuickSuffix("");
      setQuickWeight(false);
      setQuickError("");
      return;
    }
    quickSavingRef.current = true;
    setQuickSaving(true);
    setQuickError("");
    try {
      const saved = await onCreateAttribute({
        code: "",
        name,
        type: quickType,
        suffix: quickSuffix.trim(),
        status: "Activo",
        isWeight: quickType === "Numérico" && quickWeight,
      });
      addCommon(saved);
      setQuickOpen(false);
      setQuickName("");
      setQuickType("Texto");
      setQuickSuffix("");
      setQuickWeight(false);
    } catch (reason) {
      setQuickError(reason instanceof Error ? reason.message : "No se pudo crear el atributo. Inténtalo nuevamente.");
    } finally {
      quickSavingRef.current = false;
      setQuickSaving(false);
    }
  };
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
        title={item && !item.id.startsWith("draft-") ? `Editar categoría · ${item.name}` : "Nueva categoría"}
        onClose={() => {
          if (!quickSavingRef.current) onClose();
        }}
        footer={
          <>
            <Button variant="outline" onClick={onClose} disabled={quickSaving}>
              Cancelar
            </Button>
            <Button form="category-config" type="submit" disabled={quickSaving}>
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
          <section className="space-y-4">
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
            <Field label="Descripción">
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
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-slate-50/70 px-4 py-3">
              <div><h3 className="text-sm font-semibold">Atributos comunes</h3><p className="mt-1 text-xs text-muted">Los heredan todos los tipos de esta categoría.</p></div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={quickSaving}
                aria-expanded={quickOpen}
                onClick={() => {
                  setQuickOpen((value) => !value);
                  setQuickError("");
                }}
              >
                <Plus className="h-4 w-4" />
                Crear atributo
              </Button>
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
              {quickOpen && (
                <div
                  className="mt-3 rounded-lg border border-blue-200 bg-blue-50/40 p-4"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && event.target instanceof HTMLInputElement && event.target.type !== "checkbox") {
                      event.preventDefault();
                      void createQuickAttribute();
                    }
                  }}
                >
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-ink">Nuevo atributo</p>
                    <p className="mt-0.5 text-xs text-muted">El atributo queda en el catálogo de inmediato. Su asociación se confirma al guardar la categoría.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Nombre *">
                      <Input autoFocus value={quickName} maxLength={80} onChange={(event) => { setQuickName(event.target.value); setQuickError(""); }} placeholder="Ej. Gramaje" disabled={quickSaving} />
                    </Field>
                    <Field label="Tipo de dato">
                      <select value={quickType} onChange={(event) => { const type = event.target.value as AttributeDefinition["type"]; setQuickType(type); if (type !== "Numérico") setQuickWeight(false); }} disabled={quickSaving} className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-brand">
                        <option>Texto</option><option>Numérico</option>
                      </select>
                    </Field>
                    <Field label="Unidad / sufijo">
                      <Input value={quickSuffix} maxLength={20} onChange={(event) => setQuickSuffix(event.target.value)} placeholder="Ej. kg, g, lb" disabled={quickSaving} />
                    </Field>
                    <label className="flex items-center gap-2 self-end rounded-md border border-border bg-white px-3 py-2.5 text-xs text-slate-700">
                      <input type="checkbox" checked={quickWeight} disabled={quickSaving || quickType !== "Numérico"} onChange={(event) => setQuickWeight(event.target.checked)} className="h-4 w-4 accent-brand" />
                      Usar como peso en fórmula
                    </label>
                  </div>
                  {quickError && <p role="alert" className="mt-3 text-xs text-red-700">{quickError}</p>}
                  <div className="mt-3 flex justify-end gap-2">
                    <Button type="button" size="sm" variant="ghost" disabled={quickSaving} onClick={() => setQuickOpen(false)}>Cancelar</Button>
                    <Button type="button" size="sm" disabled={quickSaving} onClick={() => void createQuickAttribute()}>{quickSaving ? "Guardando…" : "Guardar y asociar"}</Button>
                  </div>
                </div>
              )}
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
                className="bg-brand text-white hover:bg-blue-700 md:col-span-2"
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
