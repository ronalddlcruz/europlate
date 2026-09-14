import { AttributeDataType, Prisma, PrismaClient, ProductRoleType, ProductStatus, ProductVariantType } from '@prisma/client'

const prisma = new PrismaClient()
type Key = keyof typeof definitions
type Row = { category: string; subcategory: string; unit: string; values: Record<string, string>; stock?: number }
const definitions = {
  ancho: { code: 'ANCHO', name: 'Ancho', type: AttributeDataType.NUMBER, suffix: 'mm' }, largo: { code: 'LARGO', name: 'Largo', type: AttributeDataType.NUMBER, suffix: 'mm' },
  gramaje: { code: 'GRAMAJE', name: 'Gramaje', type: AttributeDataType.NUMBER, suffix: 'g/m²' }, calibre: { code: 'CALIBRE', name: 'Calibre', type: AttributeDataType.TEXT, suffix: '' },
  contenido: { code: 'CONTENIDO', name: 'Contenido', type: AttributeDataType.TEXT, suffix: '' }, paquetes: { code: 'PAQUETES', name: 'Paquetes por paleta', type: AttributeDataType.NUMBER, suffix: 'paquetes' },
  micras: { code: 'MICRAS', name: 'Micras', type: AttributeDataType.NUMBER, suffix: 'micras' }, metros: { code: 'METROS', name: 'Metros', type: AttributeDataType.NUMBER, suffix: 'm' },
  tipo: { code: 'TIPO', name: 'Tipo', type: AttributeDataType.TEXT, suffix: '' }, espesor: { code: 'ESPESOR', name: 'Espesor', type: AttributeDataType.NUMBER, suffix: 'mm' },
  detalle: { code: 'DETALLE', name: 'Detalle', type: AttributeDataType.TEXT, suffix: '' }, referencia: { code: 'REFERENCIA', name: 'Referencia', type: AttributeDataType.TEXT, suffix: '' },
} as const
const dims = (value: string) => { const [ancho, largo] = value.replace(/,/g, '.').split(/\s*[Xx×]\s*/); return { Ancho: ancho.trim(), Largo: largo?.trim() ?? '' } }
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
const add = (category: string, subcategory: string, unit: string, values: Record<string, string>, stock = 1) => rows.push({ category, subcategory, unit, values, stock })

// Insumos generales proporcionados.
add('Cartulina', 'Escolar', 'PLIEGO', { ...dims('650 X 500'), Gramaje: '140', Contenido: '250 Pliegos', 'Paquetes por paleta': '44' })
add('Papel Adhesivo', 'P2', 'PLIEGO', { ...dims('1000 X 700'), Gramaje: '177', Contenido: '100 Pliegos', 'Paquetes por paleta': '62' })
add('Papel Adhesivo', 'P3', 'PLIEGO', { ...dims('1000 X 700'), Gramaje: '200', Contenido: '100 Pliegos', 'Paquetes por paleta': '60' })
;[['Corrugado','1000 X 700','100 Pliegos','10'],['Microcorrugado','1000 X 700','100 Pliegos','10'],['Corrugado','1200 X 10000','Rollo',''],['Microcorrugado','1200 X 10000','Rollo','']].forEach(([type, measure, content, packs]) => add('Cartón', type, content === 'Rollo' ? 'ROLLO' : 'PLIEGO', { ...dims(measure), Contenido: content, ...(packs ? { 'Paquetes por paleta': packs } : {}) }))
add('Herramientas', 'Cuchillas', 'ROLLO', { ...dims('0.71 X 23.80'), Contenido: '100 m', Referencia: 'CFDB-D52' }, 1)
add('Cintas', 'Embalaje', 'ROLLO', { Tipo: '120 yardas', Contenido: '100 metros', 'Paquetes por paleta': '12' })
add('Vasos', '8 Onzas', 'MILLAR', { Tipo: '8 onzas', Contenido: '25 vasos', 'Paquetes por paleta': '1' })
;[['A4','210 X 297','2500 hojas','96'],['Oficio','216 X 330','2500 hojas','94'],['A3','420 X 297','2000 hojas','90']].forEach(([type, measure, content, packs]) => add('Papel', `Bond ${type}`, 'CAJA', { ...dims(measure), Gramaje: '75', Contenido: content, 'Paquetes por paleta': packs }))
add('Plástico', 'Stretch Film', 'ROLLO', { Ancho: '450', Metros: '50', Contenido: '4 rollos' }, 4)
;[['Revelador','CTCP','18 L'],['Goma','Sintética CTCP','18 L'],['Wash','Prego','18 L'],['Cola','Sintética','5 L']].forEach(([type, detail, content]) => add('Químicos', type, type === 'Cola' ? 'BALDE' : 'GALON', { Tipo: detail, Contenido: content }))
;[['Grueso','ASA Blanca','20 kg','8020'],['Delgado','ASA Negro','20 kg','7030'],['Sectorizado','Sectorizado','5 kg','370']].forEach(([type, detail, content, ref]) => add('Barnices', type, type === 'Sectorizado' ? 'BALDE' : 'GALON', { Tipo: detail, Contenido: content, Referencia: ref }))
;[['20','Personal'],['25','Mediana'],['30','Mediana'],['35','Mediana'],['40','Familiar'],['45','Extra grande']].forEach(([size, type]) => add('Cajas', 'Pizza', 'CAJA', { Ancho: size, Largo: size, Tipo: type, Contenido: '12 unidades' }))

