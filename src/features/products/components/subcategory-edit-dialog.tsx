import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Dialog } from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import type {
AttributeDefinition,
ProductCategory,
ProductStatus,
ProductSubcategory
} from "../types/product.types";
import { AssociationList,AttributePicker,Field,toConfigured } from './category-dialog-fields';

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
              code: item.code ?? null,
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
