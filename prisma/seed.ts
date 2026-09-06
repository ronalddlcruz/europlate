import { Prisma, PrismaClient, ProductRoleType, ProductStatus, ProductVariantType } from '@prisma/client'

const prisma = new PrismaClient()
type Attr = { name: string; suffix?: string }
type Presentation = { name: string; unit: string; values: Record<string, string> }
type Seed = { code: string; name: string; category: string; attributes: Attr[]; rows: Presentation[] }
const attrs = (...names: string[]): Attr[] => names.map((name) => ({ name }))
const paper = [{ name: 'Medida' }, { name: 'Calibre' }, { name: 'Gramaje', suffix: 'g' }, { name: 'Cantidad por resma' }]
const resma = (name: string, Medida: string, Calibre: string, Gramaje: string, cantidad: string): Presentation => ({ name, unit: 'RESMA', values: { Medida, Calibre, Gramaje, 'Cantidad por resma': cantidad } })
const paperRows = (name: string, rows: Array<[string, string, string]>): Presentation[] => rows.map(([medida, gramaje, cantidad]) => ({ name: `${name} ${medida} · ${gramaje} g`, unit: 'RESMA', values: { Medida: medida, Gramaje: gramaje, 'Cantidad por resma': cantidad } }))

// Catálogo de demostración: materiales entregados para la presentación de Europlate.
const products: Seed[] = [
  { code: 'PAP-001', name: 'Foldcote', category: 'Papel', attributes: paper, rows: [
    resma('Foldcote 70 × 100 · Cal. 10 · 190 g', '70 × 100 mm', '10', '190', '100 pliegos'),
    resma('Foldcote 70 × 100 · Cal. 12 · 205 g', '70 × 100 mm', '12', '205', '100 pliegos'),
    resma('Foldcote 70 × 100 · Cal. 15 · 245 g', '70 × 100 mm', '15', '245', '100 pliegos'),
  ] },
  { code: 'PAP-002', name: 'Foldcote Sueco', category: 'Papel', attributes: paper, rows: [
    resma('Foldcote Sueco 70 × 100 · 22/335', '70 × 100 mm', '22/335', '22/335', '100 pliegos'),
    resma('Foldcote Sueco 70 × 100 · 20/305', '70 × 100 mm', '20/305', '20/305', '100 pliegos'),
    resma('Foldcote Sueco 70 × 100 · 24/345', '70 × 100 mm', '24/345', '24/345', '100 pliegos'),
  ] },
  { code: 'CAR-001', name: 'Duplex', category: 'Cartón', attributes: paper, rows: [
    resma('Duplex 70 × 100 · 12/205', '70 × 100 mm', '12/205', '12/205', '100 pliegos'),
    resma('Duplex 70 × 100 · 16/270', '70 × 100 mm', '16/270', '16/270', '100 pliegos'),
    resma('Duplex 70 × 100 · 20/310', '70 × 100 mm', '20/310', '20/310', '100 pliegos'),
  ] },
  { code: 'PAP-003', name: 'Couche Brillo', category: 'Papel', attributes: attrs('Medida', 'Gramaje', 'Cantidad por resma'), rows: paperRows('Couche Brillo', [['61 × 86', '90', '500 pliegos'], ['61 × 86', '115', '250 pliegos'], ['69 × 89', '115', '250 pliegos'], ['72 × 102', '300', '100 pliegos'], ['61 × 86', '300', '100 pliegos'], ['72 × 102', '350', '100 pliegos']]) },
  { code: 'PAP-004', name: 'Bond', category: 'Papel', attributes: attrs('Medida', 'Gramaje', 'Cantidad por resma'), rows: paperRows('Bond', [['61 × 86', '58', '500 pliegos'], ['69 × 89', '58', '500 pliegos'], ['72 × 102', '58', '500 pliegos']]) },
  { code: 'CTL-001', name: 'Cartulina Escolar', category: 'Cartulina', attributes: attrs('Medida', 'Gramaje', 'Cantidad por resma'), rows: paperRows('Cartulina Escolar', [['65 × 50', '140', '250 pliegos']]) },
  { code: 'PAP-005', name: 'Papel Adhesivo', category: 'Papel', attributes: attrs('Medida', 'Gramaje', 'Cantidad por resma'), rows: paperRows('Papel Adhesivo', [['1 000 × 700', '85', '100 pliegos']]) },
  { code: 'CIN-001', name: 'Cinta de Embalaje', category: 'Cinta de embalaje', attributes: attrs('Medida', 'Cantidad'), rows: [{ name: 'Cinta de Embalaje · 120 yardas', unit: 'ROLLO', values: { Medida: '120 yardas', Cantidad: '100 metros' } }] },
  { code: 'PAP-006', name: 'Bond A4', category: 'Papel', attributes: attrs('Medida', 'Gramaje', 'Cantidad por resma'), rows: paperRows('Bond A4', [['100 A más', '75', '500 hojas']]) },
  { code: 'VAS-001', name: 'Vasos', category: 'Vasos', attributes: attrs('Medida', 'Cantidad'), rows: [{ name: 'Vasos · 8 onzas', unit: 'CAJA', values: { Medida: '8 onzas', Cantidad: '1 000' } }] },
  { code: 'PLA-001', name: 'Gloss', category: 'Plástico', attributes: [{ name: 'Medida', suffix: 'µ' }], rows: ['20', '25', '30'].map((Medida) => ({ name: `Gloss · ${Medida} µ`, unit: 'ROLLO', values: { Medida } })) },
  { code: 'PLC-001', name: 'Placas CTP', category: 'Placas', attributes: attrs('Medida', 'Tipo', 'MM', 'Cantidad'), rows: ['1 030 × 820', '1 030 × 800', '1 030 × 790'].map((Medida) => ({ name: `Placas CTP ${Medida} · UV · 0.3 mm`, unit: 'CAJA', values: { Medida, Tipo: 'UV', MM: '0.3', Cantidad: '50' } })) },
  { code: 'BOB-001', name: 'Coated Kraftback Board', category: 'Bobina', attributes: [{ name: 'GSM' }, { name: 'Ancho', suffix: 'mm' }, { name: 'Diámetro', suffix: 'mm' }, { name: 'Peso', suffix: 'kg' }], rows: [
    ['464', '1390', '1900', '2353'], ['242', '750', '1538', '1068'], ['473', '1672', '1900', '2834'], ['242', '750', '1532', '1062'], ['471', '1308', '1900', '1270'], ['242', '750', '1538', '1046'],
  ].map(([GSM, Ancho, Diámetro, Peso]) => ({ name: `Coated Kraftback Board · ${GSM} GSM · ${Ancho} mm · ${Peso} kg`, unit: 'BOBINA', values: { GSM, Ancho, Diámetro, Peso } })) },
]