// Plástico mate y gloss.
const plasticWidths = [33,35,43,45,47,50,60,61,65,70,71]
plasticWidths.forEach(width => { add('Plástico', 'Mate 20 micras', 'ROLLO', { Ancho: String(width * 10), Micras: '20', Metros: '3000' }); add('Plástico', 'Gloss 17 micras', 'ROLLO', { Ancho: String(width * 10), Micras: '17', Metros: '3000' }) })
;[50,60,65,70].forEach(width => add('Plástico', 'Mate 19 micras', 'ROLLO', { Ancho: String(width * 10), Micras: '19', Metros: '4000' }))
add('Plástico', 'Gloss 19 micras', 'ROLLO', { Ancho: '700', Micras: '19', Metros: '3000' })

// Papel: Foldcote, Duplex, Couche y Bond.
;[['Foldcote','10/190','39'],['Foldcote Bobina','12/205','30'],['Foldcote','14/235','27'],['Foldcote Bobina','16/255','22'],['Foldcote','18/290','20'],['Foldcote','20/305','17'],['Foldcote','22/345','17'],['Foldcote','24/350','20'],['Foldcote Bobina','22/345','17'],['Duplex','12/205','30'],['Duplex','16/270','30'],['Duplex','20/310','30']].forEach(([type, spec, packs]) => { const [calibre, gramaje] = spec.split('/'); add('Papel', type, 'PLIEGO', { ...dims('700 X 1000'), Calibre: calibre, Gramaje: gramaje, Contenido: '100 Pliegos', 'Paquetes por paleta': packs }) })
;[['61 X 86','90','500','22'],['61 X 86','115','250','40'],['69 X 89','115','250','40'],['72 X 102','115','250','40'],['61 X 86','150','250','30'],['69 X 89','150','250','30'],['72 X 102','150','250','30'],['61 X 86','200','125','40'],['69 X 89','200','125','40'],['72 X 102','200','125','40'],['69 X 89','250','100','30'],['61 X 86','300','100','28'],['69 X 89','300','100','28'],['72 X 102','300','100','28'],['69 X 89','350','100','24'],['72 X 102','350','100','23']].forEach(([measure, gramaje, content, packs]) => add('Papel', 'Couche Brillo', 'PLIEGO', { ...dims(measure), Gramaje: gramaje, Contenido: `${content} Pliegos`, 'Paquetes por paleta': packs }))
;[['Bond','61 X 86','58','500','24'],['Bond','69 X 89','58','500','24'],['Bond','72 X 102','58','500','24'],['Bond','61 X 86','75','500','19'],['Bond','69 X 89','75','500','19'],['Bond','72 X 102','75','500','19'],['Bond Bobina','72 X 102','75','500','20'],['Bond','61 X 86','95','500','15'],['Bond','69 X 89','95','500','15'],['Bond','72 X 102','95','500','15'],['Bond','61 X 86','120','250','26'],['Bond','69 X 89','120','250','26'],['Bond','72 X 102','120','250','26']].forEach(([type, measure, gramaje, content, packs]) => add('Papel', type, 'PLIEGO', { ...dims(measure), Gramaje: gramaje, Contenido: `${content} Pliegos`, 'Paquetes por paleta': packs }))

