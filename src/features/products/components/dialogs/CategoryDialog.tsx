import { useState } from "react";
import { Button } from "../../../../components/ui/button";
import { Dialog } from "../../../../components/ui/dialog";
import { Input } from "../../../../components/ui/input";
import type {
ProductCategory
} from "../../types/product.types";
import { Field,newId } from '../shared';

export function CategoryDialog({
  item,
  onClose,
  onSave,
}: {
  item?: ProductCategory;
  onClose: () => void;
  onSave: (item: ProductCategory) => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  return (
    <Dialog
      open
      title={item ? "Editar categoría" : "Nueva categoría"}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button form="category-form" type="submit">
            Guardar categoría
          </Button>
        </>
      }
    >
      <form
        id="category-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim())
            onSave({
              id: item?.id ?? newId(),
              name: name.trim(),
              code: item?.code ?? null,
              description: item?.description ?? null,
              status: item?.status ?? "Activo",
              attributes: item?.attributes ?? [],
              subcategories: item?.subcategories ?? [],
            });
        }}
        className="space-y-4"
      >
        <Field label="Nombre de la categoría *">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej. Cartón y bobinas"
            required
          />
        </Field>
      </form>
    </Dialog>
  );
}
