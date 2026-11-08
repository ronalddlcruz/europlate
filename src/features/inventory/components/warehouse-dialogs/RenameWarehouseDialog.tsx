import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { Warehouse } from '@/features/inventory/services/inventory-api.service'

type Props = {
  warehouse: Warehouse
  saving: boolean
  onClose: () => void
  onSave: (name: string) => void
}

export function RenameWarehouseDialog({ warehouse, saving, onClose, onSave }: Props) {
  const [name, setName] = useState(warehouse.name)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const nextName = name.trim()
    if (nextName.length < 2 || nextName === warehouse.name || saving) return
    onSave(nextName)
  }

  return (
    <Dialog
      open
      title="Cambiar nombre del almacén"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="rename-warehouse-form"
            disabled={name.trim().length < 2 || name.trim() === warehouse.name || saving}
          >
            {saving ? 'Guardando…' : 'Guardar nombre'}
          </Button>
        </>
      }
    >
      <form id="rename-warehouse-form" onSubmit={submit}>
        <label className="block text-xs font-semibold text-slate-700">
          Nombre del almacén
          <Input
            className="mt-1.5"
            value={name}
            maxLength={120}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <p className="mt-3 text-xs text-muted">
          El almacén conserva su ID, responsable, productos, stock y movimientos.
        </p>
      </form>
    </Dialog>
  )
}
