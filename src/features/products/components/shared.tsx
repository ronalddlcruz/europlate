import { Button } from "../../../components/ui/button";
import { normalizeProductSearch } from "../../../lib/product-search";
import {
loadCatalog
} from "../services/product-api.service";
import type {
AttributeDefinition,
ProductBase,
ProductCategory,
ProductRole,
ProductStatus,
ProductSubcategory,
ProductVariant,
Unit
} from "../types/product.types";

export const ENABLE_PRODUCT_DELETION = true;

export type Modal =
  | { type: "base"; item?: ProductBase; readOnly?: boolean }
  | { type: "variant"; item?: ProductVariant; baseId?: string }
  | { type: "unit"; item?: Unit }
  | { type: "category"; item?: ProductCategory; editing?: boolean }
  | { type: "subcategory"; category: ProductCategory; item: ProductSubcategory }
  | { type: "attribute"; item?: AttributeDefinition; editing?: boolean }
  | null;

export type CatalogData = Awaited<ReturnType<typeof loadCatalog>>;

export const roles: ProductRole[] = ["Mercadería", "Insumo", "Producto terminado"];

export const badge: Record<ProductRole, string> = {
  Mercadería: "bg-emerald-100 text-emerald-700",
  Insumo: "bg-amber-100 text-amber-700",
  "Producto terminado": "bg-violet-100 text-violet-700",
};

export const roleAbbreviation: Record<ProductRole, string> = {
  Mercadería: "MER",
  Insumo: "INS",
  "Producto terminado": "TER",
};

export const newId = () => crypto.randomUUID();

export const unitCode = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 4)
    .toUpperCase();

export const normalizeSearch = normalizeProductSearch;

export const productNameWithCategory = (base: ProductBase) => {
  const category = base.categoryName?.trim();
  if (!category) return base.name;
  return normalizeSearch(base.name).startsWith(normalizeSearch(category))
    ? base.name
    : `${category} · ${base.name}`;
};

export function StatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${status === "Activo" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
    >
      {status}
    </span>
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

export function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="h-10 w-full rounded-md border border-border bg-[#f4f7fb] px-3 text-sm outline-none focus:border-brand focus:bg-white focus:ring-1 focus:ring-brand"
      {...props}
    >
      {children}
    </select>
  );
}

export function Filter({
  values,
  active,
  onChange,
}: {
  values: string[];
  active: string;
  onChange: (value: string) => void;
}) {
  return (
    <>
      {values.map((value) => (
        <Button
          key={value}
          variant={active === value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(value)}
        >
          {value}
        </Button>
      ))}
    </>
  );
}

export function Metric({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  tone: "blue" | "slate" | "green" | "amber";
}) {
  const colors = {
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    green: "border-emerald-100 bg-emerald-50 text-emerald-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
  };
  return (
    <div className={`px-4 py-3.5 ${colors[tone]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[.55px]">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-ink">{value}</p>
      <p className="mt-1 text-[11px] opacity-80">{detail}</p>
    </div>
  );
}

export function ActionGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-border bg-white shadow-sm">
      {children}
    </div>
  );
}

export function IconButton({
  children,
  label,
  danger,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`inline-flex h-8 w-9 items-center justify-center transition-colors first:rounded-l-md last:rounded-r-md ${danger ? "border-l border-red-200 bg-red-50 text-red-600 hover:bg-red-100" : "text-slate-600 hover:bg-slate-50 hover:text-brand"}`}
    >
      {children}
    </button>
  );
}
