import { type ExchangeRate } from '@/features/settings/services/exchange-rate-api.service';

export const amount = (rate: ExchangeRate) => Number(rate.value)

export const date = (rate: ExchangeRate) => rate.effectiveDate.slice(0, 10)

export const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="block"><span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.4px] text-slate-600">{label}</span>{children}</label>

export function Mini({ children, danger, onClick }: { children: React.ReactNode; danger?: boolean; onClick: () => void }) { return <button onClick={onClick} className={`ml-1 inline-flex h-7 w-7 items-center justify-center rounded border ${danger ? 'border-red-200 bg-red-50 text-red-600' : 'border-border bg-white text-slate-600'}`}>{children}</button> }
