import {
Pencil,
Plus,
Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
ProductCategory
} from "@/features/products/types/product.types";
import { IconButton } from '@/features/products/components/shared';

export function CategoriesSection({
  categories,
  onNew,
  onEdit,
  onDelete,
}: {
  categories: ProductCategory[];
  onNew: () => void;
  onEdit: (category: ProductCategory) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section className="rounded-[10px] border border-border bg-white p-5 shadow-card">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold">Categorías</h1>
          <p className="mt-1 text-xs text-muted">
            Clasifica los productos con una sola categoría.
          </p>
        </div>
        <Button size="sm" onClick={onNew}>
          <Plus className="h-4 w-4" />
          Nueva categoría
        </Button>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left">
          <thead className="bg-[#f7f9fc] text-[11px] uppercase tracking-[.5px] text-muted">
            <tr>
              <th className="border-y border-border px-4 py-2.5">Categoría</th>
              <th className="border-y border-border px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {categories.length ? (
              categories.map((category) => (
                <tr
                  key={category.id}
                  className="border-b border-border text-[13px]"
                >
                  <td className="px-4 py-3 font-medium">{category.name}</td>
                  <td className="px-4 py-3 text-right">
                    <IconButton
                      label="Editar categoría"
                      onClick={() => onEdit(category)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </IconButton>
                    <IconButton
                      label="Eliminar categoría"
                      danger
                      onClick={() => onDelete(category.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconButton>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="p-10 text-center text-sm text-muted">
                  No hay categorías registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
