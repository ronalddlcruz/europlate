

export function SimpleTable({ headers, rows, loading, empty }: { headers: string[]; rows: string[][]; loading: boolean; empty: string }) {
  return <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[850px] text-left"><thead><tr className="bg-[#f7f9fc] text-[11px] uppercase tracking-[.45px] text-muted">{headers.map(header => <th className="border-y border-border px-4 py-3" key={header}>{header}</th>)}</tr></thead><tbody>{loading ? <tr><td colSpan={headers.length} className="p-10 text-center text-sm text-muted">Cargando…</td></tr> : rows.length ? rows.map((row, index) => <tr className="border-b border-border text-[13px]" key={index}>{row.map((value, position) => <td className="px-4 py-3" key={position}>{value}</td>)}</tr>) : <tr><td colSpan={headers.length} className="p-10 text-center text-sm text-muted">{empty}</td></tr>}</tbody></table></div>
}