// Placas CTP Thermal y CTCP UV.
const plateFormats = ['1030 X 820','1030 X 800','1030 X 790','1030 X 770','975 X 730','840 X 690','775 X 685','745 X 675','745 X 660','745 X 605','745 X 557','730 X 600','724 X 615','720 X 586','720 X 557','650 X 550','645 X 508','525 X 459','521 X 415','510 X 400','445 X 406','254 X 388','254 X 388']
plateFormats.forEach((measure, index) => { const thin = index >= 17; const detail = index === 21 ? 'SIN PERFORAR' : index === 22 ? 'PERFORADA' : ''; add('Placas', 'CTP Thermal', 'CAJA', { ...dims(measure), Tipo: ['THERMAL', detail].filter(Boolean).join(' '), Espesor: thin ? '0.15' : '0.30', Contenido: thin ? '100 unidades' : '50 unidades' }); add('Placas', 'CTCP UV', 'CAJA', { ...dims(measure), Tipo: ['UV', detail].filter(Boolean).join(' '), Espesor: thin ? '0.15' : '0.30', Contenido: thin ? '100 unidades' : '50 unidades' }) })

const categoryBlueprints: { name: string; code: string; attributes: Key[]; subcategories: { name: string; code: string; extra?: Key[] }[] }[] = [
  { name: 'Cartulina', code: 'CAR', attributes: ['ancho','largo','gramaje','contenido','paquetes'], subcategories: [{ name: 'Escolar', code: 'ESC' }] },
  { name: 'Papel Adhesivo', code: 'PAD', attributes: ['ancho','largo','gramaje','contenido','paquetes'], subcategories: [{ name: 'P2', code: 'P2' },{ name: 'P3', code: 'P3' }] },
  { name: 'Cartón', code: 'CTN', attributes: ['ancho','largo','contenido','paquetes'], subcategories: [{ name: 'Corrugado', code: 'COR' },{ name: 'Microcorrugado', code: 'MIC' }] },
  { name: 'Herramientas', code: 'HER', attributes: ['ancho','largo','contenido','referencia'], subcategories: [{ name: 'Cuchillas', code: 'CUC' }] },
  { name: 'Cintas', code: 'CIN', attributes: ['tipo','contenido','paquetes'], subcategories: [{ name: 'Embalaje', code: 'EMB' }] }, { name: 'Vasos', code: 'VAS', attributes: ['tipo','contenido','paquetes'], subcategories: [{ name: '8 Onzas', code: '8OZ' }] },
  { name: 'Papel', code: 'PAP', attributes: ['ancho','largo','gramaje','calibre','contenido','paquetes'], subcategories: [{ name: 'Bond A4', code: 'A4' },{ name: 'Bond Oficio', code: 'OFC' },{ name: 'Bond A3', code: 'A3' },{ name: 'Foldcote', code: 'FOL' },{ name: 'Foldcote Bobina', code: 'FOB' },{ name: 'Duplex', code: 'DUP' },{ name: 'Couche Brillo', code: 'COU' },{ name: 'Bond', code: 'BON' },{ name: 'Bond Bobina', code: 'BOB' }] },
  { name: 'Plástico', code: 'PLA', attributes: ['ancho','micras','metros','contenido'], subcategories: [{ name: 'Stretch Film', code: 'STR' },{ name: 'Mate 20 micras', code: 'M20' },{ name: 'Mate 19 micras', code: 'M19' },{ name: 'Gloss 17 micras', code: 'G17' },{ name: 'Gloss 19 micras', code: 'G19' }] },
  { name: 'Químicos', code: 'QMC', attributes: ['tipo','contenido'], subcategories: [{ name: 'Revelador', code: 'REV' },{ name: 'Goma', code: 'GOM' },{ name: 'Wash', code: 'WAS' },{ name: 'Cola', code: 'COL' }] }, { name: 'Barnices', code: 'BAR', attributes: ['tipo','contenido','referencia'], subcategories: [{ name: 'Grueso', code: 'GRU' },{ name: 'Delgado', code: 'DEL' },{ name: 'Sectorizado', code: 'SEC' }] },
  { name: 'Cajas', code: 'CAJ', attributes: ['ancho','largo','tipo','contenido'], subcategories: [{ name: 'Pizza', code: 'PIZ' }] }, { name: 'Placas', code: 'PLC', attributes: ['ancho','largo','tipo','espesor','contenido'], subcategories: [{ name: 'CTP Thermal', code: 'THM' },{ name: 'CTCP UV', code: 'UV' }] },
]

