import { AttributeDataType, Prisma, PrismaClient, ProductRoleType, ProductStatus, ProductVariantType } from '@prisma/client'
import dotenv from 'dotenv'
import { randomUUID } from 'node:crypto'

dotenv.config()
dotenv.config({ path: 'prisma/.env', override: false })

const prisma = new PrismaClient()
type Key = keyof typeof definitions
type Row = {
  category: string
  subcategory: string
  unit: string
  values: Record<string, string>
  /** Cantidad visible que entrega la empresa en su unidad de inventario. */
  stock?: number
  /** Unidades físicas contenidas por la unidad de inventario. */
  factor?: number
}
const definitions = {
  ancho: { code: 'ANCHO', name: 'Ancho', type: AttributeDataType.NUMBER, suffix: 'mm' }, largo: { code: 'LARGO', name: 'Largo', type: AttributeDataType.NUMBER, suffix: 'mm' },
  formato: { code: 'FORMATO', name: 'Formato', type: AttributeDataType.TEXT, suffix: '' },
  gramaje: { code: 'GRAMAJE', name: 'Gramaje', type: AttributeDataType.NUMBER, suffix: 'g/m²' }, calibre: { code: 'CALIBRE', name: 'Calibre', type: AttributeDataType.TEXT, suffix: '' },
  contenido: { code: 'CONTENIDO', name: 'Contenido', type: AttributeDataType.TEXT, suffix: '' }, paquetes: { code: 'PAQUETES', name: 'Paquetes por paleta', type: AttributeDataType.NUMBER, suffix: 'paquetes' },
  micras: { code: 'MICRAS', name: 'Micras', type: AttributeDataType.NUMBER, suffix: 'micras' }, metros: { code: 'METROS', name: 'Metros', type: AttributeDataType.NUMBER, suffix: 'm' },
  tipo: { code: 'TIPO', name: 'Tipo', type: AttributeDataType.TEXT, suffix: '' }, espesor: { code: 'ESPESOR', name: 'Espesor', type: AttributeDataType.NUMBER, suffix: 'mm' },
  detalle: { code: 'DETALLE', name: 'Detalle', type: AttributeDataType.TEXT, suffix: '' }, referencia: { code: 'REFERENCIA', name: 'Referencia', type: AttributeDataType.TEXT, suffix: '' },
} as const
const dims = (value: string) => { const [ancho, largo] = value.replace(/,/g, '.').split(/\s*[Xx×]\s*/); return { Ancho: ancho.trim(), Largo: largo?.trim() ?? '' } }
const format = (value: string, unit: 'cm' | 'mm') => ({ Formato: `${value.replace(/\s*[Xx×]\s*/g, ' × ')} ${unit}` })
const productName = (subcategory: string, attributeNames: string[], values: Record<string, string>, definitionMap: Map<string, { type: AttributeDataType; suffix: string }>) => {
  const groups: { numeric: boolean; suffix: string; values: string[] }[] = []
  for (const name of attributeNames) {
    const value = values[name]?.trim()
    if (!value) continue
    const definition = definitionMap.get(name)
    const suffix = definition?.suffix.trim() ?? ''
    const numeric = definition?.type === AttributeDataType.NUMBER
    const previous = groups[groups.length - 1]
    if (numeric && suffix && previous?.numeric && previous.suffix === suffix) previous.values.push(value)
    else groups.push({ numeric, suffix, values: [value] })
  }
  const specifications = groups.map(group => group.values.map(value => `${value}${group.suffix ? ` ${group.suffix}` : ''}`).join(' x '))
  return [subcategory, ...specifications].join(' · ')
}
const rows: Row[] = []
const add = (category: string, subcategory: string, unit: string, values: Record<string, string>, stock = 1, factor = 1) => rows.push({ category, subcategory, unit, values, stock, factor })

