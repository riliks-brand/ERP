// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create a Default Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'brand-hq' },
    update: {},
    create: {
      name: 'Brand HQ Egypt',
      slug: 'brand-hq',
      currency: 'EGP',
    },
  });

  const tenantId = tenant.id;
  console.log(`✅ Tenant Created: ${tenant.name}`);

  // 2. Create Raw Materials (Fabrics, Thread, Packaging)
  const cottonRoll = await prisma.rawMaterial.create({
    data: {
      tenantId,
      name: 'Premium Egyptian Cotton (Black)',
      sku: 'RM-COT-BLK-01',
      unit: 'KILOGRAM',
      avgCost: 250.0,
      totalQty: 50.0,
      totalValue: 12500.0,
      minStock: 20.0,
      ledgerEntries: {
        create: {
          type: 'INBOUND',
          qty: 50.0,
          unitCost: 250.0,
          totalCost: 12500.0,
          runningAvgCost: 250.0,
          runningQty: 50.0,
          runningValue: 12500.0,
          notes: 'Initial Stock',
        },
      },
    },
  });

  const shippingBox = await prisma.rawMaterial.create({
    data: {
      tenantId,
      name: 'Branded Shipping Box (Medium)',
      sku: 'RM-PKG-BOX-M',
      unit: 'PIECE',
      avgCost: 12.5,
      totalQty: 1000,
      totalValue: 12500.0,
      minStock: 200,
      ledgerEntries: {
        create: {
          type: 'INBOUND',
          qty: 1000,
          unitCost: 12.5,
          totalCost: 12500.0,
          runningAvgCost: 12.5,
          runningQty: 1000,
          runningValue: 12500.0,
          notes: 'Initial Stock',
        },
      },
    },
  });

  console.log(`✅ Raw Materials Created.`);

  // 3. Create Products & Variants
  const hoodie = await prisma.product.create({
    data: {
      tenantId,
      name: 'Oversized Signature Hoodie',
      baseSku: 'PRD-HOODIE-SIG',
      category: 'Winter Wear',
      variants: {
        create: [
          { sku: 'HD-SIG-BLK-M', color: 'Black', size: 'M', sellingPrice: 950.0, standardCost: 400.0, stockQty: 15 },
          { sku: 'HD-SIG-BLK-L', color: 'Black', size: 'L', sellingPrice: 950.0, standardCost: 400.0, stockQty: 8 },
        ],
      },
    },
    include: { variants: true },
  });

  console.log(`✅ Products Created.`);

  // 4. Create Bill of Materials (BOM)
  // For each hoodie, it takes 0.75 KG of cotton and 1 shipping box
  for (const variant of hoodie.variants) {
    await prisma.bomItem.createMany({
      data: [
        { variantId: variant.id, rawMaterialId: cottonRoll.id, qtyRequired: 0.75 },
        { variantId: variant.id, rawMaterialId: shippingBox.id, qtyRequired: 1.0 },
      ],
    });
  }

  // 5. Create Vendors (Supplier & Workshop)
  const factory = await prisma.vendor.create({
    data: {
      tenantId,
      name: 'Al-Ahram Sewing Factory',
      type: 'SEWING_WORKSHOP',
      phone: '01012345678',
      balance: -5000.0, // We owe them 5000
    },
  });

  console.log(`✅ Vendors Created.`);

  // 6. Create Sales Orders
  await prisma.salesOrder.create({
    data: {
      tenantId,
      orderNumber: 'ORD-1001',
      customerName: 'Ahmed Youssef',
      customerPhone: '01198765432',
      customerCity: 'Cairo',
      shippingAddress: 'Nasr City, Makram Ebeid',
      status: 'SHIPPED',
      shippingProviderId: null, // Bosta or manual
      subtotal: 1900.0,
      shippingFee: 60.0,
      totalAmount: 1960.0,
      trackingNumber: 'TRK-999123',
      items: {
        create: [
          { variantId: hoodie.variants[0].id, qty: 1, unitPrice: 950.0, totalLinePrice: 950.0 },
          { variantId: hoodie.variants[1].id, qty: 1, unitPrice: 950.0, totalLinePrice: 950.0 },
        ],
      },
    },
  });

  await prisma.salesOrder.create({
    data: {
      tenantId,
      orderNumber: 'ORD-1002',
      customerName: 'Sara Mahmoud',
      customerPhone: '01234567890',
      customerCity: 'Alexandria',
      status: 'PENDING',
      subtotal: 950.0,
      shippingFee: 75.0,
      totalAmount: 1025.0,
      items: {
        create: [
          { variantId: hoodie.variants[0].id, qty: 1, unitPrice: 950.0, totalLinePrice: 950.0 },
        ],
      },
    },
  });

  console.log(`✅ Sales Orders Created.`);

  // 7. Create Glossary Terms
  await prisma.glossary.createMany({
    skipDuplicates: true,
    data: [
      {
        termEn: 'COGS',
        termAr: 'تكلفة البضاعة المباعة',
        definitionEn: 'Cost of Goods Sold. Total direct costs to produce an item (fabric, labor, packaging).',
        definitionAr: 'إجمالي التكاليف المباشرة لإنتاج القطعة (الخامة، المصنعية، التغليف).',
        category: 'ACCOUNTING',
        slug: 'cogs',
      },
      {
        termEn: 'RTO',
        termAr: 'مرتجع الشحن',
        definitionEn: 'Return to Origin. When a shipped package is rejected by the customer and sent back.',
        definitionAr: 'المنتج الذي يرفض العميل استلامه ويعود إلى المخزن (مما يسبب خسارة رسوم الشحن).',
        category: 'SHIPPING',
        slug: 'rto',
      },
      {
        termEn: 'BOM',
        termAr: 'وصفة التصنيع',
        definitionEn: 'Bill of Materials. The exact recipe of raw materials needed to make one variant.',
        definitionAr: 'قائمة المواد الخام والتغليف اللازمة لإنتاج قطعة واحدة (مثل: 0.75 كجم قطن + علبة).',
        category: 'MANUFACTURING',
        slug: 'bom',
      },
    ],
  });

  console.log(`✅ Glossary Created.`);
  console.log('🌱 Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
