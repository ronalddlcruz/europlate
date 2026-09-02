export function AppLoadingSkeleton() {
  return <main className="min-h-screen bg-page p-5"><div className="mx-auto max-w-6xl animate-pulse space-y-5"><div className="h-14 rounded-lg bg-slate-200" /><div className="grid gap-4 sm:grid-cols-3">{[1, 2, 3].map(value => <div key={value} className="h-32 rounded-lg bg-slate-200" />)}</div><div className="h-72 rounded-lg bg-slate-200" /></div></main>
}
