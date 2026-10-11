import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type {
ProductStatus,
Unit
} from "@/features/products/types/product.types";
import { Field,newId,Select,unitCode } from '@/features/products/components/shared';

export function UnitDialog({
  item,
  onClose,
  onSave,
}: {
  item?: Unit;
  onClose: () => void;
  onSave: (item: Unit) => void;
}) {
  const [description, setDescription] = useState(item?.description ?? "");
  const [status, setStatus] = useState<ProductStatus>(item?.status ?? "Activo");
  const code = item?.code ?? unitCode(description);
  return (
    <Dialog
      open
      title={item ? "Editar unidad de medida" : "Nueva unidad de medida"}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button form="unit-form" type="submit">
            Guardar
          </Button>
        </>
      }
    >
      <form
        id="unit-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (description.trim())
            onSave({
              id: item?.id ?? newId(),
              code,
              description: description.trim(),
              status,
            });
        }}
        className="space-y-4"
      >
        <Field label="Descripción *">
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="ej. Kilogramo, Metro, Balde"
            required
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