// Insumos generales proporcionados.
add('Cartulina', 'Escolar', 'PAQUETE', { ...dims('650 X 500'), Gramaje: '140', Contenido: '250 Pliegos', 'Paquetes por paleta': '44' }, 1, 250)
add('Papel Adhesivo', 'P2', 'PAQUETE', { ...dims('1000 X 700'), Gramaje: '177', Contenido: '100 Pliegos', 'Paquetes por paleta': '62' }, 1, 100)
add('Papel Adhesivo', 'P3', 'PAQUETE', { ...dims('1000 X 700'), Gramaje: '200', Contenido: '100 Pliegos', 'Paquetes por paleta': '60' }, 1, 100)
;[['Corrugado','1000 X 700','100 Pliegos','10'],['Microcorrugado','1000 X 700','100 Pliegos','10'],['Corrugado','1200 X 10000','Rollo',''],['Microcorrugado','1200 X 10000','Rollo','']].forEach(([type, measure, content, packs]) => add('Cartón', type, content === 'Rollo' ? 'ROLLO' : 'PAQUETE', { ...dims(measure), Contenido: content, ...(packs ? { 'Paquetes por paleta': packs } : {}) }, 1, content === 'Rollo' ? 1 : 100))
add('Herramientas', 'Cuchillas', 'ROLLO', { ...dims('0.71 X 23.80'), Contenido: '100 m', Referencia: 'CFDB-D52' }, 1, 100)
add('Cintas', 'Embalaje', 'ROLLO', { Tipo: '120 yardas', Contenido: '100 metros', 'Paquetes por paleta': '12' }, 1, 100)
add('Vasos', '8 Onzas', 'MILLAR', { Tipo: '8 onzas', Contenido: '25 vasos', 'Paquetes por paleta': '1' }, 1, 1000)
;[['A4','210 X 297','2500 hojas','96'],['Oficio','216 X 330','2500 hojas','94'],['A3','420 X 297','2000 hojas','90']].forEach(([type, measure, content, packs]) => add('Papel', `Bond ${type}`, 'CAJA', { ...format(measure, 'mm'), Gramaje: '75', Contenido: content, 'Paquetes por paleta': packs }, 1, Number(content.split(' ')[0])))
add('Plástico', 'LLDPE Stretch Film', 'PAQUETE', { Ancho: '450', Metros: '50', Contenido: '4 rollos' }, 1, 4)
;[['Revelador','CTCP','18 L'],['Goma','Sintética CTCP','18 L'],['Wash','Prego','18 L'],['Cola','Sintética','5 L']].forEach(([type, detail, content]) => add('Químicos', type, type === 'Cola' ? 'BALDE' : 'GALON', { Tipo: detail, Contenido: content }))
;[['Grueso','ASA Blanca','20 kg','8020'],['Delgado','ASA Negro','20 kg','7030'],['Sectorizado','Sectorizado','5 kg','370']].forEach(([type, detail, content, ref]) => add('Barnices', type, type === 'Sectorizado' ? 'BALDE' : 'GALON', { Tipo: detail, Contenido: content, Referencia: ref }))
;[['20','Personal'],['25','Mediana'],['30','Mediana'],['35','Mediana'],['40','Familiar'],['45','Extra grande']].forEach(([size, type]) => add('Cajas', 'Pizza', 'CAJA', { ...format(`${size} X ${size}`, 'cm'), Tipo: type, Contenido: '12 unidades' }, 1, 12))

// Plástico mate y gloss.
const plasticWidths = [33,35,43,45,47,50,60,61,65,70,71]
plasticWidths.forEach(width => { add('Plástico', 'Mate 20 micras', 'BOBINA', { Ancho: String(width), Micras: '20', Metros: '3000' }); add('Plástico', 'Gloss 17 micras', 'BOBINA', { Ancho: String(width), Micras: '17', Metros: '3000' }) })
;[50,60,65,70].forEach(width => add('Plástico', 'Mate 19 micras', 'BOBINA', { Ancho: String(width), Micras: '19', Metros: '4000' }))
add('Plástico', 'Gloss 19 micras', 'BOBINA', { Ancho: '70', Micras: '19', Metros: '3000' })

