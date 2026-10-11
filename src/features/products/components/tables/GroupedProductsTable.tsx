import {
Pencil,
Power,
Trash2
} from "lucide-react";
import type {
ProductBase,
ProductVariant,
Unit
} from "@/features/products/types/product.types";
import { ActionGroup,badge,IconButton,productNameWithCategory,roleAbbreviation,StatusBadge } from '@/features/products/components/shared';

export function GroupedProductsTable({
  bases,
  variants,
  units,
  onEditBase,
  onViewBase,
  onToggleVariant,
  onDeleteProduct,
}: {
  bases: ProductBase[];
  variants: ProductVariant[];
  units: Unit[];
  onEditBase: (base: ProductBase) => void;
  onViewBase: (base: ProductBase) => void;
  onEditVariant: (variant: ProductVariant) => void;
  onToggleVariant: (variant: ProductVariant) => void;
  onDeleteProduct: (base: ProductBase) => void;
}) {
  const stockFormatter = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 3 });
  return (
    <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[1100px] table-fixed border-collapse text-center">
        <colgroup>
          <col className="w-[118px]" />
          <col className="w-[120px]" />
          <col className="w-[135px]" />
          <col className="w-[118px]" />
          <col />
          <col className="w-[125px]" />
          <col className="w-[100px]" />
          <col className="w-[85px]" />
          <col className="w-[120px]" />
        </colgroup>
        <thead>
          <tr className="bg-[#f5f8fc] text-[11px] uppercase tracking-[.55px] text-slate-500">
            {[
              "Código",
              "Categoría",
              "Subcategoría",
              "Tipo de producto",
              "Producto",
              "Unidad de medida",
              "Stock actual",
              "Estado",
              "",
            ].map((header) => (
              <th
                className="border-b border-slate-200 px-2 py-3.5 text-center font-semibold"
                key={header}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bases.length ? (
            bases.map((base) => {
              const inventory = variants.find(
                (variant) => variant.baseId === base.id,
              );
              const status = inventory?.status ?? base.status;
              return (
                <tr
                  key={base.id}
                  className={`group border-b border-slate-100 text-[13px] transition-colors last:border-0 hover:bg-blue-50/40 ${status === "Inactivo" ? "bg-slate-50/70 text-slate-400" : "text-slate-700"}`}
                >
                  <td className="whitespace-nowrap px-2 py-3 text-center font-mono text-[10px] font-bold tracking-tight text-brand">
                    {base.code}
                  </td>
                  <td className="px-2 py-3">
                    <span className="inline-flex max-w-full truncate rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      {base.categoryName ?? "Sin categoría"}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-sm font-medium text-slate-600" title={base.subcategoryName ?? "General"}>
                    <span className="block truncate">{base.subcategoryName ?? "General"}</span>
                  </td>
                  <td className="px-1 py-3">
                    <span className="flex flex-nowrap items-center justify-center gap-0.5 whitespace-nowrap">
                      {base.roles.map((role) => (
                        <span
                          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${badge[role]}`}
                          key={role}
                          title={role}
                        >
                          {base.roles.length >= 2
                            ? roleAbbreviation[role]
                            : role === "Producto terminado"
                              ? "P. terminado"
                              : role}
                        </span>
                      ))}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <button
                      onClick={() => onViewBase(base)}
                      className="w-full text-center"
                      title={productNameWithCategory(base)}
                    >
                      <span className="block truncate font-semibold text-ink group-hover:text-brand">
                        {productNameWithCategory(base)}
                      </span>
                    </button>
                  </td>
                  <td className="px-2 py-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                      {units.find((unit) => unit.code === inventory?.unit)
                        ?.description ?? inventory?.unit ?? "—"}
                    </span>
                    {inventory && inventory.factor !== 1 && (
                      <span className="ml-1.5 font-mono text-[11px] text-slate-500">
                        ×{inventory.factor}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-3 font-mono text-xs font-semibold tabular-nums text-ink">
                    {inventory ? stockFormatter.format(inventory.stock) : "—"}
                  </td>
                  <td className="px-2 py-3">
                    <StatusBadge status={status} />
                  </td>
                  <td className="whitespace-nowrap px-1 py-3 text-center">
                    <ActionGroup>
                      <IconButton
                        label="Editar producto"
                        onClick={() => onEditBase(base)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </IconButton>
                      {inventory && (
                        <IconButton
                          label={
                            status === "Activo"
                              ? "Inhabilitar producto"
                              : "Habilitar producto"
                          }
                          onClick={() => onToggleVariant(inventory)}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </IconButton>
                      )}
                      <IconButton
                        label="Eliminar producto"
                        danger
                        onClick={() => onDeleteProduct(base)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </IconButton>
                    </ActionGroup>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={9} className="p-10 text-center text-sm text-muted">
                No se encontraron productos con los filtros seleccionados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