async function main() {
  const firstUser = await prisma.user.findFirst({ include: { company: true }, orderBy: { createdAt: 'asc' } })
  const company = firstUser?.company ?? await prisma.company.upsert({ where: { taxId: 'DEMO-EUROPLATE' }, update: {}, create: { name: 'Europlate Empaques S.A.C.', taxId: 'DEMO-EUROPLATE', currency: 'PEN' } })
  const defs = [['RESMA', 'Resma'], ['ROLLO', 'Rollo'], ['CAJA', 'Caja'], ['BOBINA', 'Bobina']] as const
  await prisma.unit.createMany({ data: defs.map(([code, description]) => ({ code, description, status: ProductStatus.ACTIVE })), skipDuplicates: true })
  const units = new Map((await prisma.unit.findMany({ where: { code: { in: defs.map(([code]) => code) } } })).map((unit) => [unit.code, unit]))
  const warehouse = await prisma.warehouse.upsert({ where: { companyId_name: { companyId: company.id, name: 'Almacén Principal' } }, update: { status: ProductStatus.ACTIVE }, create: { companyId: company.id, name: 'Almacén Principal', status: ProductStatus.ACTIVE } })

  await prisma.$transaction(async (db) => {
    // Se eliminan registros que dependen del catálogo, conservando usuarios, proveedores y clientes.
    await db.productionOrder.deleteMany(); await db.purchase.deleteMany(); await db.import.deleteMany()
    await db.inventoryMovement.deleteMany(); await db.stockTransfer.deleteMany(); await db.inventoryAdjustment.deleteMany(); await db.stock.deleteMany()
    await db.product.deleteMany(); await db.category.deleteMany()
    const categories = new Map<string, { id: string }>()
    for (const seed of products) {
      let category = categories.get(seed.category)
      if (!category) { category = await db.category.create({ data: { name: seed.category } }); categories.set(seed.category, category) }
      const product = await db.product.create({ data: {
        code: seed.code, name: seed.name, categoryId: category.id, roles: [ProductRoleType.MERCHANDISE, ProductRoleType.SUPPLY], status: ProductStatus.ACTIVE,
        variantType: seed.rows.length > 1 ? ProductVariantType.WITH_VARIANTS : ProductVariantType.BASIC,
        attributes: { create: seed.attributes.map((attribute, position) => ({ ...attribute, position, status: ProductStatus.ACTIVE })) },
        presentations: { create: seed.rows.map((row, index) => ({ code: `DEMO-${seed.code}-${String(index + 1).padStart(2, '0')}`, name: row.name, unitId: units.get(row.unit)!.id, attributeValues: row.values as Prisma.InputJsonValue, factor: new Prisma.Decimal(1), minimumStock: new Prisma.Decimal(0), currentStock: new Prisma.Decimal(0), status: ProductStatus.ACTIVE })) },
      } })
      await db.stock.create({ data: { productId: product.id, warehouseId: warehouse.id, quantity: new Prisma.Decimal(0) } })
    }
  }, { timeout: 60_000 })
  const presentations = products.reduce((total, product) => total + product.rows.length, 0)
  console.log(`Seed completado: ${products.length} productos, ${presentations} presentaciones y 8 categorías.`)
}

main().catch((error) => { console.error(error); process.exitCode = 1 }).finally(() => prisma.$disconnect())
