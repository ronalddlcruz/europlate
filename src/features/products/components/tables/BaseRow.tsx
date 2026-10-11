import {
ChevronDown,
ChevronRight,
Pencil,
Plus,
Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
ProductBase,
ProductVariant
} from "@/features/products/types/product.types";
import { badge,ENABLE_PRODUCT_DELETION,IconButton,StatusBadge } from '@/features/products/components/shared';

export function BaseRow({
  base,
  variants,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onNewVariant,
  onEditVariant,
  onDeleteVariant,
}: {
  base: ProductBase;
  variants: ProductVariant[];
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onNewVariant: () => void;
  onEditVariant: (variant: ProductVariant) => void;
  onDeleteVariant: (id: string) => void;
}) {
  return (
    <div className="border-b border-border last:border-0">
      <div className="flex items-center gap-2 bg-[#eef4ff] px-3 py-3">
        <button onClick={onToggle} className="text-brand">
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] font-bold text-brand">
            {base.code}
          </p>
          <p className="text-[13px] font-bold">{base.name}</p>
        </div>
        <div className="hidden flex-wrap gap-1 md:flex">
          {base.roles.map((role) => (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge[role]}`}
              key={role}
            >
              {role}
            </span>
          ))}
        </div>
        <StatusBadge status={base.status} />
        <Button size="sm" variant="outline" onClick={onNewVariant}>
          <Plus className="h-3.5 w-3.5" />
          Variante
        </Button>
        <IconButton label="Editar producto" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </IconButton>
        {ENABLE_PRODUCT_DELETION && (
          <IconButton label="Eliminar producto" danger onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </IconButton>
        )}
      </div>
      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead className="bg-[#f7f9fc] text-[10px] uppercase tracking-[.5px] text-muted">
              <tr>
                <th className="px-5 py-2 font-semibold">Código</th>
                <th className="px-3 py-2 font-semibold">Presentación</th>
                <th className="px-3 py-2 font-semibold">Stock</th>
                <th className="px-3 py-2 font-semibold">UM</th>
                <th className="px-3 py-2 font-semibold">Estado</th>
                <th className="px-5 py-2" />
              </tr>
            </thead>
            <tbody>
              {variants.length ? (
                variants.map((variant) => (
                  <tr
                    key={variant.id}
                    className="border-t border-border text-[13px] text-slate-600"
                  >
                    <td className="px-5 py-2.5 font-mono text-[11px] text-brand">
                      {variant.code}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-ink">
                      {variant.name}
                    </td>
                    <td
                      className={`px-3 py-2.5 font-mono ${variant.stock < variant.minimum ? "text-red-600" : "text-emerald-600"}`}
                    >
                      {variant.stock}{" "}
                      <span className="font-sans text-[11px] text-muted">
                        / mín {variant.minimum}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {variant.unit}
                      {variant.factor > 1 && (
                        <span className="ml-1 text-[10px] text-brand">
                          ×{variant.factor} und
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={variant.status} />
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <IconButton
                        label="Editar variante"
                        onClick={() => onEditVariant(variant)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </IconButton>
                      {ENABLE_PRODUCT_DELETION && (
                        <IconButton
                          label="Eliminar variante"
                          danger
                          onClick={() => onDeleteVariant(variant.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </IconButton>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="p-5 text-center text-sm text-muted"
                  >
                    Sin variantes registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
