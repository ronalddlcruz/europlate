export type ConfigurationTab = 'categories' | 'attributes' | 'units'

const sections: { id: ConfigurationTab; label: string }[] = [
  { id: 'categories', label: 'Categorías y subcategorías' },
  { id: 'attributes', label: 'Atributos' },
  { id: 'units', label: 'Unidades de medida' },
]

export function ProductsNavigation({
  isConfiguration,
  configurationTab,
  onOpenCatalog,
  onOpenConfiguration,
}: {
  isConfiguration: boolean
  configurationTab: ConfigurationTab
  onOpenCatalog: () => void
  onOpenConfiguration: (tab?: ConfigurationTab) => void
}) {
  return <div className="mb-4 overflow-hidden rounded-xl border border-border bg-white shadow-card">
    <nav className="flex min-h-14 gap-6 overflow-x-auto px-4 sm:gap-8 sm:px-6" aria-label="Secciones de productos">
      <button
        type="button"
        onClick={onOpenCatalog}
        aria-current={!isConfiguration ? 'page' : undefined}
        className={`shrink-0 border-b-2 px-1 py-4 text-[13px] transition-colors sm:text-sm ${!isConfiguration ? 'border-brand font-semibold text-ink' : 'border-transparent font-medium text-slate-500 hover:text-ink'}`}
      >Maestro de productos</button>
      <button
        type="button"
        onClick={() => onOpenConfiguration()}
        aria-current={isConfiguration ? 'page' : undefined}
        className={`shrink-0 border-b-2 px-1 py-4 text-[13px] transition-colors sm:text-sm ${isConfiguration ? 'border-brand font-semibold text-ink' : 'border-transparent font-medium text-slate-500 hover:text-ink'}`}
      >Configuración de productos</button>
    </nav>
    {isConfiguration && <nav className="flex items-center gap-3 overflow-x-auto border-t border-slate-100 bg-slate-50/60 px-4 py-2 sm:px-6" aria-label="Apartados de configuración">
      <span className="hidden shrink-0 pr-2 text-[10px] font-semibold uppercase tracking-[.6px] text-slate-400 sm:inline">Configurar</span>
      {sections.map(({ id, label }) => <button
        key={id}
        type="button"
        onClick={() => onOpenConfiguration(id)}
        aria-current={configurationTab === id ? 'page' : undefined}
        className={`shrink-0 rounded-md px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${configurationTab === id ? 'bg-white text-brand shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-white hover:text-ink'}`}
      >{label}</button>)}
    </nav>}
  </div>
}
