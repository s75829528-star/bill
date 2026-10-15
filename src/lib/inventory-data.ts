// ── Nexora Inventory Module — Mock Data Layer ──────────────────────
// All data here is static/mock. No backend, no Supabase, no API calls.
// Structured so it can be swapped for real API responses later without
// changing component shapes.

// ── Enums & Status Types ──────────────────────────────────────────
export type StockStatus = "in-stock" | "low-stock" | "out-of-stock" | "critical";
export type POStatus =
  | "draft"
  | "pending-approval"
  | "approved"
  | "ordered"
  | "partially-received"
  | "received"
  | "cancelled";
export type PaymentStatus = "paid" | "partial" | "unpaid" | "overdue";
export type MovementType = "in" | "out" | "adjustment";
export type AdjustmentType = "increase" | "decrease";
export type AdjustmentReason =
  | "damaged"
  | "returned"
  | "expired"
  | "lost"
  | "found"
  | "cycle-count"
  | "quality-rejection"
  | "manual";
export type ApprovalStatus = "approved" | "pending" | "rejected";
export type ActivityType =
  | "product-added"
  | "product-updated"
  | "stock-in"
  | "stock-out"
  | "stock-adjusted"
  | "po-created"
  | "po-approved"
  | "po-received"
  | "supplier-added"
  | "barcode-generated"
  | "inventory-updated";

// ── Core Entity Types ─────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  description: string;
  productCount: number;
  color: string;
}

