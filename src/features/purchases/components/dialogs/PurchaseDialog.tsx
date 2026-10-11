import { Pencil, Plus, X } from 'lucide-react'
import { Fragment, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ProductWizard } from '@/features/products/components/product-wizard'
import { loadCatalog } from '@/features/products/services/product-api.service'
import type { ProductBase, ProductVariant } from '@/features/products/types/product.types'
import {
  createPurchase,
  removePurchaseDocument,
  uploadPurchaseDocument,
  type PurchaseCatalog,
  type UploadedPurchaseDocument,
} from '@/features/purchases/services/purchase-api.service'
import {
  CatalogPicker,
  DateField,
  DraftLine,
  Field,
  money,
  PurchaseDocumentDropzone,
  Select,
  SupplierPicker,
  today,
  variableSubcategoryPrefix,
} from '@/features/purchases/components/shared'

export function PurchaseDialog({
  catalog,
  productsCatalog,
  saving,
  onClose,
  onSave,
}: {
  catalog: PurchaseCatalog
  productsCatalog: Awaited<ReturnType<typeof loadCatalog>>
  saving: boolean
  onClose: () => void
  onSave: (payload: Parameters<typeof createPurchase>[0]) => Promise<void>
}) {
  const [supplierId, setSupplierId] = useState('')
  const [invoice, setInvoice] = useState('')
  const [date, setDate] = useState(today)
  const [receiptDate, setReceiptDate] = useState(today)
  const [currency, setCurrency] = useState<'PEN' | 'USD'>('PEN')
  const [attachments, setAttachments] = useState<UploadedPurchaseDocument[]>([])
  const [uploading, setUploading] = useState(false)
  const [attachmentError, setAttachmentError] = useState('')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lines, setLines] = useState<DraftLine[]>([
    {
      productId: '',
      presentationId: '',
      variableSubcategoryId: '',
      isVariable: false,
      warehouseId: catalog.warehouses[0]?.id ?? '',
      quantity: '',
      price: '',
    },
  ])
  const input = useRef<HTMLInputElement>(null)
  const [inlineVariableIndex, setInlineVariableIndex] = useState<number | null>(null)
  useEffect(() => {
    if (catalog.warehouses[0])
      setLines((current) =>
        current.map((line) =>
          line.warehouseId ? line : { ...line, warehouseId: catalog.warehouses[0].id },
        ),
      )
  }, [catalog.warehouses])
  const total = useMemo(
    () =>
      lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.price || 0), 0),
    [lines],
  )
  const patch = (index: number, value: Partial<DraftLine>) =>
    setLines((current) =>
      current.map((line, position) => (position === index ? { ...line, ...value } : line)),
    )
  const productFor = (line: DraftLine) =>
    catalog.products.find((product) => product.id === line.productId)
  const presentationFor = (line: DraftLine) =>
    productFor(line)?.presentations.find((value) => value.id === line.presentationId)
  const editingVariableLine = inlineVariableIndex === null ? undefined : lines[inlineVariableIndex]
  const editingVariableSubcategory = (catalog.variableSubcategories ?? []).find(
    (subcategory) => subcategory.id === editingVariableLine?.variableSubcategoryId,
  )
  const editingVariableCategory = productsCatalog.categories.find(
    (category) =>
      category.id === editingVariableSubcategory?.category.id ||
      category.name === editingVariableSubcategory?.category.name,
  )
  const editingVariableDefinition = editingVariableCategory?.subcategories.find(
    (subcategory) => subcategory.id === editingVariableSubcategory?.id,
  )
  const variableWizardBase: ProductBase | undefined =
    editingVariableCategory && editingVariableDefinition
      ? {
          id: '',
          code: '',
          name: editingVariableLine?.variableDraft?.name ?? '',
          categoryId: editingVariableCategory.id,
          categoryName: editingVariableCategory.name,
          subcategoryId: editingVariableDefinition.id,
          subcategoryName: editingVariableDefinition.name,
          roles: editingVariableLine?.variableDraft?.roles ?? ['Mercadería'],
          status: 'Activo',
          variantType: 'Básico',
          immediateConsumption: !(
            editingVariableLine?.variableDraft?.roles ?? ['Mercadería']
          ).includes('Insumo'),
          attributes: [
            ...editingVariableCategory.attributes,
            ...editingVariableDefinition.attributes,
          ],
        }
      : undefined
  const variableWizardVariants: ProductVariant[] = editingVariableLine?.variableDraft
    ? [
        {
          id: '',
          baseId: '',
          code: '',
          name: editingVariableLine.variableDraft.name,
          values: editingVariableLine.variableDraft.values,
          unit: editingVariableLine.variableDraft.unit,
          factor: editingVariableLine.variableDraft.factor,
          minimum: editingVariableLine.variableDraft.minimumStock,
          stock: editingVariableLine.variableDraft.stock,
          status: 'Activo',
        },
      ]
    : []
  const uploadAttachment = async (file: File) => {
    if (file.type !== 'application/pdf' || file.size > 10 * 1024 * 1024) {
      setAttachmentError('Adjunta un PDF de máximo 10 MB.')
      return
    }
    setAttachmentError('')
    setUploading(true)
    try {
      const document = await uploadPurchaseDocument(file)
      setAttachments((current) => [...current, document])
    } catch (error) {
      setAttachmentError(error instanceof Error ? error.message : 'No se pudo subir el PDF.')
    } finally {
      setUploading(false)
    }
  }
  const removeAttachment = async (document: UploadedPurchaseDocument) => {
    try {
      await removePurchaseDocument(document.storageKey)
      setAttachments((current) => current.filter((item) => item.storageKey !== document.storageKey))
    } catch (error) {
      setAttachmentError(error instanceof Error ? error.message : 'No se pudo retirar el archivo.')
    }
  }
  const validateBeforeSubmit = () => {
    if (!catalog.suppliers.some((supplier) => supplier.id === supplierId))
      return 'Selecciona un proveedor nacional activo.'
    if (!invoice.trim()) return 'Ingresa el número de comprobante del proveedor.'
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{4}-\d{2}-\d{2}$/.test(receiptDate))
      return 'Ingresa las fechas de compra e ingreso a almacén.'
    for (const line of lines) {
      if (!catalog.warehouses.some((warehouse) => warehouse.id === line.warehouseId))
        return 'Selecciona un almacén activo para cada línea.'
      if (!Number.isFinite(Number(line.quantity)) || Number(line.quantity) <= 0)
        return 'Ingresa una cantidad mayor a cero en cada línea.'
      if (!Number.isFinite(Number(line.price)) || Number(line.price) < 0)
        return 'Ingresa un costo unitario válido en cada línea.'
      if (!line.isVariable) {
        const product = productFor(line)
        if (!product?.presentations.some((presentation) => presentation.id === line.presentationId))
          return 'Completa o selecciona el producto de cada línea.'
        continue
      }
      const variableSubcategory = (catalog.variableSubcategories ?? []).find(
        (subcategory) => subcategory.id === line.variableSubcategoryId,
      )
      if (!variableSubcategory || !line.variableDraft)
        return 'Completa el producto variable de cada línea.'
      const variableDraft = line.variableDraft
      const category = productsCatalog.categories.find(
        (candidate) =>
          candidate.id === variableSubcategory.category.id ||
          candidate.name === variableSubcategory.category.name,
      )
      const subcategory = category?.subcategories.find(
        (candidate) => candidate.id === variableSubcategory.id,
      )
      const missing = [...(category?.attributes ?? []), ...(subcategory?.attributes ?? [])]
        .filter(
          (attribute) =>
            attribute.status !== 'Inactivo' && attribute.definitionStatus !== 'Inactivo',
        )
        .find((attribute) => attribute.required && !variableDraft.values[attribute.id]?.trim())
      if (missing) return `Completa el atributo obligatorio: ${missing.name}.`
      if (
        !productsCatalog.units.some(
          (unit) => unit.code === variableDraft.unit && unit.status === 'Activo',
        )
      )
        return 'Selecciona una unidad de inventario activa para el producto variable.'
    }
    return null
  }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const validationError = validateBeforeSubmit()
    if (validationError) return setFormError(validationError)
    setFormError('')
    setIsSubmitting(true)
    try {
      await onSave({
        supplierId,
        supplierInvoiceNumber: invoice.trim(),
        purchaseDate: date,
        receiptDate,
        currency,
        items: lines.map((line) =>
          line.isVariable
            ? {
                variableSubcategoryId: line.variableSubcategoryId,
                name: line.variableDraft!.name,
                values: line.variableDraft!.values,
                unitCode: line.variableDraft!.unit,
                factor: line.variableDraft!.factor,
                minimumStock: line.variableDraft!.minimumStock,
                roles: line.variableDraft!.roles.map((role) =>
                  role === 'Mercadería'
                    ? 'MERCHANDISE'
                    : role === 'Insumo'
                      ? 'SUPPLY'
                      : 'FINISHED_PRODUCT',
                ),
                warehouseId: line.warehouseId,
                quantity: Number(line.quantity),
                unitPrice: Number(line.price),
              }
            : {
                productId: line.productId,
                presentationId: line.presentationId,
                warehouseId: line.warehouseId,
                quantity: Number(line.quantity),
                unitPrice: Number(line.price),
              },
        ),
        documents: attachments,
      })
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'No se pudo registrar la compra. Inténtalo nuevamente.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <>
      <Dialog
        open
        title="Nueva Compra Nacional"
        onClose={onClose}
        extraWide
        footer={
          <>
            <Button variant="outline" onClick={onClose} disabled={saving || isSubmitting}>
              Cancelar
            </Button>
            <Button
              form="purchase-form"
              type="submit"
              disabled={saving || isSubmitting || uploading}
            >
              {saving || isSubmitting
                ? 'Registrando compra…'
                : uploading
                  ? 'Subiendo PDF…'
                  : 'Registrar Compra'}
            </Button>
          </>
        }
      >
        <form id="purchase-form" onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Proveedor *">
              <SupplierPicker
                suppliers={catalog.suppliers}
                value={supplierId}
                onChange={setSupplierId}
              />
            </Field>
            <Field label="N° Comprobante proveedor *">
              <Input
                required
                placeholder="F001-000123"
                value={invoice}
                onChange={(event) => setInvoice(event.target.value)}
              />
            </Field>
            <DateField label="Fecha de compra *" value={date} onChange={setDate} />
            <DateField
              label="Fecha de ingreso a almacén *"
              value={receiptDate}
              onChange={setReceiptDate}
            />
            <Field label="Moneda *">
              <Select
                value={currency}
                onChange={(event) => setCurrency(event.target.value as 'PEN' | 'USD')}
              >
                <option>PEN</option>
                <option>USD</option>
              </Select>
            </Field>
          </div>
          <section>
            <h3 className="mb-2 text-sm font-semibold">Productos</h3>
            <div className="relative rounded-md border border-border">
              <table className="w-full min-w-[820px] text-left">
                <thead>
                  <tr className="bg-[#f7f9fc] text-[11px] uppercase tracking-[.4px] text-muted">
                    {[
                      'Producto',
                      'Almacén destino',
                      'UM',
                      'Cant.',
                      'Costo unit.',
                      'Subtotal',
                      '',
                    ].map((header) => (
                      <th key={header} className="border-b border-border px-3 py-3 font-semibold">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, index) => (
                    <Fragment key={index}>
                      <tr className="border-b border-border last:border-0">
                        <td className="min-w-[280px] p-2">
                          <div className="relative">
                            <div className="flex items-center gap-1.5">
                              <div className="min-w-0 flex-1">
                                <CatalogPicker
                                  label="producto"
                                  items={[
                                    ...catalog.products.map((product) => ({
                                      id: product.id,
                                      title: product.name,
                                    })),
                                    ...(catalog.variableSubcategories ?? []).map((subcategory) => ({
                                      id: `${variableSubcategoryPrefix}${subcategory.id}`,
                                      title:
                                        line.isVariable &&
                                        line.variableSubcategoryId === subcategory.id &&
                                        line.variableDraft
                                          ? line.variableDraft.name
                                          : subcategory.name,
                                      detail: `Producto variable · ${subcategory.category.name}${subcategory.code ? ` · ${subcategory.code}` : ''}`,
                                    })),
                                  ]}
                                  value={
                                    line.isVariable && line.variableSubcategoryId
                                      ? `${variableSubcategoryPrefix}${line.variableSubcategoryId}`
                                      : line.productId
                                  }
                                  disabled={line.isVariable && Boolean(line.variableDraft)}
                                  onChange={(selection) => {
                                    if (selection.startsWith(variableSubcategoryPrefix)) {
                                      const variableSubcategoryId = selection.slice(
                                        variableSubcategoryPrefix.length,
                                      )
                                      patch(index, {
                                        productId: '',
                                        presentationId: '',
                                        variableSubcategoryId,
                                        variableDraft: undefined,
                                        isVariable: true,
                                      })
                                      setInlineVariableIndex(index)
                                      return
                                    }

                                    patch(index, {
                                      productId: selection,
                                      presentationId:
                                        catalog.products.find((product) => product.id === selection)
                                          ?.presentations[0]?.id ?? '',
                                      variableSubcategoryId: '',
                                      variableDraft: undefined,
                                      isVariable: false,
                                    })
                                    setInlineVariableIndex(null)
                                  }}
                                />
                              </div>
                              {line.isVariable && line.variableSubcategoryId && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setInlineVariableIndex((current) =>
                                      current === index ? null : index,
                                    )
                                  }
                                  aria-label={
                                    inlineVariableIndex === index
                                      ? 'Ocultar atributos del producto variable'
                                      : 'Editar atributos del producto variable'
                                  }
                                  title={
                                    inlineVariableIndex === index
                                      ? 'Ocultar atributos'
                                      : 'Editar atributos'
                                  }
                                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-blue-200 bg-blue-50 text-brand transition hover:bg-blue-100"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <Select
                            value={line.warehouseId}
                            onChange={(event) => patch(index, { warehouseId: event.target.value })}
                          >
                            {catalog.warehouses.map((warehouse) => (
                              <option key={warehouse.id} value={warehouse.id}>
                                {warehouse.name}
                              </option>
                            ))}
                          </Select>
                        </td>
                        <td className="min-w-[190px] p-2">
                          {line.isVariable && line.variableDraft ? (
                            <CatalogPicker
                              label="unidad"
                              items={productsCatalog.units
                                .filter((unit) => unit.status === 'Activo')
                                .map((unit) => ({
                                  id: unit.code,
                                  title: unit.description,
                                  detail: unit.code,
                                }))}
                              value={line.variableDraft.unit}
                              clearSelectionOnInput={false}
                              onChange={(unit) =>
                                patch(index, { variableDraft: { ...line.variableDraft!, unit } })
                              }
                            />
                          ) : (
                            <Input
                              value={
                                line.isVariable
                                  ? ''
                                  : (presentationFor(line)?.unit.description ??
                                    presentationFor(line)?.unit.code ??
                                    '')
                              }
                              readOnly
                              placeholder="UM"
                            />
                          )}
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min="0"
                            value={line.quantity}
                            onFocus={(event) => event.currentTarget.select()}
                            onChange={(event) =>
                              patch(index, {
                                quantity:
                                  event.target.value === '' ? '' : Number(event.target.value),
                              })
                            }
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.price}
                            placeholder="0.00"
                            onFocus={(event) => event.currentTarget.select()}
                            onChange={(event) =>
                              patch(index, {
                                price: event.target.value === '' ? '' : Number(event.target.value),
                              })
                            }
                          />
                        </td>
                        <td className="p-2 text-right font-mono text-sm text-emerald-600">
                          {money(Number(line.quantity || 0) * Number(line.price || 0))}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            aria-label="Quitar producto"
                            onClick={() =>
                              setLines((current) =>
                                current.length === 1
                                  ? current
                                  : current.filter((_, position) => position !== index),
                              )
                            }
                            className="inline-flex h-9 w-12 items-center justify-center rounded-md border border-red-300 bg-red-50 text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                      {inlineVariableIndex === index &&
                        editingVariableLine &&
                        variableWizardBase && (
                          <tr className="border-b border-blue-200 bg-blue-50/60">
                            <td colSpan={7} className="px-2 pb-2">
                              <ProductWizard
                                floating
                                inline
                                item={variableWizardBase}
                                variants={variableWizardVariants}
                                categories={productsCatalog.categories}
                                units={productsCatalog.units}
                                presetSubcategoryId={editingVariableLine.variableSubcategoryId}
                                onClose={() => {
                                  setInlineVariableIndex(null)
                                  if (!editingVariableLine.variableDraft)
                                    patch(index, { isVariable: false, variableSubcategoryId: '' })
                                }}
                                saveLabel="Aplicar atributos"
                                onSave={({ base, variants }) => {
                                  const variant = variants[0]
                                  patch(index, {
                                    variableDraft: {
                                      name: base.name,
                                      values: variant.values,
                                      unit: variant.unit,
                                      factor: variant.factor,
                                      minimumStock: variant.minimum,
                                      stock: variant.stock,
                                      roles: base.roles,
                                    },
                                  })
                                  setInlineVariableIndex(null)
                                }}
                              />
                            </td>
                          </tr>
                        )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() =>
                setLines((current) => [
                  ...current,
                  {
                    productId: '',
                    presentationId: '',
                    variableSubcategoryId: '',
                    isVariable: false,
                    warehouseId: catalog.warehouses[0]?.id ?? '',
                    quantity: '',
                    price: '',
                  },
                ])
              }
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar producto
            </Button>
            <p className="mt-5 border-b border-border pb-5 text-right text-sm">
              <span className="mr-1 font-semibold text-muted">TOTAL:</span>
              <span className="font-mono text-xl font-bold text-emerald-600">
                {currency === 'PEN' ? 'S/ ' : 'USD '}
                {money(total)}
              </span>
            </p>
          </section>
          {formError && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </p>
          )}
          <section>
            <PurchaseDocumentDropzone
              inputRef={input}
              documents={attachments}
              uploading={uploading}
              error={attachmentError}
              onUpload={uploadAttachment}
              onRemove={removeAttachment}
            />
          </section>
        </form>
      </Dialog>
    </>
  )
}
