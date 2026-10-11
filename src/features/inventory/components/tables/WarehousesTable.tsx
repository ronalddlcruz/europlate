import { Pencil,Trash2 } from 'lucide-react';
import { useWarehousesController } from '@/features/inventory/hooks/useWarehousesController';

export function WarehousesTable({ model }: { model: ReturnType<typeof useWarehousesController> }) {
  const { client, session, canManage, warehouses, responsibles, editing, setEditing, modal, setModal, notice, setNotice, notify, sync, save, remove } = model
  return (<table className="w-full min-w-[1080px] text-left">
        <thead><tr className="bg-[#f7f9fc] text-[11px] uppercase tracking-[.45px] text-muted">
          {['Nombre', 'Responsable', 'Departamento', 'Provincia', 'Distrito', 'Calle / dirección', 'Estado', ...(canManage ? [''] : [])].map((value, index) =>
            <th key={value || index} className="border-y border-border px-3 py-3">{value}</th>)}
        </tr></thead>
        <tbody>
          {warehouses.isLoading ? <tr><td colSpan={canManage ? 8 : 7} className="p-10 text-center text-muted">Cargando almacenes…</td></tr>
            : (warehouses.data ?? []).length ? warehouses.data!.map(item => <tr key={item.id} className="border-b border-border text-[13px]">
              <td className="px-3 py-3 font-medium">{item.name}</td>
              <td className="px-3 py-3">{item.responsible?.name ?? 'Sin asignar'}</td>
              <td className="px-3 py-3">{item.department ?? '—'}</td>
              <td className="px-3 py-3">{item.province ?? '—'}</td>
              <td className="px-3 py-3">{item.district ?? '—'}</td>
              <td className="max-w-[250px] px-3 py-3">{item.address ?? item.location ?? '—'}</td>
              <td className="px-3 py-3">{item.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}</td>
              {canManage && <td className="whitespace-nowrap px-3 py-3 text-right">
                <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded border border-border" aria-label={'Editar ' + item.name}
                  onClick={() => { setEditing(item); setModal(true) }}><Pencil className="h-3.5 w-3.5" /></button>
                <button type="button" disabled={remove.isPending} className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded border border-red-200 bg-red-50 text-red-600 disabled:opacity-50"
                  aria-label={'Eliminar ' + item.name} onClick={() => { if (window.confirm('¿Eliminar el almacén ' + item.name + '?')) remove.mutate(item.id) }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </td>}
            </tr>) : <tr><td colSpan={canManage ? 8 : 7} className="p-10 text-center text-muted">Aún no hay almacenes registrados.</td></tr>}
        </tbody>
      </table>)
}
