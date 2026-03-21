/**
 * Smart Glossary — Static Seed Data
 *
 * Bilingual (EN/AR) glossary terms organized by category.
 * These can be seeded into the database or used client-side directly.
 */

export interface GlossaryEntry {
  slug: string;
  termEn: string;
  termAr: string;
  definitionEn: string;
  definitionAr: string;
  category: "ACCOUNTING" | "MANUFACTURING" | "SHIPPING" | "INVENTORY" | "SALES";
  relatedTerms: string[];
}

export const GLOSSARY_DATA: GlossaryEntry[] = [
  // ── ACCOUNTING ──────────────────────────────────────────────────────
  {
    slug: "cogs",
    termEn: "COGS",
    termAr: "تكلفة البضاعة المباعة",
    definitionEn:
      "Cost of Goods Sold — the true cost to produce one unit, including raw materials, labor, and packaging.",
    definitionAr:
      "التكلفة الحقيقية لإنتاج القطعة الواحدة شاملة الخامات والمصنعية والتغليف. يتم حسابها ديناميكياً من الـ BOM × أسعار AVCO الحالية.",
    category: "ACCOUNTING",
    relatedTerms: ["bom", "avco", "landed-cost"],
  },
  {
    slug: "avco",
    termEn: "AVCO (Weighted Average Cost)",
    termAr: "المتوسط المرجح للتكلفة",
    definitionEn:
      "A costing method that recalculates the average unit cost every time new stock is purchased at a different price.",
    definitionAr:
      "طريقة حساب بتحدّث متوسط سعر الخامة في كل مرة بتشتري فيها بسعر مختلف. مثال: لو اشتريت 100 متر بـ 80 جنيه و 50 متر بـ 90 جنيه، المتوسط = (8000+4500) / 150 = 83.33 جنيه.",
    category: "ACCOUNTING",
    relatedTerms: ["cogs", "landed-cost"],
  },
  {
    slug: "landed-cost",
    termEn: "Landed Cost",
    termAr: "التكلفة الواصلة",
    definitionEn:
      "The total price of raw materials after adding transport, customs, duties, and any other fees to deliver them to your warehouse.",
    definitionAr:
      "سعر الخامات بعد إضافة مصاريف الشحن والجمارك والنقل. مثال: لو القماش سعره 80 جنيه/متر ومصاريف الشحن 500 جنيه على 100 متر، الـ Landed Cost = 85 جنيه/متر.",
    category: "ACCOUNTING",
    relatedTerms: ["avco", "cogs"],
  },
  {
    slug: "true-profit",
    termEn: "True Profit",
    termAr: "الربح الحقيقي",
    definitionEn:
      "Net profit after deducting ALL costs: COGS, shipping, returns, ad spend, and platform commissions.",
    definitionAr:
      "صافي الربح بعد خصم كل المصاريف الفعلية: تكلفة الإنتاج، الشحن، المرتجعات، الإعلانات، وعمولة المنصة. الرقم الوحيد اللي بيقولك هل البراند بيكسب فعلاً ولا لأ.",
    category: "ACCOUNTING",
    relatedTerms: ["cogs", "burn-rate"],
  },
  {
    slug: "burn-rate",
    termEn: "Burn Rate",
    termAr: "معدل الحرق",
    definitionEn:
      "Total monthly fixed expenses (rent, salaries, marketing) — how fast you're spending money regardless of sales.",
    definitionAr:
      "إجمالي المصاريف الثابتة شهرياً (إيجار، مرتبات، تسويق). الرقم ده بيقولك كل شهر بتصرف أد إيه حتى لو مبعتش حاجة.",
    category: "ACCOUNTING",
    relatedTerms: ["true-profit", "cash-flow"],
  },
  {
    slug: "cash-flow",
    termEn: "Cash Flow Forecast",
    termAr: "توقع السيولة النقدية",
    definitionEn:
      "A 30-day prediction of your available cash, combining in-transit shipping money, vendor payables, and expected revenue.",
    definitionAr:
      "توقع لحجم الكاش المتاح عندك خلال الـ 30 يوم الجايين. بيجمع الفلوس اللي عند شركات الشحن + المديونيات للمصانع + إيرادات متوقعة.",
    category: "ACCOUNTING",
    relatedTerms: ["burn-rate", "shipping-wallet"],
  },
  {
    slug: "platform-commission",
    termEn: "Platform Commission",
    termAr: "عمولة المنصة",
    definitionEn:
      "The percentage fee charged by e-commerce platforms (Shopify, WooCommerce) on each sale. This is NOT refunded on returns.",
    definitionAr:
      "نسبة العمولة اللي المنصة بتاخدها على كل عملية بيع. المهم: العمولة دي مبترجعش في حالة المرتجعات.",
    category: "ACCOUNTING",
    relatedTerms: ["true-profit", "return-loss"],
  },

  // ── MANUFACTURING ───────────────────────────────────────────────────
  {
    slug: "bom",
    termEn: "BOM (Bill of Materials)",
    termAr: "قائمة المواد",
    definitionEn:
      "The 'recipe' for manufacturing — specifies exactly how much fabric, thread, zippers, and labels are needed per unit.",
    definitionAr:
      "\"وصفة\" التصنيع اللي بتحدد استهلاك كل قطعة من القماش والخيوط والسوست والتيكيتات. كل مقاس ليه BOM مختلف (XL بياخد قماش أكتر من S).",
    category: "MANUFACTURING",
    relatedTerms: ["cogs", "wastage", "matrix-sku"],
  },
  {
    slug: "wastage",
    termEn: "Wastage / Cutting Loss",
    termAr: "الهالك",
    definitionEn:
      "Fabric lost during the cutting process. Efficiency = (Theoretical Usage / Actual Usage) × 100%. Below 90% is flagged.",
    definitionAr:
      "القماش المفقود أثناء عملية القص. الكفاءة = (الاستهلاك النظري / الاستهلاك الفعلي) × 100%. لو أقل من 90% السيستم بيديك تنبيه.",
    category: "MANUFACTURING",
    relatedTerms: ["bom", "production-order"],
  },
  {
    slug: "production-order",
    termEn: "Production Order",
    termAr: "أمر الإنتاج",
    definitionEn:
      "A work order that tracks a batch from Draft → Fabric Reserved → Issued to Factory → QC → Stocked.",
    definitionAr:
      "أمر بيتتبع دورة إنتاج الدفعة: مسودة ← حجز قماش ← تسليم للمصنع ← فحص جودة ← دخول المخزن. كل خطوة بتحصل تلقائي.",
    category: "MANUFACTURING",
    relatedTerms: ["wastage", "fabric-reserved"],
  },
  {
    slug: "fabric-reserved",
    termEn: "Fabric Reserved",
    termAr: "حجز القماش",
    definitionEn:
      "The state where raw materials are locked for a production order. Uses database-level locks to prevent double-booking.",
    definitionAr:
      "الحالة اللي القماش فيها بيكون محجوز لأمر إنتاج معين. السيستم بيستخدم أقفال على مستوى قاعدة البيانات لمنع حجز نفس الكمية لأكتر من أمر.",
    category: "MANUFACTURING",
    relatedTerms: ["production-order"],
  },
  {
    slug: "sub-contracting",
    termEn: "Sub-contracting",
    termAr: "التصنيع الخارجي",
    definitionEn:
      "Outsourcing production to external workshops (cutting, sewing, finishing). Tracked via the Vendor Ledger.",
    definitionAr:
      "تفويض عمليات التصنيع (قص، خياطة، تشطيب) لورش خارجية. بيتم تتبع العهد والمخزون الخارجي عن طريق سجل الموردين.",
    category: "MANUFACTURING",
    relatedTerms: ["vendor-ledger", "production-order"],
  },

  // ── INVENTORY ───────────────────────────────────────────────────────
  {
    slug: "matrix-sku",
    termEn: "Matrix SKU",
    termAr: "مصفوفة الموديلات",
    definitionEn:
      "A product structure where one 'parent' item (e.g. Classic Hoodie) branches into multiple variants by Color × Size × Fit.",
    definitionAr:
      "هيكل المنتج اللي بيسمح بإنه موديل واحد (مثلاً هودي كلاسيك) يتفرع لعدة باريشنات حسب اللون × المقاس × القصة.",
    category: "INVENTORY",
    relatedTerms: ["bom", "virtual-bundle"],
  },
  {
    slug: "virtual-bundle",
    termEn: "Virtual Bundle",
    termAr: "طقم افتراضي",
    definitionEn:
      "A 'set' product that doesn't physically exist — when sold, the system deducts the individual component items from stock.",
    definitionAr:
      "منتج \"طقم\" مبيكنش موجود كقطعة في المخزن. لما بيتباع، السيستم بيخصم المكونات الفردية (قميص + بنطلون) من المخزن.",
    category: "INVENTORY",
    relatedTerms: ["matrix-sku"],
  },
  {
    slug: "dead-stock",
    termEn: "Dead Stock",
    termAr: "المخزون الراكد",
    definitionEn:
      "SKUs with zero sales movement for 30+ days. The system alerts you to run promotions or discounts.",
    definitionAr:
      "الموديلات اللي بقالها 30 يوم أو أكتر مبتتحركش في المخزن. السيستم بينبهك عشان تعمل عروض أو خصومات لتحريكها.",
    category: "INVENTORY",
    relatedTerms: ["burn-rate"],
  },

  // ── SHIPPING ────────────────────────────────────────────────────────
  {
    slug: "reconciliation",
    termEn: "Shipping Reconciliation",
    termAr: "تسوية الشحن",
    definitionEn:
      "Matching the shipping company's financial statement against your internal orders to find discrepancies, hidden fees, or missing payments.",
    definitionAr:
      "عملية مطابقة كشف حساب شركة الشحن مع طلباتك الداخلية لاكتشاف أي فروقات في الـ COD أو رسوم مخفية أو مدفوعات ناقصة.",
    category: "SHIPPING",
    relatedTerms: ["hidden-fee", "shipping-wallet"],
  },
  {
    slug: "hidden-fee",
    termEn: "Hidden Fee",
    termAr: "رسوم مخفية",
    definitionEn:
      "An unexpected shipping charge that doesn't match the agreed rate. Flagged automatically during reconciliation.",
    definitionAr:
      "رسوم شحن غير متوقعة مش موجودة في الاتفاق. السيستم بيكتشفها أوتوماتيك أثناء التسوية وبيعلّمها باللون الأحمر.",
    category: "SHIPPING",
    relatedTerms: ["reconciliation"],
  },
  {
    slug: "shipping-wallet",
    termEn: "Shipping Wallet (In-Transit Cash)",
    termAr: "محفظة الشحن (كاش في الطريق)",
    definitionEn:
      "Money collected by shipping companies on your behalf (COD) that hasn't been transferred to your bank account yet.",
    definitionAr:
      "الفلوس اللي شركة الشحن جمعتها لحسابك (الدفع عند الاستلام) بس لسه ما حوّلتهاش لحسابك البنكي. ده رقم مهم جداً في حساب السيولة.",
    category: "SHIPPING",
    relatedTerms: ["reconciliation", "cash-flow"],
  },
  {
    slug: "cod",
    termEn: "COD (Cash on Delivery)",
    termAr: "الدفع عند الاستلام",
    definitionEn:
      "Payment method where the customer pays the shipping courier upon delivery. The courier then transfers the money to you.",
    definitionAr:
      "طريقة دفع بيدفع فيها العميل للمندوب لحظة الاستلام. الشركة بتحوّل الفلوس دي ليك بعد كده (عادة أسبوعياً).",
    category: "SHIPPING",
    relatedTerms: ["shipping-wallet"],
  },

  // ── SALES ───────────────────────────────────────────────────────────
  {
    slug: "return-loss",
    termEn: "Return Loss",
    termAr: "خسارة المرتجع",
    definitionEn:
      "The full financial penalty of a return: Forward Shipping + Return Shipping + Refurbishment + Platform Commission.",
    definitionAr:
      "الخسارة الكاملة من المرتجع: شحن ذهاب + شحن إياب + تكلفة إعادة تجهيز + عمولة المنصة. ده رقم بيوريك التكلفة الحقيقية لكل مرتجع.",
    category: "SALES",
    relatedTerms: ["platform-commission", "true-profit"],
  },
  {
    slug: "smart-pricing",
    termEn: "Smart Pricing",
    termAr: "التسعير الذكي",
    definitionEn:
      "An engine that calculates the optimal selling price: Price = COGS / (1 - Target Margin% - Return Rate% - Commission%).",
    definitionAr:
      "محرك بيحسبلك سعر البيع الأمثل بناءً على: التكلفة الحقيقية ÷ (1 - نسبة الربح - نسبة المرتجعات - عمولة المنصة).",
    category: "SALES",
    relatedTerms: ["cogs", "return-loss", "platform-commission"],
  },
  {
    slug: "vendor-ledger",
    termEn: "Vendor Ledger",
    termAr: "سجل الموردين",
    definitionEn:
      "An immutable financial record for each supplier/workshop tracking invoices, payments, and outstanding balances.",
    definitionAr:
      "سجل مالي غير قابل للحذف لكل مورد أو ورشة. بيتتبع الفواتير والمدفوعات والأرصدة المعلقة. التعديل بيتم عن طريق عكسيات فقط.",
    category: "ACCOUNTING",
    relatedTerms: ["sub-contracting"],
  },
];

/**
 * Quick lookup map: slug → GlossaryEntry
 */
export const GLOSSARY_MAP = new Map<string, GlossaryEntry>(
  GLOSSARY_DATA.map((entry) => [entry.slug, entry])
);

/**
 * Category labels in Arabic
 */
export const CATEGORY_LABELS: Record<string, { en: string; ar: string; icon: string }> = {
  ACCOUNTING: { en: "Accounting", ar: "محاسبة", icon: "💰" },
  MANUFACTURING: { en: "Manufacturing", ar: "تصنيع", icon: "🏭" },
  SHIPPING: { en: "Shipping", ar: "شحن", icon: "🚚" },
  INVENTORY: { en: "Inventory", ar: "مخزون", icon: "📦" },
  SALES: { en: "Sales", ar: "مبيعات", icon: "🛒" },
};
