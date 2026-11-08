import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'

type PickerItem = { id: string; name: string; code?: string | null }

export function ClassificationPicker({
  items,
  value,
  placeholder,
  disabled,
  onChange,
}: {
  items: PickerItem[]
  value: string
  placeholder: string
  disabled?: boolean
  onChange: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = items.find((item) => item.id === value)
  const filtered = items.filter((item) =>
    `${item.name} ${item.code ?? ''}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  )

  useEffect(() => {
    setQuery(selected?.name ?? '')
  }, [selected?.name])
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
        setQuery(selected?.name ?? '')
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [selected?.name])

  return (
    <div ref={ref} className="relative">
      <div
        className={`flex h-11 items-center rounded-md border bg-white px-3 transition ${disabled ? 'cursor-not-allowed border-border bg-slate-50 text-slate-400' : open ? 'border-brand ring-1 ring-brand' : 'border-border hover:border-blue-200'}`}
      >
        <Search className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
        <input
          disabled={disabled}
          value={query}
          onFocus={() => {
            if (!open) setQuery('')
            setOpen(true)
          }}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!open) setQuery('')
            setOpen((current) => !current)
          }}
          aria-label={`Mostrar ${placeholder}`}
          className="ml-2 text-slate-400 disabled:cursor-not-allowed"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-white shadow-panel">
          <p className="border-b border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-[.4px] text-muted">
            Resultados · {filtered.length}
          </p>
          <div className="max-h-56 overflow-y-auto">
            {filtered.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => {
                  onChange(item.id)
                  setOpen(false)
                }}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-blue-50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink">{item.name}</span>
                  {item.code && (
                    <span className="mt-0.5 block text-xs text-muted">{item.code}</span>
                  )}
                </span>
              </button>
            ))}
            {!filtered.length && (
              <p className="p-4 text-center text-sm text-muted">No se encontraron resultados.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