// Papel: Foldcote, Duplex, Couche y Bond.
;[['Foldcote','10/190','39'],['Foldcote Bobina','12/205','30'],['Foldcote','14/235','27'],['Foldcote Bobina','16/255','22'],['Foldcote','18/290','20'],['Foldcote','20/305','17'],['Foldcote','22/345','17'],['Foldcote','24/350','20'],['Foldcote Bobina','22/345','17'],['Duplex','12/205','30'],['Duplex','16/270','30'],['Duplex','20/310','30']].forEach(([type, spec, packs]) => { const [calibre, gramaje] = spec.split('/'); add('Papel', type, 'PAQUETE', { ...format('70 X 100', 'cm'), Calibre: calibre, Gramaje: gramaje, Contenido: '100 Pliegos', 'Paquetes por paleta': packs }, 1, 100) })
;[['61 X 86','90','500','22'],['61 X 86','115','250','40'],['69 X 89','115','250','40'],['72 X 102','115','250','40'],['61 X 86','150','250','30'],['69 X 89','150','250','30'],['72 X 102','150','250','30'],['61 X 86','200','125','40'],['69 X 89','200','125','40'],['72 X 102','200','125','40'],['69 X 89','250','100','30'],['61 X 86','300','100','28'],['69 X 89','300','100','28'],['72 X 102','300','100','28'],['69 X 89','350','100','24'],['72 X 102','350','100','23']].forEach(([measure, gramaje, content, packs]) => add('Papel', 'Couche Brillo', 'PAQUETE', { ...format(measure, 'cm'), Gramaje: gramaje, Contenido: `${content} Pliegos`, 'Paquetes por paleta': packs }, 1, Number(content)))
;[['Bond','61 X 86','58','500','24'],['Bond','69 X 89','58','500','24'],['Bond','72 X 102','58','500','24'],['Bond','61 X 86','75','500','19'],['Bond','69 X 89','75','500','19'],['Bond','72 X 102','75','500','19'],['Bond Bobina','72 X 102','75','500','20'],['Bond','61 X 86','95','500','15'],['Bond','69 X 89','95','500','15'],['Bond','72 X 102','95','500','15'],['Bond','61 X 86','120','250','26'],['Bond','69 X 89','120','250','26'],['Bond','72 X 102','120','250','26']].forEach(([type, measure, gramaje, content, packs]) => add('Papel', type, 'PAQUETE', { ...format(measure, 'cm'), Gramaje: gramaje, Contenido: `${content} Pliegos`, 'Paquetes por paleta': packs }, 1, Number(content)))

// Placas CTP Thermal y CTCP UV.
const plateFormats = ['1030 X 820','1030 X 800','1030 X 790','1030 X 770','975 X 730','840 X 690','775 X 685','745 X 675','745 X 660','745 X 605','745 X 557','730 X 600','724 X 615','720 X 586','720 X 557','650 X 550','645 X 508','525 X 459','521 X 415','510 X 400','445 X 406','254 X 388','254 X 388']
plateFormats.forEach((measure, index) => { const thin = index >= 17; const detail = index === 21 ? 'SIN PERFORAR' : index === 22 ? 'PERFORADA' : ''; const units = thin ? 100 : 50; add('Placas', 'CTP Thermal', 'CAJA', { ...dims(measure), Tipo: ['THERMAL', detail].filter(Boolean).join(' '), Espesor: thin ? '0.15' : '0.30', Contenido: `${units} unidades` }, 1, units); add('Placas', 'CTCP UV', 'CAJA', { ...dims(measure), Tipo: ['UV', detail].filter(Boolean).join(' '), Espesor: thin ? '0.15' : '0.30', Contenido: `${units} unidades` }, 1, units) })

const categoryBlueprints: { name: string; code: string; attributes: Key[]; subcategories: { name: string; code: string; extra?: Key[] }[] }[] = [
  { name: 'Cartulina', code: 'CAR', attributes: ['ancho','largo','gramaje','contenido','paquetes'], subcategories: [{ name: 'Escolar', code: 'ESC' }] },
  { name: 'Papel Adhesivo', code: 'PAD', attributes: ['ancho','largo','gramaje','contenido','paquetes'], subcategories: [{ name: 'P2', code: 'P2' },{ name: 'P3', code: 'P3' }] },
  { name: 'Cartón', code: 'CTN', attributes: ['ancho','largo','contenido','paquetes'], subcategories: [{ name: 'Corrugado', code: 'COR' },{ name: 'Microcorrugado', code: 'MIC' }] },
  { name: 'Herramientas', code: 'HER', attributes: ['ancho','largo','contenido','referencia'], subcategories: [{ name: 'Cuchillas', code: 'CUC' }] },
  { name: 'Cintas', code: 'CIN', attributes: ['tipo','contenido','paquetes'], subcategories: [{ name: 'Embalaje', code: 'EMB' }] }, { name: 'Vasos', code: 'VAS', attributes: ['tipo','contenido','paquetes'], subcategories: [{ name: '8 Onzas', code: '8OZ' }] },
  { name: 'Papel', code: 'PAP', attributes: ['formato','gramaje','calibre','contenido','paquetes'], subcategories: [{ name: 'Bond A4', code: 'A4' },{ name: 'Bond Oficio', code: 'OFC' },{ name: 'Bond A3', code: 'A3' },{ name: 'Foldcote', code: 'FOL' },{ name: 'Foldcote Bobina', code: 'FOB' },{ name: 'Duplex', code: 'DUP' },{ name: 'Couche Brillo', code: 'COU' },{ name: 'Bond', code: 'BON' },{ name: 'Bond Bobina', code: 'BOB' }] },
  { name: 'Plástico', code: 'PLA', attributes: ['ancho','micras','metros','contenido'], subcategories: [{ name: 'LLDPE Stretch Film', code: 'STR' },{ name: 'Mate 20 micras', code: 'M20' },{ name: 'Mate 19 micras', code: 'M19' },{ name: 'Gloss 17 micras', code: 'G17' },{ name: 'Gloss 19 micras', code: 'G19' }] },
  { name: 'Químicos', code: 'QMC', attributes: ['tipo','contenido'], subcategories: [{ name: 'Revelador', code: 'REV' },{ name: 'Goma', code: 'GOM' },{ name: 'Wash', code: 'WAS' },{ name: 'Cola', code: 'COL' }] }, { name: 'Barnices', code: 'BAR', attributes: ['tipo','contenido','referencia'], subcategories: [{ name: 'Grueso', code: 'GRU' },{ name: 'Delgado', code: 'DEL' },{ name: 'Sectorizado', code: 'SEC' }] },
  { name: 'Cajas', code: 'CAJ', attributes: ['formato','tipo','contenido'], subcategories: [{ name: 'Pizza', code: 'PIZ' }] }, { name: 'Placas', code: 'PLC', attributes: ['ancho','largo','tipo','espesor','contenido'], subcategories: [{ name: 'CTP Thermal', code: 'THM' },{ name: 'CTCP UV', code: 'UV' }] },
]