async function main() {
  console.log('Iniciando seed de catálogo…')
  const firstUser = await prisma.user.findFirst({ include: { company: true } })
  if (!firstUser?.company) throw new Error('No se encontró empresa con usuario; se preservan las credenciales y se cancela el seed.')
  const units = [['PLIEGO','Pliego'],['ROLLO','Rollo'],['CAJA','Caja'],['GALON','Galón'],['BALDE','Balde'],['MILLAR','Millar'],['UND','Unidad']] as const
  // No se usa una transacción interactiva única: Supabase la cierra antes de
  // terminar un catálogo grande. Cada operación se confirma en bloques cortos.
  {
    const db = prisma
    // Se elimina toda la información operativa y comercial previa. Se conservan
    // únicamente la empresa y la información de acceso (usuarios, sesiones y roles).
    await db.productionOrder.deleteMany()
    await db.purchase.deleteMany()
    await db.import.deleteMany()
    await db.inventoryMovement.deleteMany()
    await db.stockTransfer.deleteMany()
    await db.inventoryAdjustment.deleteMany()
    await db.stock.deleteMany()
    await db.product.deleteMany()
    await db.supplier.deleteMany()
    await db.customer.deleteMany()
    await db.customsAgent.deleteMany()
    await db.warehouse.deleteMany()
    await db.brand.deleteMany()
    await db.exchangeRate.deleteMany()
    await db.auditLog.deleteMany()
    await db.unit.deleteMany()

    // Se reemplaza por completo la configuración del catálogo solicitada.
    await db.category.deleteMany()
    await db.attributeDefinition.deleteMany()
    for (const [code, description] of units) await db.unit.upsert({ where: { code }, create: { code, description, status: ProductStatus.ACTIVE }, update: { description, status: ProductStatus.ACTIVE } })
    const definitionMap = new Map<string, { id: string; name: string; type: AttributeDataType; suffix: string }>()
    for (const definition of Object.values(definitions)) { const saved = await db.attributeDefinition.upsert({ where: { code: definition.code }, create: { code: definition.code, name: definition.name, dataType: definition.type, suffix: definition.suffix, status: ProductStatus.ACTIVE }, update: { name: definition.name, dataType: definition.type, suffix: definition.suffix, status: ProductStatus.ACTIVE } }); definitionMap.set(definition.name, { id: saved.id, name: definition.name, type: definition.type, suffix: definition.suffix }) }
    const categories = new Map<string, { id: string; code: string; attributes: string[]; subcategories: Map<string, { id: string; code: string; attributes: string[] }> }>()
    for (const blueprint of categoryBlueprints) {
      const category = await db.category.upsert({ where: { name: blueprint.name }, create: { name: blueprint.name, code: blueprint.code, status: ProductStatus.ACTIVE }, update: { code: blueprint.code, status: ProductStatus.ACTIVE } })
      await db.categoryAttribute.deleteMany({ where: { categoryId: category.id } }); await db.subcategory.deleteMany({ where: { categoryId: category.id } })
      const attributeNames = blueprint.attributes.map(key => definitions[key].name)
      await db.categoryAttribute.createMany({ data: attributeNames.map((name, position) => { const attribute = definitionMap.get(name)!; return { categoryId: category.id, attributeDefinitionId: attribute.id, name, dataType: attribute.type, suffix: attribute.suffix, required: true, status: ProductStatus.ACTIVE, position } }) })
      const subcategories = new Map<string, { id: string; code: string; attributes: string[] }>()
      for (const sub of blueprint.subcategories) { const created = await db.subcategory.create({ data: { categoryId: category.id, name: sub.name, code: sub.code, status: ProductStatus.ACTIVE } }); const names = (sub.extra ?? []).map(key => definitions[key].name); if (names.length) await db.subcategoryAttribute.createMany({ data: names.map((name, position) => { const attribute = definitionMap.get(name)!; return { subcategoryId: created.id, attributeDefinitionId: attribute.id, name, dataType: attribute.type, suffix: attribute.suffix, required: true, status: ProductStatus.ACTIVE, position } }) }); subcategories.set(sub.name, { id: created.id, code: sub.code, attributes: names }) }
      categories.set(blueprint.name, { id: category.id, code: blueprint.code, attributes: attributeNames, subcategories })
    }
    const unitMap = new Map((await db.unit.findMany()).map(unit => [unit.code, unit.id])); const counters = new Map<string, number>()
    for (const row of rows) { const category = categories.get(row.category)!; const subcategory = category.subcategories.get(row.subcategory)!; const counterKey = `${category.code}-${subcategory.code}`; const number = (counters.get(counterKey) ?? 0) + 1; counters.set(counterKey, number); const code = `${counterKey}-${String(number).padStart(3, '0')}`; const attributeNames = [...category.attributes, ...subcategory.attributes]; const name = productName(row.subcategory, attributeNames, row.values, definitionMap); const created = await db.product.create({ data: { code, name, categoryId: category.id, subcategoryId: subcategory.id, roles: [ProductRoleType.MERCHANDISE, ProductRoleType.SUPPLY], status: ProductStatus.ACTIVE, variantType: ProductVariantType.BASIC, attributes: { create: attributeNames.map((name, position) => { const attribute = definitionMap.get(name)!; return { name, dataType: attribute.type, suffix: attribute.suffix, required: true, status: ProductStatus.ACTIVE, position } }) }, presentations: { create: { code: `${code}-01`, name: row.subcategory, unitId: unitMap.get(row.unit)!, attributeValues: {}, factor: new Prisma.Decimal(1), minimumStock: new Prisma.Decimal(0), currentStock: new Prisma.Decimal(row.stock ?? 0), status: ProductStatus.ACTIVE } } }, include: { attributes: true, presentations: true } }); const values = Object.fromEntries(created.attributes.map(attribute => [attribute.id, row.values[attribute.name] ?? ''])); await db.productPresentation.update({ where: { id: created.presentations[0].id }, data: { attributeValues: values as Prisma.InputJsonValue, name: created.name } }) }
  }
  console.log(`Seed completado: ${rows.length} productos con categorías, subcategorías, atributos y stock actual. Usuarios preservados.`)
}
main().catch(error => { console.error(error); process.exitCode = 1 }).finally(() => prisma.$disconnect())
