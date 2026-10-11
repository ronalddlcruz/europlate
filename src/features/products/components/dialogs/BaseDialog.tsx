import {
Pencil,
Trash2
} from "lucide-react";
import { useState,type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type {
Attribute,
ProductBase,
ProductRole,
ProductStatus
} from "@/features/products/types/product.types";
import { Field,IconButton,newId,roles,Select } from '@/features/products/components/shared';

export function BaseDialog({
  item,
  onClose,
  onSave,
}: {
  item?: ProductBase;
  onClose: () => void;
  onSave: (item: ProductBase) => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [status, setStatus] = useState<ProductStatus>(item?.status ?? "Activo");
  const [selectedRoles, setSelectedRoles] = useState<ProductRole[]>(
    item?.roles ?? [],
  );
  const [variantType, setVariantType] = useState<ProductBase["variantType"]>(
    item?.variantType ?? "Con variantes",
  );
  const [attributes, setAttributes] = useState<Attribute[]>(
    item?.attributes ?? [],
  );
  const [draft, setDraft] = useState<Attribute>({
    id: "",
    name: "",
    type: "Texto",
    required: false,
    suffix: "",
  });
  const [editingAttribute, setEditingAttribute] = useState<string | null>(null);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !selectedRoles.length) return;
    onSave({
      id: item?.id ?? newId(),
      code: item?.code ?? `PRD-${String(Date.now()).slice(-4)}`,
      name: name.trim(),
      status,
      roles: selectedRoles,
      variantType,
      attributes: variantType === "Básico" ? [] : attributes,
    });
  };
  const saveAttribute = () => {
    if (!draft.name.trim()) return;
    const next = {
      ...draft,
      id: editingAttribute ?? newId(),
      name: draft.name.trim(),
    };
    setAttributes((current) =>
      editingAttribute
        ? current.map((attribute) =>
            attribute.id === editingAttribute ? next : attribute,
          )
        : [...current, next],
    );
    setDraft({ id: "", name: "", type: "Texto", required: false, suffix: "" });
    setEditingAttribute(null);
  };
  return (
    <Dialog
      open
      title={item ? "Editar producto" : "Nuevo producto"}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button form="base-form" type="submit">
            Guardar producto
          </Button>
        </>
      }
    >
      <form id="base-form" onSubmit={submit} className="space-y-6">
        <section>
          <h3 className="mb-1 text-sm font-semibold">1. Identificación</h3>
          <p className="mb-4 text-xs text-muted">
            Nombre, código y estado del producto.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre del producto *" full>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej. Bobina de cartón"
                required
              />
            </Field>
            <Field label="Código">
              <Input
                value={item?.code ?? "Se generará automáticamente"}
                disabled
              />
            </Field>
            <Field label="Estado">
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
              >
                <option>Activo</option>
                <option>Inactivo</option>
              </Select>
            </Field>
          </div>
        </section>
        <section className="border-y border-border py-5">
          <h3 className="mb-1 text-sm font-semibold">
            2. Rol y tipo de producto
          </h3>
          <p className="mb-4 text-xs text-muted">
            Define cómo se usa en el sistema y si tendrá presentaciones.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {roles.map((role) => (
              <label
                key={role}
                className="cursor-pointer rounded-md border border-border p-3 hover:border-brand"
              >
                <span className="flex items-center justify-between text-[13px] font-semibold">
                  {role}
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role)}
                    onChange={() =>
                      setSelectedRoles((current) =>
                        current.includes(role)
                          ? current.filter((value) => value !== role)
                          : [...current, role],
                      )
                    }
                  />
                </span>
                <small className="mt-1 block text-[11px] text-muted">
                  {role === "Mercadería"
                    ? "Se compra nacional o importada."
                    : role === "Insumo"
                      ? "Materia prima de producción."
                      : "Nace de un proceso productivo."}
                </small>
              </label>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">
              Tipo de producto
            </span>
            {(["Con variantes", "Básico"] as const).map((type) => (
              <Button
                key={type}
                type="button"
                size="sm"
                variant={variantType === type ? "default" : "outline"}
                onClick={() => setVariantType(type)}
              >
                {type}
              </Button>
            ))}
          </div>
        </section>
        {variantType === "Con variantes" && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">
                  3. Atributos de las presentaciones
                </h3>
                <p className="mt-1 text-xs text-muted">
                  Se solicitan cuando se crea una variante.
                </p>
              </div>
            </div>
            <div className="grid gap-3 rounded-md border border-border bg-[#f7f9fc] p-3 md:grid-cols-4">
              <Input
                placeholder="ej. Espesor"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
              <Select
                value={draft.type}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    type: e.target.value as Attribute["type"],
                  })
                }
              >
                <option>Texto</option>
                <option>Numérico</option>
              </Select>
              <Input
                placeholder="Sufijo: mm"
                value={draft.suffix}
                onChange={(e) => setDraft({ ...draft, suffix: e.target.value })}
              />
              <Button type="button" variant="outline" onClick={saveAttribute}>
                {editingAttribute
                  ? "Actualizar atributo"
                  : "+ Agregar atributo"}
              </Button>
              <label className="text-xs text-slate-600 md:col-span-4">
                <input
                  className="mr-2"
                  type="checkbox"
                  checked={draft.required}
                  onChange={(e) =>
                    setDraft({ ...draft, required: e.target.checked })
                  }
                />
                Atributo obligatorio
              </label>
            </div>
            <div className="mt-3 space-y-2">
              {attributes.map((attribute) => (
                <div
                  key={attribute.id}
                  className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm"
                >
                  <span className="flex-1 font-medium">
                    {attribute.name}{" "}
                    {attribute.required && (
                      <em className="not-italic text-red-600">*</em>
                    )}
                  </span>
                  <span className="text-xs text-muted">
                    {attribute.type}
                    {attribute.suffix && ` · ${attribute.suffix}`}
                  </span>
                  <IconButton
                    label="Editar atributo"
                    onClick={() => {
                      setDraft(attribute);
                      setEditingAttribute(attribute.id);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </IconButton>
                  <IconButton
                    label="Eliminar atributo"
                    danger
                    onClick={() =>
                      setAttributes((current) =>
                        current.filter((value) => value.id !== attribute.id),
                      )
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </IconButton>
                </div>
              ))}
            </div>
          </section>
        )}
      </form>
    </Dialog>
  );
}
