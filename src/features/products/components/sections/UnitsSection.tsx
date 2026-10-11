import {
Pencil,
Plus,
Search,
Trash2
} from "lucide-react";
import { useMemo,useState } from "react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import type {
Unit
} from "../../types/product.types";
import { IconButton,StatusBadge } from '../shared';

export function UnitsSection({
  units,
  onNew,
  onEdit,
  onDelete,
}: {
  units: Unit[];
  onNew: () => void;
  onEdit: (unit: Unit) => void;
  onDelete: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filteredUnits = useMemo(
    () =>
      units.filter((unit) =>
        `${unit.code} ${unit.description}`
          .toLocaleLowerCase()
          .includes(search.trim().toLocaleLowerCase()),
      ),
    [search, units],
  );
  return (
    <section className="rounded-[10px] border border-border bg-white p-5 shadow-card">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-sm font-semibold">Unidades de Medida</h1>
        <Button size="sm" onClick={onNew}>
          <Plus className="h-4 w-4" />
          Nueva UM
        </Button>
      </header>
      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-9 pl-9"
          placeholder="Buscar por código o descripción…"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left">
          <thead className="bg-[#f7f9fc] text-[11px] uppercase tracking-[.5px] text-muted">
            <tr>
              <th className="border-y border-border px-4 py-2.5">Código</th>
              <th className="border-y border-border px-4 py-2.5">
                Descripción
              </th>
              <th className="border-y border-border px-4 py-2.5">Estado</th>
              <th className="border-y border-border px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filteredUnits.map((unit) => (
              <tr key={unit.id} className="border-b border-border text-[13px]">
                <td className="px-4 py-3 font-mono font-bold text-brand">
                  {unit.code}
                </td>
                <td className="px-4 py-3">{unit.description}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={unit.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <IconButton
                    label="Editar unidad"
                    onClick={() => onEdit(unit)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </IconButton>
                  <IconButton
                    label="Eliminar unidad"
                    danger
                    onClick={() => onDelete(unit.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </IconButton>
                </td>
              </tr>
            ))}
            {!filteredUnits.length && (
              <tr>
                <td colSpan={4} className="p-10 text-center text-sm text-muted">
                  No hay unidades que coincidan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
