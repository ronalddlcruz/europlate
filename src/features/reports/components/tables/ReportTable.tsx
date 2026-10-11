import { Empty } from '../shared';

export function ReportTable({ headers, empty, children }: { headers: string[]; empty: string; children: React.ReactNode }) {
  return <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[860px] text-left"><thead><tr className="bg-[#f7f9fc] text-[11px] uppercase tracking-[.5px] text-muted">{headers.map(header => <th className="border-y border-border px-4 py-2.5" key={header}>{header}</th>)}</tr></thead><tbody>{children || <Empty>{empty}</Empty>}</tbody></table></div>
}
