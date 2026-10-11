import {
ChevronDown,
Search,
Tag,
Trash2
} from "lucide-react";
import { useEffect,useRef,useState } from "react";
import type {
AttributeDefinition,
ConfiguredAttribute,
ProductSubcategory
} from "../types/product.types";

export const uid = () => `draft-${crypto.randomUUID()}`;

export const freshSubcategory = (): ProductSubcategory => ({
  id: uid(),
  name: "",
  description: "",
  status: "Activo",
  isVariable: false,
  attributes: [],
});

export function AttributePicker({
  definitions,
  selected,
  placeholder,
  onSelect,
}: {
  definitions: AttributeDefinition[];
  selected: string[];
  placeholder: string;
  onSelect: (definition: AttributeDefinition) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const list = definitions.filter(
    (item) =>
      item.status === "Activo" &&
      !selected.includes(item.id) &&
      `${item.code} ${item.name}`.toLowerCase().includes(query.toLowerCase()),
  );
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  return (
    <div ref={ref} className="relative">
      <div
        className={`flex h-11 items-center rounded-md border bg-white px-3 ${open ? "border-brand ring-1 ring-brand" : "border-border"}`}
      >
        <Search className="mr-2 h-4 w-4 text-slate-400" />
        <input
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label="Mostrar atributos"
        >
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-white shadow-panel">
          <p className="border-b border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-[.4px] text-muted">
            Atributos · {list.length} resultado(s)
          </p>
          <div className="max-h-52 overflow-y-auto">
            {list.length ? (
              list.map((definition) => (
                <button
                  type="button"
                  key={definition.id}
                  onClick={() => {
                    onSelect(definition);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="flex w-full items-center px-3 py-2.5 text-left hover:bg-blue-50"
                >
                  <span>
                    <span className="block text-sm font-medium">
                      {definition.name}
                    </span>
                    <span className="text-xs text-muted">
                      {definition.type}
                      {definition.suffix && ` · ${definition.suffix}`}
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <p className="p-4 text-center text-sm text-muted">
                No hay atributos disponibles.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AssociationList({
  attributes,
  scope,
  onToggleRequired,
  onRemove,
}: {
  attributes: ConfiguredAttribute[];
  scope: "category" | "subcategory";
  onToggleRequired: (scope: "category" | "subcategory", id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="mt-3 space-y-2">
      {attributes.filter((attribute) => attribute.status !== "Inactivo" && attribute.definitionStatus !== "Inactivo").map((attribute) => (
        <div
          key={attribute.id}
          className="flex flex-wrap items-center gap-3 rounded-md border border-border px-3 py-2 text-sm"
        >
          <Tag className="h-4 w-4 text-brand" />
          <span className="flex-1 font-medium">{attribute.name}</span>
          <span className="text-xs text-muted">
            {attribute.type}
            {attribute.suffix && ` · ${attribute.suffix}`}
          </span>
          {(attribute.status === "Inactivo" || attribute.definitionStatus === "Inactivo") && (
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
              Inactivo
            </span>
          )}
          <button
            type="button"
            onClick={() => onToggleRequired(scope, attribute.id)}
            disabled={attribute.status === "Inactivo" || attribute.definitionStatus === "Inactivo"}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${attribute.required ? "bg-blue-100 text-brand" : "bg-slate-100 text-slate-600"}`}
          >
            {attribute.required ? "Obligatorio" : "Opcional"}
          </button>
          <button
            type="button"
            onClick={() => onRemove(attribute.id)}
            className="text-red-600"
            aria-label={
              attribute.status === "Inactivo" || attribute.definitionStatus === "Inactivo"
                ? `Reactivar o conservar ${attribute.name}`
                : `Quitar ${attribute.name}`
            }
            title={
              attribute.status === "Inactivo" || attribute.definitionStatus === "Inactivo"
                ? "Atributo inactivo"
                : `Quitar ${attribute.name}`
            }
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function AttributeChips({
  label,
  attributes,
}: {
  label: string;
  attributes: ConfiguredAttribute[];
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.4px] text-slate-600">
        <Tag className="h-3.5 w-3.5 text-brand" />
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {attributes.length ? (
          attributes.map((attribute) => (
            <span
              key={attribute.id}
              className="rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-xs"
            >
              {attribute.name}
              {attribute.required && " *"}
            </span>
          ))
        ) : (
          <span className="text-xs text-muted">No configurados.</span>
        )}
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={full ? "block md:col-span-2" : "block"}>
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.4px] text-slate-600">
        {label}
      </span>
      {children}
    </label>
  );
}

export function toConfigured(definition: AttributeDefinition): ConfiguredAttribute {
  return {
    id: uid(),
    definitionId: definition.id,
    name: definition.name,
    type: definition.type,
    suffix: definition.suffix,
    required: false,
    status: definition.status,
    isWeight: definition.isWeight,
  };
}
