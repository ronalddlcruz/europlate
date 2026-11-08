import { Pencil, Settings2, Trash2 } from 'lucide-react'
import { useWarehousesController } from '@/features/inventory/hooks/useWarehousesController'

export function WarehousesTable({ model }: { model: ReturnType<typeof useWarehousesController> }) {
  const { canManage, canEdit, canRename, warehouses, setEditing, setRenaming, setModal, remove } = model
  return (
    <table className="w-full min-w-[1080px] text-left">
      <thead>
        <tr className="bg-[#f7f9fc] text-[11px] uppercase tracking-[.45px] text-muted">
          {[
            'Nombre',
            'Sede',
            'Responsable',
            'Departamento',
            'Provincia',
            'Distrito',
            'Calle / dirección',
            'Estado',
            ...(canRename ? [''] : []),
          ].map((value, index) => (
            <th key={value || index} className="border-y border-border px-3 py-3">
              {value}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {warehouses.isLoading ? (
          <tr>
            <td colSpan={canRename ? 9 : 8} className="p-10 text-center text-muted">
              Cargando almacenes…
            </td>
          </tr>
        ) : (warehouses.data ?? []).length ? (
          warehouses.data!.map((item) => (
            <tr key={item.id} className="border-b border-border text-[13px]">
              <td className="px-3 py-3 font-medium">{item.name}</td>
              <td className="px-3 py-3">{item.site.name}</td>
              <td className="px-3 py-3">{item.responsible?.name ?? 'Sin asignar'}</td>
              <td className="px-3 py-3">{item.department ?? '—'}</td>
              <td className="px-3 py-3">{item.province ?? '—'}</td>
              <td className="px-3 py-3">{item.district ?? '—'}</td>
              <td className="max-w-[250px] px-3 py-3">{item.address ?? item.location ?? '—'}</td>
              <td className="px-3 py-3">{item.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}</td>
              {canRename && (
                <td className="whitespace-nowrap px-3 py-3 text-right">
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded border border-border"
                    aria-label={'Cambiar nombre de ' + item.name}
                    onClick={() => setRenaming(item)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {canEdit && <button
                    type="button"
                    className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded border border-border"
                    aria-label={'Editar datos de ' + item.name}
                    onClick={() => {
                      setEditing(item)
                      setModal(true)
                    }}
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                  </button>}
                  {canManage && <button
                    type="button"
                    disabled={remove.isPending}
                    className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded border border-red-200 bg-red-50 text-red-600 disabled:opacity-50"
                    aria-label={'Eliminar ' + item.name}
                    onClick={() => {
                      if (window.confirm('¿Eliminar el almacén ' + item.name + '?'))
                        remove.mutate(item.id)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>}
                </td>
              )}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={canRename ? 9 : 8} className="p-10 text-center text-muted">
              Aún no hay almacenes registrados.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}
