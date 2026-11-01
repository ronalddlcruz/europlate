import { ChevronDown, Search, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { matchesProductSearch } from '@/lib/product-search'
import {
  type Site,
  type Warehouse,
  type WarehouseResponsible,
} from '@/features/inventory/services/inventory-api.service'

export type WarehousePayload = Omit<Warehouse, 'id' | 'site' | 'responsible'>

export const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()

export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block">
    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.35px] text-slate-600">
      {label}
    </span>
    {children}
  </label>
)

export const Select = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    className="h-10 w-full rounded-md border border-border bg-[#f4f7fb] px-3 text-sm outline-none focus:border-brand focus:bg-white"
    {...props}
  >
    {children}
  </select>
)

function SearchPicker<T>({
  options,
  value,
  onChange,
  getId,
  getLabel,
  getSearchText,
  renderOption,
  placeholder,
  emptyText,
  ariaLabel,
  clearable = false,
}: {
  options: T[]
  value: string
  onChange: (id: string) => void
  getId: (option: T) => string
  getLabel: (option: T) => string
  getSearchText: (option: T) => string
  renderOption: (option: T) => ReactNode
  placeholder: string
  emptyText: string
  ariaLabel: string
  clearable?: boolean
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const selected = options.find((option) => getId(option) === value)
  const selectedLabel = selected ? getLabel(selected) : ''
  const visible = options.filter((option) => matchesProductSearch(getSearchText(option), query))

  useEffect(() => {
    if (!open) setQuery(selectedLabel)
  }, [selectedLabel, open])
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) {
        setOpen(false)
        setQuery(selectedLabel)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [selectedLabel])

  const optionsId = `${ariaLabel.toLocaleLowerCase().replace(/\s+/g, '-')}-options`
  return (
    <div ref={root} className="relative">
      <div
        className={`flex h-10 items-center rounded-md border bg-[#f4f7fb] px-3 transition ${open ? 'border-brand bg-white ring-1 ring-brand' : 'border-border hover:border-blue-200'}`}
      >
        <Search className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
        <input
          value={query}
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-controls={optionsId}
          onFocus={() => {
            setQuery('')
            setOpen(true)
          }}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-slate-400"
        />
        {clearable && value && (
          <button
            type="button"
            onClick={() => {
              onChange('')
              setQuery('')
              setOpen(false)
            }}
            aria-label={`Quitar ${ariaLabel.toLocaleLowerCase()}`}
            className="mr-2 text-slate-400 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setQuery(open ? selectedLabel : '')
            setOpen((current) => !current)
          }}
          aria-label={`Mostrar ${ariaLabel.toLocaleLowerCase()}`}
          className="text-slate-400"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
      {open && (
        <div
          id={optionsId}
          className="absolute z-[70] mt-1 w-full overflow-hidden rounded-md border border-border bg-white shadow-panel"
        >
          <p className="border-b border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-[.4px] text-muted">
            Resultados · {visible.length}
          </p>
          <div className="max-h-56 overflow-y-auto">
            {visible.map((option) => (
              <button
                key={getId(option)}
                type="button"
                onClick={() => {
                  onChange(getId(option))
                  setQuery(getLabel(option))
                  setOpen(false)
                }}
                className="block w-full px-3 py-2.5 text-left hover:bg-blue-50"
              >
                {renderOption(option)}
              </button>
            ))}
            {!visible.length && <p className="p-4 text-center text-sm text-muted">{emptyText}</p>}
          </div>
        </div>
      )}
    </div>
  )
}

export function SitePicker({
  sites,
  value,
  onChange,
}: {
  sites: Pick<Site, 'id' | 'name'>[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <SearchPicker
      options={sites}
      value={value}
      onChange={onChange}
      getId={(site) => site.id}
      getLabel={(site) => site.name}
      getSearchText={(site) => site.name}
      renderOption={(site) => <span className="text-sm font-medium text-ink">{site.name}</span>}
      placeholder="Buscar sede..."
      emptyText="No se encontraron sedes."
      ariaLabel="Sede"
    />
  )
}

export function LocationPicker({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
}: {
  options: string[]
  value: string
  onChange: (value: string) => void
  placeholder: string
  disabled?: boolean
}) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const visible = options.filter((option) => normalize(option).includes(normalize(query)))
  useEffect(() => setQuery(value), [value])
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) {
        setOpen(false)
        setQuery(value)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [value])
  const fieldClass =
    'flex h-10 items-center rounded-md border px-3 ' +
    (disabled
      ? 'cursor-not-allowed border-border bg-slate-100'
      : open
        ? 'border-brand bg-white ring-1 ring-brand'
        : 'border-border bg-[#f4f7fb]')
  return (
    <div ref={root} className="relative">
      <div className={fieldClass}>
        <Search className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
        <input
          disabled={disabled}
          value={query}
          onFocus={() => {
            setQuery('')
            setOpen(true)
          }}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none disabled:cursor-not-allowed"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setQuery(open ? value : '')
            setOpen((current) => !current)
          }}
          aria-label="Mostrar opciones"
        >
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
      </div>
      {open && !disabled && (
        <div className="absolute z-[70] mt-1 w-full overflow-hidden rounded-md border border-border bg-white shadow-panel">
          <p className="border-b border-border px-3 py-2 text-[11px] font-semibold uppercase text-muted">
            Resultados · {visible.length}
          </p>
          <div className="max-h-56 overflow-y-auto">
            {visible.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option)
                  setOpen(false)
                }}
                className="block w-full px-3 py-2.5 text-left text-sm hover:bg-blue-50"
              >
                {option}
              </button>
            ))}
            {!visible.length && (
              <p className="p-4 text-center text-sm text-muted">No se encontraron resultados.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function ResponsiblePicker({
  users,
  value,
  onChange,
  loading,
}: {
  users: WarehouseResponsible[]
  value: string
  onChange: (id: string) => void
  loading: boolean
}) {
  return (
    <SearchPicker
      options={users}
      value={value}
      onChange={onChange}
      getId={(user) => user.id}
      getLabel={(user) => user.name}
      getSearchText={(user) =>
        `${user.name} ${user.email} ${user.roles?.map((entry) => entry.role.name).join(' ') ?? ''}`
      }
      renderOption={(user) => (
        <>
          <span className="block text-sm font-medium text-ink">{user.name}</span>
          <span className="block truncate text-xs text-muted">
            {user.email}
            {user.roles?.length
              ? ` · ${user.roles.map((entry) => entry.role.name).join(', ')}`
              : ''}
          </span>
        </>
      )}
      placeholder="Buscar responsable..."
      emptyText={loading ? 'Cargando usuarios…' : 'No se encontraron usuarios.'}
      ariaLabel="Responsable de almacén"
      clearable
    />
  )
}