export interface Brand {
  id: string;
  name: string;
  description: string;
  productCount: number;
  logoInitial: string;
  color: string;
  status: "active" | "inactive";
  website?: string;
  logoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Unit {
  id: string;
  name: string;
  shortCode: string;
  isCustom: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstNumber: string;
  pan: string;
  city: string;
  address: string;
  state: string;
  pincode: string;
  paymentTerms: string; // e.g. "Net 30", "Net 45", "Advance"
  leadTimeDays: number;
  outstandingAmount: number;
  rating: number;
  totalPurchases: number;
  productsSupplied: number;
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
  notes?: string;
}

export interface ProductImage {
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  subcategory?: string;
  brandId: string;
  unitId: string;
  supplierId: string;
  manufacturer?: string;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
  costPrice: number;
  taxPercent: number;
  hsnCode: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderQty: number;
  leadTimeDays: number;
  weight?: number; // kg
  dimensions?: { l: number; w: number; h: number }; // cm
  color?: string;
  size?: string;
  material?: string;
  status: "active" | "inactive" | "archived";
  description: string;
  internalNotes?: string;
  tags?: string[];
  emoji: string;
  images?: ProductImage[];
}

export interface PurchaseOrderItem {
  productId: string;
  quantity: number;
  receivedQty?: number;
  unitPrice: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  status: POStatus;
  createdDate: string;
  expectedDate: string;
  items: PurchaseOrderItem[];
  /** Database item IDs used when recording a goods receipt. */
  itemIds?: Record<string, string>;
  notes: string;
  supplierNotes?: string;
  approvedBy?: string;
  approvedDate?: string;
  referenceNumber?: string;
}

export interface GoodsReceivedNote {
  id: string;
  grnNumber: string;
  poId: string;
  supplierId: string;
  receivedDate: string;
  receivedBy: string;
  items: { productId: string; orderedQty: number; receivedQty: number; qualityStatus: "ok" | "partial" | "rejected" }[];
  notes: string;
  referenceNumber?: string;
}

export interface PurchaseBill {
  id: string;
  billNumber: string;
  poNumber: string;
  purchaseOrderId?: string;
  supplierId: string;
  billDate: string;
  dueDate: string;
  subtotal: number;
  gstAmount: number;
  total: number;
  paymentStatus: PaymentStatus;
  amountPaid: number;
}

export interface StockMovement {
  id: string;
  type: MovementType;
  referenceNumber: string;
  productId: string;
  quantity: number;
  supplierId?: string;
  reason?: string;
  adjustmentReason?: AdjustmentReason;
  invoiceRef?: string;
  adjustmentType?: AdjustmentType;
  approvalStatus?: ApprovalStatus;
  warehouse: string;
  notes: string;
  date: string;
  time: string;
  performedBy?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  manager: string;
  phone: string;
  totalCapacity: number; // sq ft
  usedCapacity: number; // sq ft
  zones: WarehouseZone[];
  isDefault: boolean;
}

export interface WarehouseZone {
  id: string;
  name: string;
  type: "rack" | "bin" | "floor" | "cold-storage";
  capacity: number;
  used: number;
  locationCode: string;
}

export interface ActivityLog {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  date: string;
  time: string;
  user: string;
  referenceId?: string;
  referenceType?: string;
}

// ── Units ─────────────────────────────────────────────────────────

export const units: Unit[] = [
  { id: "u1", name: "Piece", shortCode: "pc", isCustom: false },
  { id: "u2", name: "Kilogram", shortCode: "kg", isCustom: false },
  { id: "u3", name: "Gram", shortCode: "g", isCustom: false },
  { id: "u4", name: "Liter", shortCode: "L", isCustom: false },
  { id: "u5", name: "Box", shortCode: "box", isCustom: false },
  { id: "u6", name: "Packet", shortCode: "pkt", isCustom: false },
  { id: "u7", name: "Dozen", shortCode: "dz", isCustom: false },
  { id: "u8", name: "Meter", shortCode: "m", isCustom: false },
  { id: "u9", name: "Carton (12-pack)", shortCode: "ctn", isCustom: true },
  { id: "u10", name: "Set", shortCode: "set", isCustom: false },
  { id: "u11", name: "Pair", shortCode: "pr", isCustom: false },
];

// ── Categories ────────────────────────────────────────────────────

export const categories: Category[] = [
  { id: "c1", name: "Computers & Laptops", description: "Laptops, desktops, and computing accessories", productCount: 4, color: "bg-blue-500" },
  { id: "c2", name: "Peripherals", description: "Keyboards, mice, and input devices", productCount: 3, color: "bg-violet-500" },
  { id: "c3", name: "Networking", description: "Routers, switches, and networking gear", productCount: 1, color: "bg-emerald-500" },
  { id: "c4", name: "Storage Devices", description: "SSDs, HDDs, and external storage", productCount: 2, color: "bg-amber-500" },
  { id: "c5", name: "Security & Surveillance", description: "CCTV cameras and security systems", productCount: 1, color: "bg-red-500" },
  { id: "c6", name: "Printers & Scanners", description: "Printing and scanning equipment", productCount: 2, color: "bg-cyan-500" },
  { id: "c7", name: "Power & Backup", description: "UPS units and power accessories", productCount: 1, color: "bg-orange-500" },
  { id: "c8", name: "Office Furniture", description: "Chairs, desks, and workspace furniture", productCount: 2, color: "bg-pink-500" },
];

// ── Suppliers ─────────────────────────────────────────────────────

export const suppliers: Supplier[] = [
  {
    id: "s1", name: "Ingram Micro India Pvt Ltd", contactPerson: "Rakesh Malhotra",
    phone: "+91 98200 11223", email: "rakesh.m@ingrammicro.in",
    gstNumber: "27AAACI1234M1Z5", pan: "AAACI1234M",
    city: "Mumbai", address: "4th Floor, Infinity Tower, Mindspace, Malad West", state: "Maharashtra", pincode: "400064",
    paymentTerms: "Net 30", leadTimeDays: 5,
    outstandingAmount: 84500, rating: 4.6, totalPurchases: 1245000, productsSupplied: 6,
    bankName: "HDFC Bank", accountNumber: "50100112233445", ifsc: "HDFC0001234",
    notes: "Preferred distributor for Dell and Samsung products.",
  },
  {
    id: "s2", name: "Redington India Ltd", contactPerson: "Sunita Iyer",
    phone: "+91 98450 33421", email: "sunita.iyer@redington.co.in",
    gstNumber: "33AAACR5678N1Z2", pan: "AAACR5678N",
    city: "Chennai", address: "SPL Guindy House, 95 Mount Road, Guindy", state: "Tamil Nadu", pincode: "600032",
    paymentTerms: "Net 45", leadTimeDays: 7,
    outstandingAmount: 32000, rating: 4.3, totalPurchases: 876000, productsSupplied: 4,
    bankName: "ICICI Bank", accountNumber: "003201234567", ifsc: "ICIC0000032",
    notes: "Secondary distributor for HP and TP-Link.",
  },
  {
    id: "s3", name: "Rashi Peripherals Pvt Ltd", contactPerson: "Vivek Deshmukh",
    phone: "+91 99870 44556", email: "vivek.d@rptechindia.com",
    gstNumber: "27AABCR4321P1Z8", pan: "AABCR4321P",
    city: "Pune", address: "Survey No. 24, Baner Road, Baner", state: "Maharashtra", pincode: "411045",
    paymentTerms: "Advance", leadTimeDays: 3,
    outstandingAmount: 0, rating: 4.8, totalPurchases: 542000, productsSupplied: 3,
    bankName: "Axis Bank", accountNumber: "917010012345678", ifsc: "UTIB0000247",
    notes: "Top-rated. Fastest delivery. Great for Logitech and accessories.",
  },
  {
    id: "s4", name: "Savex Technologies", contactPerson: "Anita Kulkarni",
    phone: "+91 98220 77889", email: "anita.k@savex.in",
    gstNumber: "27AADCS9988Q1Z3", pan: "AADCS9988Q",
    city: "Nagpur", address: "Plot No. 12, MIDC Industrial Area, Hingna Road", state: "Maharashtra", pincode: "440016",
    paymentTerms: "Net 30", leadTimeDays: 10,
    outstandingAmount: 18900, rating: 4.1, totalPurchases: 298000, productsSupplied: 2,
    bankName: "SBI", accountNumber: "38991234567", ifsc: "SBIN0001234",
  },
  {
    id: "s5", name: "Neoteric Infomatique Ltd", contactPerson: "Manoj Bhatt",
    phone: "+91 98120 99001", email: "manoj.bhatt@neoteric.co.in",
    gstNumber: "07AABCN6655R1Z1", pan: "AABCN6655R",
    city: "Delhi", address: "D-246, Okhla Industrial Area Phase I", state: "Delhi", pincode: "110020",
    paymentTerms: "Net 60", leadTimeDays: 8,
    outstandingAmount: 51200, rating: 3.9, totalPurchases: 421000, productsSupplied: 3,
    bankName: "Kotak Mahindra Bank", accountNumber: "6712345678", ifsc: "KKBK0001234",
    notes: "New terms negotiated. Review before next PO.",
  },
];

// ── Products ──────────────────────────────────────────────────────

export const products: Product[] = [
  {
    id: "p1", name: "Dell Vostro 15 Laptop", sku: "DEL-VOS15-001", barcode: "8901234500011",
    categoryId: "c1", subcategory: "Business Laptops", brandId: "b1", unitId: "u1", supplierId: "s1",
    manufacturer: "Dell Technologies Inc.", purchasePrice: 42000, sellingPrice: 49999, mrp: 52000, costPrice: 41500,
    taxPercent: 18, hsnCode: "8471", currentStock: 14, minStock: 5, maxStock: 40, reorderQty: 20, leadTimeDays: 5,
    weight: 1.85, dimensions: { l: 35.9, w: 23.5, h: 1.85 }, color: "Black", material: "ABS Plastic",
    status: "active", description: "15.6-inch business laptop, Core i5, 8GB RAM, 512GB SSD",
    internalNotes: "Popular model. Ensure 2-week buffer before festive season.", tags: ["laptop", "business", "dell", "bestseller"],
    emoji: "💻",
  },
  {
    id: "p2", name: "HP ProBook 440 Laptop", sku: "HP-PB440-002", barcode: "8901234500028",
    categoryId: "c1", subcategory: "Business Laptops", brandId: "b2", unitId: "u1", supplierId: "s2",
    manufacturer: "HP Inc.", purchasePrice: 45500, sellingPrice: 53990, mrp: 56000, costPrice: 44800,
    taxPercent: 18, hsnCode: "8471", currentStock: 3, minStock: 5, maxStock: 30, reorderQty: 15, leadTimeDays: 7,
    weight: 1.6, dimensions: { l: 32.5, w: 22.7, h: 1.79 }, color: "Silver",
    status: "active", description: "14-inch professional laptop, Core i5, 16GB RAM, 512GB SSD",
    tags: ["laptop", "hp", "14-inch"], emoji: "💻",
  },
  {
    id: "p3", name: "Samsung 24\" LED Monitor", sku: "SAM-MON24-003", barcode: "8901234500035",
    categoryId: "c1", subcategory: "Monitors", brandId: "b4", unitId: "u1", supplierId: "s1",
    manufacturer: "Samsung Electronics", purchasePrice: 8200, sellingPrice: 10999, mrp: 12000, costPrice: 8000,
    taxPercent: 18, hsnCode: "8528", currentStock: 22, minStock: 8, maxStock: 60, reorderQty: 25, leadTimeDays: 5,
    weight: 3.4, dimensions: { l: 56.5, w: 35.8, h: 21.5 }, color: "Black",
    status: "active", description: "24-inch Full HD LED monitor with HDMI + VGA",
    tags: ["monitor", "samsung", "24-inch", "full-hd"], emoji: "🖥️",
  },
  {
    id: "p4", name: "Logitech K120 Keyboard", sku: "LOG-KB120-004", barcode: "8901234500042",
    categoryId: "c2", subcategory: "Keyboards", brandId: "b3", unitId: "u1", supplierId: "s3",
    manufacturer: "Logitech International", purchasePrice: 350, sellingPrice: 549, mrp: 599, costPrice: 330,
    taxPercent: 18, hsnCode: "8471", currentStock: 86, minStock: 20, maxStock: 200, reorderQty: 100, leadTimeDays: 3,
    weight: 0.48, color: "Black",
    status: "active", description: "USB wired keyboard, spill-resistant",
    tags: ["keyboard", "logitech", "wired", "usb"], emoji: "⌨️",
  },
  {
    id: "p5", name: "Logitech M100 Mouse", sku: "LOG-MS100-005", barcode: "8901234500059",
    categoryId: "c2", subcategory: "Mice", brandId: "b3", unitId: "u1", supplierId: "s3",
    manufacturer: "Logitech International", purchasePrice: 220, sellingPrice: 399, mrp: 449, costPrice: 205,
    taxPercent: 18, hsnCode: "8471", currentStock: 4, minStock: 15, maxStock: 150, reorderQty: 75, leadTimeDays: 3,
    weight: 0.1, color: "Black",
    status: "active", description: "Optical USB mouse, 1000 DPI",
    tags: ["mouse", "logitech", "wired"], emoji: "🖱️",
  },
  {
    id: "p6", name: "HP LaserJet Pro M15w Printer", sku: "HP-PRN15-006", barcode: "8901234500066",
    categoryId: "c6", subcategory: "Laser Printers", brandId: "b2", unitId: "u1", supplierId: "s2",
    manufacturer: "HP Inc.", purchasePrice: 9800, sellingPrice: 12499, mrp: 13500, costPrice: 9600,
    taxPercent: 18, hsnCode: "8443", currentStock: 7, minStock: 4, maxStock: 25, reorderQty: 10, leadTimeDays: 7,
    weight: 4.7, color: "White",
    status: "active", description: "Compact monochrome laser printer with WiFi",
    tags: ["printer", "hp", "wifi", "laser"], emoji: "🖨️",
  },
  {
    id: "p7", name: "HP ScanJet Pro 2000 Scanner", sku: "HP-SCN20-007", barcode: "8901234500073",
    categoryId: "c6", subcategory: "Scanners", brandId: "b2", unitId: "u1", supplierId: "s4",
    manufacturer: "HP Inc.", purchasePrice: 13500, sellingPrice: 16999, mrp: 18000, costPrice: 13200,
    taxPercent: 18, hsnCode: "8471", currentStock: 0, minStock: 3, maxStock: 15, reorderQty: 8, leadTimeDays: 10,
    weight: 2.8, color: "White",
    status: "active", description: "Flatbed document scanner, 25 ppm",
    tags: ["scanner", "hp", "flatbed"], emoji: "🖨️",
  },
  {
    id: "p8", name: "APC 1100VA UPS", sku: "APC-UPS11-008", barcode: "8901234500080",
    categoryId: "c7", subcategory: "Line-Interactive UPS", brandId: "b7", unitId: "u1", supplierId: "s5",
    manufacturer: "APC by Schneider Electric", purchasePrice: 4200, sellingPrice: 5799, mrp: 6200, costPrice: 4100,
    taxPercent: 18, hsnCode: "8504", currentStock: 11, minStock: 6, maxStock: 40, reorderQty: 20, leadTimeDays: 8,
    weight: 8.2,
    status: "active", description: "Line-interactive UPS with surge protection",
    tags: ["ups", "apc", "power-backup"], emoji: "🔌",
  },
  {
    id: "p9", name: "TP-Link Archer C6 Router", sku: "TPL-ARC6-009", barcode: "8901234500097",
    categoryId: "c3", subcategory: "WiFi Routers", brandId: "b5", unitId: "u1", supplierId: "s2",
    manufacturer: "TP-Link Technologies", purchasePrice: 2400, sellingPrice: 3299, mrp: 3500, costPrice: 2300,
    taxPercent: 18, hsnCode: "8517", currentStock: 2, minStock: 8, maxStock: 50, reorderQty: 25, leadTimeDays: 7,
    weight: 0.32, color: "Black",
    status: "active", description: "AC1200 dual-band WiFi router",
    tags: ["router", "tp-link", "wifi", "ac1200"], emoji: "📡",
  },
  {
    id: "p10", name: "CP Plus 4-Channel CCTV Kit", sku: "CPP-CCTV4-010", barcode: "8901234500103",
    categoryId: "c5", subcategory: "CCTV Kits", brandId: "b6", unitId: "u1", supplierId: "s5",
    manufacturer: "CP PLUS International", purchasePrice: 11200, sellingPrice: 14999, mrp: 16000, costPrice: 11000,
    taxPercent: 18, hsnCode: "8525", currentStock: 5, minStock: 3, maxStock: 20, reorderQty: 10, leadTimeDays: 8,
    status: "active", description: "4-channel HD CCTV kit with 2 dome + 2 bullet cameras",
    tags: ["cctv", "security", "4-channel", "cp-plus"], emoji: "📷",
  },
  {
    id: "p11", name: "Samsung 500GB SSD 870 EVO", sku: "SAM-SSD5-011", barcode: "8901234500110",
    categoryId: "c4", subcategory: "Internal SSD", brandId: "b4", unitId: "u1", supplierId: "s1",
    manufacturer: "Samsung Electronics", purchasePrice: 3400, sellingPrice: 4499, mrp: 4799, costPrice: 3300,
    taxPercent: 18, hsnCode: "8471", currentStock: 18, minStock: 10, maxStock: 80, reorderQty: 40, leadTimeDays: 5,
    weight: 0.054,
    status: "active", description: "SATA III internal SSD, 560MB/s read",
    tags: ["ssd", "samsung", "500gb", "sata"], emoji: "💾",
  },
  {
    id: "p12", name: "Seagate 1TB HDD Barracuda", sku: "SEA-HDD1-012", barcode: "8901234500127",
    categoryId: "c4", subcategory: "Internal HDD", brandId: "b4", unitId: "u1", supplierId: "s3",
    manufacturer: "Seagate Technology", purchasePrice: 2600, sellingPrice: 3399, mrp: 3699, costPrice: 2500,
    taxPercent: 18, hsnCode: "8471", currentStock: 1, minStock: 10, maxStock: 60, reorderQty: 30, leadTimeDays: 3,
    weight: 0.46,
    status: "active", description: "3.5-inch internal hard drive, 7200 RPM",
    tags: ["hdd", "seagate", "1tb", "barracuda"], emoji: "💾",
  },
  {
    id: "p13", name: "Corsair 8GB DDR4 RAM", sku: "COR-RAM8-013", barcode: "8901234500134",
    categoryId: "c1", subcategory: "Memory Modules", brandId: "b1", unitId: "u1", supplierId: "s4",
    manufacturer: "Corsair Gaming", purchasePrice: 1650, sellingPrice: 2299, mrp: 2499, costPrice: 1600,
    taxPercent: 18, hsnCode: "8473", currentStock: 34, minStock: 12, maxStock: 100, reorderQty: 50, leadTimeDays: 10,
    weight: 0.034,
    status: "active", description: "8GB DDR4 3200MHz desktop RAM module",
    tags: ["ram", "corsair", "8gb", "ddr4"], emoji: "🧠",
  },
  {
    id: "p14", name: "HDMI Cable 1.5m", sku: "GEN-HDMI1-014", barcode: "8901234500141",
    categoryId: "c2", subcategory: "Cables & Connectors", brandId: "b3", unitId: "u1", supplierId: "s3",
    manufacturer: "Generic / Logitech Accessories", purchasePrice: 90, sellingPrice: 199, mrp: 249, costPrice: 85,
    taxPercent: 18, hsnCode: "8544", currentStock: 120, minStock: 30, maxStock: 300, reorderQty: 150, leadTimeDays: 3,
    weight: 0.12, color: "Black",
    status: "active", description: "High-speed HDMI 2.0 cable, 1.5 meters",
    tags: ["hdmi", "cable", "1.5m"], emoji: "🔗",
  },
  {
    id: "p15", name: "Godrej Ergonomic Office Chair", sku: "GOD-CHR01-015", barcode: "8901234500158",
    categoryId: "c8", subcategory: "Ergonomic Chairs", brandId: "b8", unitId: "u1", supplierId: "s5",
    manufacturer: "Godrej & Boyce Mfg Co Ltd", purchasePrice: 6800, sellingPrice: 8999, mrp: 9999, costPrice: 6650,
    taxPercent: 18, hsnCode: "9401", currentStock: 9, minStock: 4, maxStock: 30, reorderQty: 15, leadTimeDays: 8,
    weight: 12.5, color: "Black", material: "Mesh + Nylon",
    status: "active", description: "Mesh-back ergonomic chair with lumbar support",
    tags: ["chair", "ergonomic", "godrej", "office"], emoji: "🪑",
  },
  {
    id: "p16", name: "Godrej Study Office Desk", sku: "GOD-DSK01-016", barcode: "8901234500165",
    categoryId: "c8", subcategory: "Office Desks", brandId: "b8", unitId: "u1", supplierId: "s5",
    manufacturer: "Godrej & Boyce Mfg Co Ltd", purchasePrice: 7200, sellingPrice: 9499, mrp: 10499, costPrice: 7050,
    taxPercent: 18, hsnCode: "9403", currentStock: 3, minStock: 4, maxStock: 20, reorderQty: 10, leadTimeDays: 8,
    weight: 28.0, dimensions: { l: 120, w: 60, h: 75 }, color: "Wenge", material: "Engineered Wood",
    status: "active", description: "Engineered wood office desk, 120x60cm",
    tags: ["desk", "office", "godrej", "furniture"], emoji: "🪑",
  },
];

// ── Purchase Orders ───────────────────────────────────────────────

export const purchaseOrders: PurchaseOrder[] = [
  {
    id: "po1", poNumber: "PO-2026-0041", supplierId: "s1", status: "received",
    createdDate: "2026-07-01", expectedDate: "2026-07-06",
    items: [
      { productId: "p1", quantity: 10, receivedQty: 10, unitPrice: 42000 },
      { productId: "p3", quantity: 15, receivedQty: 15, unitPrice: 8200 },
    ],
    notes: "Quarterly laptop + monitor restock",
    approvedBy: "Priya Sharma", approvedDate: "2026-07-02",
  },
  {
    id: "po2", poNumber: "PO-2026-0042", supplierId: "s2", status: "approved",
    createdDate: "2026-07-03", expectedDate: "2026-07-10",
    items: [
      { productId: "p2", quantity: 12, receivedQty: 0, unitPrice: 45500 },
      { productId: "p9", quantity: 20, receivedQty: 0, unitPrice: 2400 },
    ],
    notes: "Urgent — HP ProBook low stock",
    approvedBy: "Rahul Mehta", approvedDate: "2026-07-04",
  },
  {
    id: "po3", poNumber: "PO-2026-0043", supplierId: "s3", status: "pending-approval",
    createdDate: "2026-07-08", expectedDate: "2026-07-15",
    items: [
      { productId: "p5", quantity: 50, receivedQty: 0, unitPrice: 220 },
      { productId: "p14", quantity: 200, receivedQty: 0, unitPrice: 90 },
    ],
    notes: "Peripherals bulk order",
  },
  {
    id: "po4", poNumber: "PO-2026-0044", supplierId: "s4", status: "ordered",
    createdDate: "2026-07-09", expectedDate: "2026-07-16",
    items: [
      { productId: "p7", quantity: 8, receivedQty: 0, unitPrice: 13500 },
      { productId: "p12", quantity: 20, receivedQty: 0, unitPrice: 2600 },
    ],
    notes: "Restock scanners + HDDs",
    approvedBy: "Priya Sharma", approvedDate: "2026-07-09",
    referenceNumber: "REF-SAV-2026-88",
  },
  {
    id: "po5", poNumber: "PO-2026-0045", supplierId: "s5", status: "cancelled",
    createdDate: "2026-06-28", expectedDate: "2026-07-04",
    items: [{ productId: "p10", quantity: 6, receivedQty: 0, unitPrice: 11200 }],
    notes: "Cancelled — supplier price revision",
  },
  {
    id: "po6", poNumber: "PO-2026-0046", supplierId: "s1", status: "partially-received",
    createdDate: "2026-07-11", expectedDate: "2026-07-18",
    items: [
      { productId: "p11", quantity: 25, receivedQty: 10, unitPrice: 3400 },
      { productId: "p13", quantity: 20, receivedQty: 20, unitPrice: 1650 },
    ],
    notes: "SSD restock ahead of festive season",
    approvedBy: "Rahul Mehta", approvedDate: "2026-07-11",
  },
  {
    id: "po7", poNumber: "PO-2026-0047", supplierId: "s3", status: "draft",
    createdDate: "2026-07-13", expectedDate: "2026-07-20",
    items: [{ productId: "p4", quantity: 100, receivedQty: 0, unitPrice: 350 }],
    notes: "Auto-drafted from low stock alert",
  },
];

// ── Goods Received Notes ──────────────────────────────────────────

export const goodsReceivedNotes: GoodsReceivedNote[] = [
  {
    id: "grn1", grnNumber: "GRN-2026-0201", poId: "po1", supplierId: "s1",
    receivedDate: "2026-07-06", receivedBy: "Amit Kumar",
    items: [
      { productId: "p1", orderedQty: 10, receivedQty: 10, qualityStatus: "ok" },
      { productId: "p3", orderedQty: 15, receivedQty: 15, qualityStatus: "ok" },
    ],
    notes: "All items received in good condition.", referenceNumber: "ING-DLV-2026-441",
  },
  {
    id: "grn2", grnNumber: "GRN-2026-0202", poId: "po6", supplierId: "s1",
    receivedDate: "2026-07-13", receivedBy: "Ravi Sinha",
    items: [
      { productId: "p11", orderedQty: 25, receivedQty: 10, qualityStatus: "partial" },
      { productId: "p13", orderedQty: 20, receivedQty: 20, qualityStatus: "ok" },
    ],
    notes: "Samsung SSD partial delivery. Balance 15 units expected by July 18.", referenceNumber: "ING-DLV-2026-459",
  },
];

// ── Purchase Bills ────────────────────────────────────────────────

export const purchaseBills: PurchaseBill[] = [
  { id: "pb1", billNumber: "BILL-2026-0091", poNumber: "PO-2026-0041", supplierId: "s1", billDate: "2026-07-06", dueDate: "2026-07-21", subtotal: 543000, gstAmount: 97740, total: 640740, paymentStatus: "paid", amountPaid: 640740 },
  { id: "pb2", billNumber: "BILL-2026-0092", poNumber: "PO-2026-0042", supplierId: "s2", billDate: "2026-07-10", dueDate: "2026-07-25", subtotal: 594000, gstAmount: 106920, total: 700920, paymentStatus: "partial", amountPaid: 400000 },
  { id: "pb3", billNumber: "BILL-2026-0093", poNumber: "PO-2026-0039", supplierId: "s3", billDate: "2026-06-20", dueDate: "2026-07-05", subtotal: 88000, gstAmount: 15840, total: 103840, paymentStatus: "overdue", amountPaid: 0 },
  { id: "pb4", billNumber: "BILL-2026-0094", poNumber: "PO-2026-0038", supplierId: "s4", billDate: "2026-06-15", dueDate: "2026-06-30", subtotal: 45500, gstAmount: 8190, total: 53690, paymentStatus: "unpaid", amountPaid: 0 },
  { id: "pb5", billNumber: "BILL-2026-0095", poNumber: "PO-2026-0037", supplierId: "s5", billDate: "2026-06-10", dueDate: "2026-06-25", subtotal: 67200, gstAmount: 12096, total: 79296, paymentStatus: "paid", amountPaid: 79296 },
];

// ── Stock Movements (In / Out / Adjustments) ─────────────────────

export const stockMovements: StockMovement[] = [
  { id: "sm1", type: "in", referenceNumber: "GRN-2026-0201", productId: "p1", quantity: 10, supplierId: "s1", warehouse: "Main Warehouse", notes: "Received against PO-2026-0041", date: "2026-07-06", time: "10:15 AM", performedBy: "Amit Kumar" },
  { id: "sm2", type: "in", referenceNumber: "GRN-2026-0201", productId: "p3", quantity: 15, supplierId: "s1", warehouse: "Main Warehouse", notes: "Received against PO-2026-0041", date: "2026-07-06", time: "10:20 AM", performedBy: "Amit Kumar" },
  { id: "sm3", type: "out", referenceNumber: "SO-2026-0501", productId: "p4", quantity: 14, invoiceRef: "INV-2026-0041", reason: "Sale", warehouse: "Main Warehouse", notes: "Sold to Gupta & Sons", date: "2026-07-11", time: "3:45 PM", performedBy: "Suresh Yadav" },
  { id: "sm4", type: "out", referenceNumber: "SO-2026-0502", productId: "p11", quantity: 6, invoiceRef: "INV-2026-0044", reason: "Sale", warehouse: "Main Warehouse", notes: "Sold to Priya Traders", date: "2026-07-12", time: "11:05 AM", performedBy: "Suresh Yadav" },
  { id: "sm5", type: "adjustment", referenceNumber: "ADJ-2026-0031", productId: "p12", quantity: 3, adjustmentType: "decrease", adjustmentReason: "damaged", approvalStatus: "approved", reason: "Damaged in storage", warehouse: "Main Warehouse", notes: "3 units damaged due to moisture", date: "2026-07-10", time: "5:30 PM", performedBy: "Ravi Sinha" },
  { id: "sm6", type: "adjustment", referenceNumber: "ADJ-2026-0032", productId: "p9", quantity: 2, adjustmentType: "decrease", adjustmentReason: "cycle-count", approvalStatus: "pending", reason: "Stock count mismatch", warehouse: "Main Warehouse", notes: "Found short during cycle count", date: "2026-07-12", time: "9:10 AM", performedBy: "Amit Kumar" },
  { id: "sm7", type: "in", referenceNumber: "GRN-2026-0203", productId: "p13", quantity: 40, supplierId: "s4", warehouse: "Main Warehouse", notes: "Bulk RAM restock", date: "2026-07-09", time: "1:00 PM", performedBy: "Ravi Sinha" },
  { id: "sm8", type: "out", referenceNumber: "SO-2026-0503", productId: "p5", quantity: 20, invoiceRef: "INV-2026-0046", reason: "Sale", warehouse: "Main Warehouse", notes: "Sold to Halcyon Group", date: "2026-07-12", time: "4:20 PM", performedBy: "Suresh Yadav" },
  { id: "sm9", type: "adjustment", referenceNumber: "ADJ-2026-0033", productId: "p2", quantity: 1, adjustmentType: "increase", adjustmentReason: "found", approvalStatus: "approved", reason: "Found extra unit during audit", warehouse: "Main Warehouse", notes: "Reconciled after physical count", date: "2026-07-08", time: "2:15 PM", performedBy: "Amit Kumar" },
  { id: "sm10", type: "in", referenceNumber: "GRN-2026-0204", productId: "p15", quantity: 12, supplierId: "s5", warehouse: "Main Warehouse", notes: "Office chairs restock", date: "2026-07-05", time: "12:00 PM", performedBy: "Ravi Sinha" },
  { id: "sm11", type: "out", referenceNumber: "SO-2026-0504", productId: "p1", quantity: 3, invoiceRef: "INV-2026-0048", reason: "Sale", warehouse: "Main Warehouse", notes: "Sold to Cascade Foods Pvt Ltd", date: "2026-07-13", time: "9:30 AM", performedBy: "Suresh Yadav" },
  { id: "sm12", type: "adjustment", referenceNumber: "ADJ-2026-0034", productId: "p7", quantity: 1, adjustmentType: "decrease", adjustmentReason: "returned", approvalStatus: "approved", reason: "Customer return — defective unit", warehouse: "Main Warehouse", notes: "Return processed. Unit sent to service center.", date: "2026-07-13", time: "11:00 AM", performedBy: "Ravi Sinha" },
  { id: "sm13", type: "in", referenceNumber: "GRN-2026-0202", productId: "p11", quantity: 10, supplierId: "s1", warehouse: "Main Warehouse", notes: "Partial delivery against PO-2026-0046", date: "2026-07-13", time: "2:00 PM", performedBy: "Amit Kumar" },
];

// ── Warehouses ────────────────────────────────────────────────────

export const warehouses: Warehouse[] = [
  {
    id: "w1", name: "Main Warehouse", code: "WH-MUM-01",
    address: "Plot 14-B, MIDC Andheri Industrial Estate", city: "Mumbai",
    state: "Maharashtra", pincode: "400093", manager: "Amit Kumar",
    phone: "+91 98200 55667", totalCapacity: 8000, usedCapacity: 5200, isDefault: true,
    zones: [
      { id: "z1", name: "Zone A — Electronics", type: "rack", capacity: 2000, used: 1650, locationCode: "A" },
      { id: "z2", name: "Zone B — Peripherals", type: "rack", capacity: 1500, used: 900, locationCode: "B" },
      { id: "z3", name: "Zone C — Furniture", type: "floor", capacity: 2500, used: 1800, locationCode: "C" },
      { id: "z4", name: "Zone D — Staging Area", type: "bin", capacity: 1000, used: 520, locationCode: "D" },
      { id: "z5", name: "Zone E — Returns & QC", type: "bin", capacity: 500, used: 330, locationCode: "E" },
      { id: "z6", name: "Cold Storage (Spare Parts)", type: "cold-storage", capacity: 500, used: 0, locationCode: "F" },
    ],
  },
];

// ── Activity Log ──────────────────────────────────────────────────

export const activityLog: ActivityLog[] = [
  { id: "al1", type: "stock-in", title: "Stock Received", description: "10 × Dell Vostro 15 Laptop received (GRN-2026-0201)", date: "2026-07-13", time: "2:00 PM", user: "Amit Kumar", referenceId: "sm13", referenceType: "movement" },
  { id: "al2", type: "stock-out", title: "Stock Issued", description: "3 × Dell Vostro 15 Laptop sold (INV-2026-0048)", date: "2026-07-13", time: "9:30 AM", user: "Suresh Yadav", referenceId: "sm11", referenceType: "movement" },
  { id: "al3", type: "stock-adjusted", title: "Stock Adjusted", description: "HP ScanJet Pro 2000 Scanner — 1 unit customer return", date: "2026-07-13", time: "11:00 AM", user: "Ravi Sinha", referenceId: "sm12", referenceType: "movement" },
  { id: "al4", type: "po-created", title: "Purchase Order Drafted", description: "PO-2026-0047 drafted for Rashi Peripherals (100 × Logitech K120)", date: "2026-07-13", time: "8:45 AM", user: "System", referenceId: "po7", referenceType: "po" },
  { id: "al5", type: "stock-out", title: "Stock Issued", description: "20 × Logitech M100 Mouse sold (INV-2026-0046)", date: "2026-07-12", time: "4:20 PM", user: "Suresh Yadav", referenceId: "sm8", referenceType: "movement" },
  { id: "al6", type: "stock-adjusted", title: "Stock Adjusted", description: "TP-Link Router — 2 units short (cycle count mismatch, pending approval)", date: "2026-07-12", time: "9:10 AM", user: "Amit Kumar", referenceId: "sm6", referenceType: "movement" },
  { id: "al7", type: "stock-out", title: "Stock Issued", description: "6 × Samsung 500GB SSD sold (INV-2026-0044)", date: "2026-07-12", time: "11:05 AM", user: "Suresh Yadav", referenceId: "sm4", referenceType: "movement" },
  { id: "al8", type: "stock-in", title: "Stock Received", description: "40 × Corsair 8GB DDR4 RAM received (GRN-2026-0203)", date: "2026-07-09", time: "1:00 PM", user: "Ravi Sinha", referenceId: "sm7", referenceType: "movement" },
  { id: "al9", type: "stock-adjusted", title: "Stock Adjusted", description: "Seagate 1TB HDD — 3 units damaged in storage", date: "2026-07-10", time: "5:30 PM", user: "Ravi Sinha", referenceId: "sm5", referenceType: "movement" },
  { id: "al10", type: "po-approved", title: "Purchase Order Approved", description: "PO-2026-0046 approved by Rahul Mehta", date: "2026-07-11", time: "10:00 AM", user: "Rahul Mehta", referenceId: "po6", referenceType: "po" },
];

// ── Helpers ───────────────────────────────────────────────────────

export function getCategory(id: string) { return categories.find((c) => c.id === id); }
export function getUnit(id: string) { return units.find((u) => u.id === id); }
export function getSupplier(id: string) { return suppliers.find((s) => s.id === id); }
export function getProduct(id: string) { return products.find((p) => p.id === id); }
export function getWarehouse(id: string) { return warehouses.find((w) => w.id === id); }

export function getStockStatus(product: Product): StockStatus {
  if (product.currentStock <= 0) return "out-of-stock";
  if (product.currentStock <= Math.floor(product.minStock * 0.5)) return "critical";
  if (product.currentStock <= product.minStock) return "low-stock";
  return "in-stock";
}

export function stockValue(product: Product) {
  return product.currentStock * product.purchasePrice;
}

export function totalStockValue() {
  return products.reduce((sum, p) => sum + stockValue(p), 0);
}

export function fmtINR(v: number) {
  return "₹" + v.toLocaleString("en-IN");
}

export function reorderQty(product: Product) {
  return product.reorderQty ?? Math.max(Math.ceil((product.maxStock - product.currentStock) * 0.6), product.minStock);
}

export function estimatedDaysRemaining(product: Product): number | null {
  // Based on average daily out-movements from stockMovements
  const outMovements = stockMovements.filter((m) => m.type === "out" && m.productId === product.id);
  if (outMovements.length === 0) return null;
  const totalOut = outMovements.reduce((s, m) => s + m.quantity, 0);
  const uniqueDates = new Set(outMovements.map((m) => m.date)).size;
  const avgDailyUsage = uniqueDates > 0 ? totalOut / uniqueDates : 0;
  if (avgDailyUsage <= 0) return null;
  return Math.floor(product.currentStock / avgDailyUsage);
}

export const ADJUSTMENT_REASONS: { value: AdjustmentReason; label: string }[] = [
  { value: "damaged", label: "Damaged Goods" },
  { value: "returned", label: "Customer Return" },
  { value: "expired", label: "Expired / Obsolete" },
  { value: "lost", label: "Lost / Stolen" },
  { value: "found", label: "Found (surplus)" },
  { value: "cycle-count", label: "Cycle Count Correction" },
  { value: "quality-rejection", label: "Quality Rejection" },
  { value: "manual", label: "Manual Adjustment" },
];