async function main() {
  console.log('Iniciando seed de catálogo…')
  const firstUser = await prisma.user.findFirst({ select: { id: true, companyId: true } })
  if (!firstUser) throw new Error('No se encontró una cuenta de usuario; se preservan las credenciales y se cancela el seed.')
  const units = [['PLIEGO','Pliego'],['PAQUETE','Paquete'],['ROLLO','Rollo'],['BOBINA','Bobina'],['CAJA','Caja'],['GALON','Galón'],['BALDE','Balde'],['MILLAR','Millar'],['UND','Unidad']] as const
  const unitMap = new Map<string, { id: string; code: string; description: string }>(units.map(([code, description]) => [code, { id: randomUUID(), code, description }]))
  const definitionMap = new Map<string, { id: string; name: string; type: AttributeDataType; suffix: string; code: string }>(Object.values(definitions).map(definition => [definition.name, { id: randomUUID(), name: definition.name, type: definition.type, suffix: definition.suffix, code: definition.code }]))
  const categories = new Map<string, { id: string; code: string; attributes: string[]; subcategories: Map<string, { id: string; code: string; attributes: string[] }> }>()
  const categoryRows: Prisma.CategoryCreateManyInput[] = []
  const categoryAttributes: Prisma.CategoryAttributeCreateManyInput[] = []
  const subcategoryRows: Prisma.SubcategoryCreateManyInput[] = []
  for (const blueprint of categoryBlueprints) {
    const categoryId = randomUUID()
    const attributeNames = blueprint.attributes.map(key => definitions[key].name)
    const subcategories = new Map<string, { id: string; code: string; attributes: string[] }>()
    categoryRows.push({ id: categoryId, code: blueprint.code, name: blueprint.name, status: ProductStatus.ACTIVE })
    categoryAttributes.push(...attributeNames.map((name, position) => {
      const attribute = definitionMap.get(name)!
      return { id: randomUUID(), categoryId, attributeDefinitionId: attribute.id, name, dataType: attribute.type, suffix: attribute.suffix, required: false, status: ProductStatus.ACTIVE, position }
    }))
    for (const subcategory of blueprint.subcategories) {
      const id = randomUUID()
      const attributes = (subcategory.extra ?? []).map(key => definitions[key].name)
      subcategoryRows.push({ id, categoryId, code: subcategory.code, name: subcategory.name, status: ProductStatus.ACTIVE, isVariable: true })
      subcategories.set(subcategory.name, { id, code: subcategory.code, attributes })
    }
    categories.set(blueprint.name, { id: categoryId, code: blueprint.code, attributes: attributeNames, subcategories })
  }
  const warehouseId = randomUUID()
  const counters = new Map<string, number>()
  const products: Prisma.ProductCreateManyInput[] = []
  const productAttributes: Prisma.ProductAttributeCreateManyInput[] = []
  const presentations: Prisma.ProductPresentationCreateManyInput[] = []
  const stocks: Prisma.StockCreateManyInput[] = []
  const movements: Prisma.InventoryMovementCreateManyInput[] = []
  for (const row of rows) {
    const category = categories.get(row.category)
    const subcategory = category?.subcategories.get(row.subcategory)
    if (!category || !subcategory) throw new Error(`Catálogo inválido: no existe la categoría o subcategoría para ${row.category} / ${row.subcategory}.`)
    const counterKey = `${category.code}-${subcategory.code}`
    const number = (counters.get(counterKey) ?? 0) + 1
    counters.set(counterKey, number)
    const code = `${counterKey}-${String(number).padStart(3, '0')}`
    const attributeNames = [...category.attributes, ...subcategory.attributes]
    const name = productName(row.subcategory, attributeNames, row.values, definitionMap)
    const roles = row.category === 'Cajas' ? [ProductRoleType.FINISHED_PRODUCT] : row.category === 'Vasos' ? [ProductRoleType.MERCHANDISE] : [ProductRoleType.SUPPLY]
    const factor = new Prisma.Decimal(row.factor ?? 1)
    const currentStock = new Prisma.Decimal(row.stock ?? 0)
    const productId = randomUUID()
    const presentationId = randomUUID()
    const values: Record<string, string> = {}
    products.push({ id: productId, code, name, categoryId: category.id, subcategoryId: subcategory.id, roles, status: ProductStatus.ACTIVE, variantType: ProductVariantType.BASIC, immediateConsumption: false })
    for (const [position, attributeName] of attributeNames.entries()) {
      const attribute = definitionMap.get(attributeName)!
      const id = randomUUID()
      values[id] = row.values[attributeName] ?? ''
      productAttributes.push({ id, productId, name: attributeName, dataType: attribute.type, suffix: attribute.suffix, required: Boolean(row.values[attributeName]), status: ProductStatus.ACTIVE, position })
    }
    presentations.push({ id: presentationId, productId, code: `${code}-01`, name, unitId: unitMap.get(row.unit)!.id, attributeValues: values as Prisma.InputJsonValue, factor, minimumStock: new Prisma.Decimal(0), currentStock, status: ProductStatus.ACTIVE })
    const physicalQuantity = currentStock.mul(factor)
    stocks.push({ productId, warehouseId, quantity: physicalQuantity })
    movements.push({ productId, presentationId, warehouseId, createdByUserId: firstUser.id, type: 'INITIAL_STOCK', quantity: physicalQuantity, reference: code, note: 'Stock inicial cargado desde el inventario entregado por la empresa.' })
  }
  await prisma.$transaction(async db => {
    // Se preservan exclusivamente empresa, usuarios, sesiones, roles y permisos.
    await db.auditLog.deleteMany()
    await db.exchangeRate.deleteMany()
    await db.productionMaterial.deleteMany()
    await db.productionOrder.deleteMany()
    await db.inventoryAdjustment.deleteMany()
    await db.stockTransfer.deleteMany()
    await db.inventoryMovement.deleteMany()
    await db.stock.deleteMany()
    await db.importDocument.deleteMany()
    await db.importItem.deleteMany()
    await db.import.deleteMany()
    await db.purchaseDocument.deleteMany()
    await db.purchaseItem.deleteMany()
    await db.purchase.deleteMany()
    await db.productIdentifier.deleteMany()
    await db.product.deleteMany()
    await db.warehouse.deleteMany()
    await db.supplier.deleteMany()
    await db.customer.deleteMany()
    await db.customsAgent.deleteMany()
    await db.brand.deleteMany()
    await db.category.deleteMany()
    await db.attributeDefinition.deleteMany()
    await db.unit.deleteMany()
    await db.unit.createMany({ data: [...unitMap.values()].map(unit => ({ ...unit, status: ProductStatus.ACTIVE })) })
    await db.attributeDefinition.createMany({ data: [...definitionMap.values()].map(({ type, ...attribute }) => ({ ...attribute, dataType: type, status: ProductStatus.ACTIVE, isWeight: false })) })
    await db.category.createMany({ data: categoryRows })
    await db.categoryAttribute.createMany({ data: categoryAttributes })
    await db.subcategory.createMany({ data: subcategoryRows })
    await db.warehouse.create({ data: { id: warehouseId, companyId: firstUser.companyId, name: 'Almacén Principal', description: 'Existencias iniciales entregadas por la empresa.', status: ProductStatus.ACTIVE } })
    await db.product.createMany({ data: products })
    await db.productAttribute.createMany({ data: productAttributes })
    await db.productPresentation.createMany({ data: presentations })
    await db.stock.createMany({ data: stocks })
    await db.inventoryMovement.createMany({ data: movements })
  }, { maxWait: 10_000, timeout: 30_000 })
  console.log(`Seed completado: ${rows.length} productos con categorías, subcategorías, atributos y stock actual. Usuarios preservados.`)
}
main().catch(error => { console.error(error); process.exitCode = 1 }).finally(() => prisma.$disconnect())
