import { useState,type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type {
ProductBase,
ProductStatus,
ProductVariant,
Unit
} from "@/features/products/types/product.types";
import { Field,newId,Select } from '@/features/products/components/shared';

export function VariantDialog({
  item,
  base,
  units,
  onClose,
  onSave,
}: {
  item?: ProductVariant;
  base: ProductBase;
  units: Unit[];
  onClose: () => void;
  onSave: (item: ProductVariant) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(
    item?.values ?? {},
  );
  const [unit, setUnit] = useState(item?.unit ?? units[0]?.code ?? "UND");
  const [factor, setFactor] = useState(item?.factor ?? 1);
  const [minimum, setMinimum] = useState(item?.minimum ?? 0);
  // Se conserva para no sobrescribir el valor histórico al editar una presentación.
  const [stock] = useState(item?.stock ?? 0);
  const [status, setStatus] = useState<ProductStatus>(item?.status ?? "Activo");
  const name = [
    base.name,
    ...base.attributes.map((attribute) =>
      values[attribute.id]
        ? `${values[attribute.id]}${attribute.suffix ?? ""}`
        : "",
    ),
  ]
    .filter(Boolean)
    .join(" ");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (
      base.attributes.some(
        (attribute) => attribute.required && !values[attribute.id],
      )
    )
      return;
    onSave({
      id: item?.id ?? newId(),
      code: item?.code ?? `VAR-${String(Date.now()).slice(-4)}`,
      baseId: base.id,
      values,
      name,
      unit,
      factor,
      minimum,
      stock,
      status,
    });
  };
  return (
    <Dialog
      open
      title={item ? "Editar variante" : `Nueva variante · ${base.name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button form="variant-form" type="submit">
            Guardar variante
          </Button>
        </>
      }
    >
      <form
        id="variant-form"
        onSubmit={submit}
        className="grid gap-4 md:grid-cols-2"
      >
        <Field label="Código">
          <Input value={item?.code ?? "Se generará automáticamente"} disabled />
        </Field>
        <Field label="Producto">
          <Input value={base.name} disabled />
        </Field>
        {base.attributes.length > 0 && (
          <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
            {base.attributes.map((attribute) => (
              <Field
                key={attribute.id}
                label={`${attribute.name}${attribute.required ? " *" : ""}`}
              >
                <Input
                  required={attribute.required}
                  type={attribute.type === "Numérico" ? "number" : "text"}
                  value={values[attribute.id] ?? ""}
                  onChange={(e) =>
                    setValues((current) => ({
                      ...current,
                      [attribute.id]: e.target.value,
                    }))
                  }
                  placeholder={attribute.name}
                />
              </Field>
            ))}
          </div>
        )}
        <Field label="Nombre generado" full>
          <Input value={name} disabled />
        </Field>
        <Field label="UM de inventario *">
          <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
            {units
              .filter((value) => value.status === "Activo")
              .map((value) => (
                <option key={value.id} value={value.code}>
                  {value.code} — {value.description}
                </option>
              ))}
          </Select>
        </Field>
        <Field label="Factor de conversión">
          <Input
            type="number"
            min="0.001"
            step="0.001"
            value={factor}
            onChange={(e) => setFactor(Number(e.target.value))}
          />
        </Field>
        <Field label="Stock mínimo">
          <Input
            type="number"
            min="0"
            value={minimum}
            onChange={(e) => setMinimum(Number(e.target.value))}
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
      </form>
    </Dialog>
  );
}
