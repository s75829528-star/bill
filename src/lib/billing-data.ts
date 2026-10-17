// ── Nexora Billing Module — Mock Data Layer ────────────────────────
// All data here is static/mock. No backend, no Supabase, no API calls.
// Structured so it can be swapped for real API responses later without
// changing component shapes. Reuses `products` from inventory-data.ts
// so invoice line items can be built from the same catalog.

import { products, type Product } from "@/lib/inventory-data";
import { computeDocumentTotals } from "./invoice-math";
export { computeLineItem, computeDocumentTotals, invoiceGrandTotal, invoiceBalance } from "./invoice-math";

export type InvoiceStatus = "draft" | "sent" | "paid" | "partial" | "overdue" | "cancelled";
export type PaymentMode = "cash" | "upi" | "card" | "bank-transfer" | "neft" | "rtgs" | "credit" | "wallet" | "cheque";
export type PaymentStatus = "paid" | "pending" | "partial" | "overdue";
export type QuotationStatus = "draft" | "sent" | "approved" | "rejected" | "expired" | "converted";
export type RecurringFrequency = "daily" | "weekly" | "monthly" | "quarterly" | "half-yearly" | "yearly" | "custom";
export type RecurringStatus = "active" | "paused" | "completed" | "cancelled" | "expired";
export type CreditNoteStatus = "draft" | "issued" | "applied" | "voided";
export type PaymentTxnStatus = "received" | "pending" | "refunded" | "cancelled" | "voided" | "failed" | "completed";
export type CustomerType = "retail" | "wholesale" | "distributor" | "corporate" | "government";
export type DocumentType = "invoice" | "quotation" | "proforma" | "delivery-challan" | "credit-note" | "debit-note" | "recurring";

export interface Customer {
  id: string;
  name: string;
  contactPerson: string;
  gstin: string;
  pan: string;
  phone: string;
  email: string;
  address: string;
  shippingAddress: string;
  alternateShippingAddresses: string[];
  city: string;
  state: string;
  customerType: CustomerType;
  creditLimit: number;
  creditDays: number;
  outstandingBalance: number;
  totalPurchases: number;
  lastPurchase: string;
  customerRating: number; // 1-5
}

export interface InvoiceItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  gstPercent: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  paymentMode: PaymentMode;
  items: InvoiceItem[];
  createdDate: string;
  dueDate: string;
  amountPaid: number;
  notes: string;
  internalNotes?: string;
  terms: string;
  placeOfSupply: string;
  isInterState: boolean;
  // Enterprise fields (optional for backward-compat with existing mock data)
  salesperson?: string;
  referenceNumber?: string;
  poNumber?: string;
  deliveryDate?: string;
  deliveryAddress?: string;
  billingAddress?: string;
  currency?: string;
  exchangeRate?: number;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  customerId: string;
  status: QuotationStatus;
  items: InvoiceItem[];
  createdDate: string;
  expiryDate: string;
  convertedInvoiceId?: string;
  convertedInvoiceNumber?: string;
  billingAddress: string;
  notes: string;
  internalNotes: string;
  terms: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreditNoteItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  gstPercent: number;
}

export interface CreditNote {
  id: string;
  creditNoteNumber: string;
  creditNoteDate: string;
  invoiceId: string;
  customerId: string;
  reason: string;
  notes: string;
  items: CreditNoteItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  /** @deprecated use grandTotal */
  amount: number;
  status: CreditNoteStatus;
  createdDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface DebitNote {
  id: string;
  debitNoteNumber: string;
  invoiceId: string;
  customerId: string;
  amount: number;
  reason: string;
  status: "issued" | "settled";
  createdDate: string;
}

export interface ProformaInvoice {
  id: string;
  proformaNumber: string;
  customerId: string;
  items: InvoiceItem[];
  createdDate: string;
  validUntil: string;
  notes: string;
  status: "draft" | "sent" | "converted" | "expired";
  convertedInvoiceId?: string;
}

export interface DeliveryChallan {
  id: string;
  challanNumber: string;
  invoiceId?: string;
  customerId: string;
  items: InvoiceItem[];
  createdDate: string;
  deliveryDate: string;
  deliveryAddress: string;
  vehicleNumber?: string;
  driverName?: string;
  status: "draft" | "in-transit" | "delivered" | "returned";
}

export interface RecurringInvoiceItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  gstPercent: number;
}

export interface RecurringInvoice {
  id: string;
  seriesNumber?: string;
  templateName: string;
  customerId: string;
  frequency: RecurringFrequency;
  customIntervalDays?: number;
  startDate: string;
  endDate?: string;
  nextBillingDate: string;
  lastGeneratedDate?: string;
  status: RecurringStatus;
  currency?: string;
  notes?: string;
  terms?: string;
  items?: RecurringInvoiceItem[];
  /** Computed grand total across all line items */
  amount: number;
  /** Human-readable summary of items (auto-generated) */
  itemsSummary: string;
  invoicesGenerated: number;
}

export interface PaymentTxn {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  customerId: string;
  amount: number;
  mode: PaymentMode;
  status: PaymentTxnStatus;
  date: string;
  time: string;
  notes: string;
  transactionRef?: string;
  // Populated from DB joins for display
  invoiceNumber?: string;
  customerName?: string;
  customerCity?: string;
  currency?: string;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  accentColor: string;
  isDefault: boolean;
}

export interface Salesperson {
  id: string;
  name: string;
  email: string;
  phone: string;
  region: string;
  totalSales: number;
}

export interface ActivityEvent {
  id: string;
  type: "invoice-created" | "invoice-paid" | "invoice-edited" | "invoice-printed" | "draft-saved" | "payment-received" | "quotation-sent" | "credit-note-issued";
  title: string;
  subtitle: string;
  timestamp: string;
  invoiceId?: string;
  amount?: number;
}

// ── Company (issuer) profile ───────────────────────────────────────

export const company = {
  name: "Nexora Retail Solutions Pvt Ltd",
  gstin: "27AAFCN4455K1Z9",
  pan: "AAFCN4455K",
  address: "4th Floor, Prestige Tech Park, Kadubeesanahalli, Bengaluru, Karnataka 560103",
  phone: "+91 80 4567 8900",
  email: "billing@nexora.app",
  bankName: "HDFC Bank",
  accountNumber: "50200098765432",
  ifsc: "HDFC0001234",
  state: "Karnataka",
};

// ── Salespersons ──────────────────────────────────────────────────

export const salespersons: Salesperson[] = [
  { id: "sp1", name: "Arjun Mehta", email: "arjun@nexora.app", phone: "+91 98451 00001", region: "South", totalSales: 542000 },
  { id: "sp2", name: "Divya Krishnan", email: "divya@nexora.app", phone: "+91 98451 00002", region: "North", totalSales: 389000 },
  { id: "sp3", name: "Rohan Verma", email: "rohan@nexora.app", phone: "+91 98451 00003", region: "West", totalSales: 610000 },
  { id: "sp4", name: "Sneha Patel", email: "sneha@nexora.app", phone: "+91 98451 00004", region: "East", totalSales: 275000 },
];

// ── Customers ───────────────────────────────────────────────────────

export const customers: Customer[] = [
  {
    id: "cu1",
    name: "Priya Traders",
    contactPerson: "Priya Sharma",
    gstin: "29AABCU9603R1ZM",
    pan: "AABCU9603R",
    phone: "+91 98450 12345",
    email: "priya@priyatraders.in",
    address: "12 MG Road, Bengaluru, Karnataka 560001",
    shippingAddress: "12 MG Road, Bengaluru, Karnataka 560001",
    alternateShippingAddresses: ["Warehouse 3, Peenya Industrial Area, Bengaluru 560058"],
    city: "Bengaluru",
    state: "Karnataka",
    customerType: "retail",
    creditLimit: 200000,
    creditDays: 30,
    outstandingBalance: 24780,
    totalPurchases: 987450,
    lastPurchase: "2026-07-10",
    customerRating: 5,
  },
  {
    id: "cu2",
    name: "Gupta & Sons",
    contactPerson: "Rajesh Gupta",
    gstin: "07AAACG1234N1Z8",
    pan: "AAACG1234N",
    phone: "+91 98110 22334",
    email: "rajesh@guptasons.co.in",
    address: "45 Chandni Chowk, New Delhi 110006",
    shippingAddress: "45 Chandni Chowk, New Delhi 110006",
    alternateShippingAddresses: ["Plot 12, Naraina Industrial Area, New Delhi 110028"],
    city: "New Delhi",
    state: "Delhi",
    customerType: "wholesale",
    creditLimit: 150000,
    creditDays: 15,
    outstandingBalance: 18900,
    totalPurchases: 634200,
    lastPurchase: "2026-07-11",
    customerRating: 4,
  },
  {
    id: "cu3",
    name: "Halcyon Group",
    contactPerson: "Ananya Iyer",
    gstin: "33AAECH5678M1Z3",
    pan: "AAECH5678M",
    phone: "+91 94440 55667",
    email: "ananya@halcyongroup.in",
    address: "78 Anna Salai, Chennai, Tamil Nadu 600002",
    shippingAddress: "78 Anna Salai, Chennai, Tamil Nadu 600002",
    alternateShippingAddresses: [
      "Halcyon Warehouse, Ambattur Industrial Estate, Chennai 600058",
      "Halcyon South Hub, OMR Road, Chennai 600097",
    ],
    city: "Chennai",
    state: "Tamil Nadu",
    customerType: "corporate",
    creditLimit: 500000,
    creditDays: 45,
    outstandingBalance: 120000,
    totalPurchases: 2450000,
    lastPurchase: "2026-07-12",
    customerRating: 4,
  },
  {
    id: "cu4",
    name: "Sundar Electronics",
    contactPerson: "Sundar Rajan",
    gstin: "33AABFS2345P1Z1",
    pan: "AABFS2345P",
    phone: "+91 90030 88990",
    email: "sundar@sundarelectronics.com",
    address: "22 Ranganathan St, Chennai, Tamil Nadu 600017",
    shippingAddress: "22 Ranganathan St, Chennai, Tamil Nadu 600017",
    alternateShippingAddresses: [],
    city: "Chennai",
    state: "Tamil Nadu",
    customerType: "retail",
    creditLimit: 100000,
    creditDays: 7,
    outstandingBalance: 0,
    totalPurchases: 412300,
    lastPurchase: "2026-07-09",
    customerRating: 5,
  },
  {
    id: "cu5",
    name: "Meera Enterprises",
    contactPerson: "Meera Nair",
    gstin: "32AABCM6789Q1Z6",
    pan: "AABCM6789Q",
    phone: "+91 94950 66778",
    email: "meera@meeraenterprises.in",
    address: "9 MG Road, Kochi, Kerala 682016",
    shippingAddress: "9 MG Road, Kochi, Kerala 682016",
    alternateShippingAddresses: ["Meera Cold Store, Edappally, Kochi 682024"],
    city: "Kochi",
    state: "Kerala",
    customerType: "distributor",
    creditLimit: 300000,
    creditDays: 30,
    outstandingBalance: 8400,
    totalPurchases: 780000,
    lastPurchase: "2026-07-12",
    customerRating: 4,
  },
  {
    id: "cu6",
    name: "Om Distributors",
    contactPerson: "Omkar Patil",
    gstin: "27AABCO7890R1Z4",
    pan: "AABCO7890R",
    phone: "+91 98220 99887",
    email: "omkar@omdistributors.in",
    address: "31 FC Road, Pune, Maharashtra 411005",
    shippingAddress: "31 FC Road, Pune, Maharashtra 411005",
    alternateShippingAddresses: ["Om Godown, Bhosari MIDC, Pune 411026"],
    city: "Pune",
    state: "Maharashtra",
    customerType: "wholesale",
    creditLimit: 250000,
    creditDays: 30,
    outstandingBalance: 45200,
    totalPurchases: 1120000,
    lastPurchase: "2026-06-30",
    customerRating: 3,
  },
  {
    id: "cu7",
    name: "Kavya Retail Hub",
    contactPerson: "Kavya Reddy",
    gstin: "36AABCK8901S1Z2",
    pan: "AABCK8901S",
    phone: "+91 90000 11223",
    email: "kavya@kavyaretail.in",
    address: "5 Jubilee Hills, Hyderabad, Telangana 500033",
    shippingAddress: "5 Jubilee Hills, Hyderabad, Telangana 500033",
    alternateShippingAddresses: [
      "Kavya Store 2, Kukatpally, Hyderabad 500072",
      "Kavya Outlet 3, Gachibowli, Hyderabad 500032",
    ],
    city: "Hyderabad",
    state: "Telangana",
    customerType: "retail",
    creditLimit: 400000,
    creditDays: 21,
    outstandingBalance: 61000,
    totalPurchases: 1680000,
    lastPurchase: "2026-07-08",
    customerRating: 4,
  },
  {
    id: "cu8",
    name: "Deshmukh Traders",
    contactPerson: "Vivek Deshmukh",
    gstin: "27AABCD9012T1Z9",
    pan: "AABCD9012T",
    phone: "+91 98600 33445",
    email: "vivek@deshmukhtraders.in",
    address: "17 JM Road, Pune, Maharashtra 411004",
    shippingAddress: "17 JM Road, Pune, Maharashtra 411004",
    alternateShippingAddresses: [],
    city: "Pune",
    state: "Maharashtra",
    customerType: "retail",
    creditLimit: 75000,
    creditDays: 7,
    outstandingBalance: 0,
    totalPurchases: 218700,
    lastPurchase: "2026-07-13",
    customerRating: 5,
  },
];

// ── Invoices ──────────────────────────────────────────────────────

export const invoices: Invoice[] = [
  {
    id: "inv1",
    invoiceNumber: "INV-2026-0041",
    customerId: "cu2",
    status: "paid",
    paymentStatus: "paid",
    paymentMode: "upi",
    items: [{ productId: "p4", quantity: 14, unitPrice: 549, discountPercent: 5, gstPercent: 18 }],
    createdDate: "2026-07-11",
    dueDate: "2026-07-18",
    amountPaid: 8121,
    notes: "Thank you for your business.",
    terms: "Payment due within 7 days.",
    placeOfSupply: "Delhi",
    isInterState: true,
    salesperson: "Divya Krishnan",
    referenceNumber: "REF-GS-001",
  },
  {
    id: "inv2",
    invoiceNumber: "INV-2026-0042",
    customerId: "cu1",
    status: "partial",
    paymentStatus: "partial",
    paymentMode: "bank-transfer",
    items: [
      { productId: "p1", quantity: 1, unitPrice: 49999, discountPercent: 0, gstPercent: 18 },
      { productId: "p5", quantity: 2, unitPrice: 399, discountPercent: 0, gstPercent: 18 },
    ],
    createdDate: "2026-07-10",
    dueDate: "2026-07-20",
    amountPaid: 30000,
    notes: "",
    terms: "Payment due within 10 days.",
    placeOfSupply: "Karnataka",
    isInterState: false,
    salesperson: "Arjun Mehta",
    poNumber: "PO-PT-2026-004",
  },
  {
    id: "inv3",
    invoiceNumber: "INV-2026-0043",
    customerId: "cu3",
    status: "overdue",
    paymentStatus: "overdue",
    paymentMode: "credit",
    items: [{ productId: "p2", quantity: 2, unitPrice: 53990, discountPercent: 2, gstPercent: 18 }],
    createdDate: "2026-06-25",
    dueDate: "2026-07-05",
    amountPaid: 0,
    notes: "Follow up required.",
    terms: "Payment due within 10 days.",
    placeOfSupply: "Tamil Nadu",
    isInterState: true,
    salesperson: "Arjun Mehta",
    referenceNumber: "REF-HG-009",
    poNumber: "PO-HG-2026-021",
  },
  {
    id: "inv4",
    invoiceNumber: "INV-2026-0044",
    customerId: "cu1",
    status: "paid",
    paymentStatus: "paid",
    paymentMode: "card",
    items: [{ productId: "p11", quantity: 6, unitPrice: 4499, discountPercent: 0, gstPercent: 18 }],
    createdDate: "2026-07-12",
    dueDate: "2026-07-19",
    amountPaid: 31853,
    notes: "",
    terms: "Payment due within 7 days.",
    placeOfSupply: "Karnataka",
    isInterState: false,
    salesperson: "Arjun Mehta",
  },
  {
    id: "inv5",
    invoiceNumber: "INV-2026-0045",
    customerId: "cu5",
    status: "sent",
    paymentStatus: "pending",
    paymentMode: "upi",
    items: [
      { productId: "p6", quantity: 1, unitPrice: 12499, discountPercent: 0, gstPercent: 18 },
      { productId: "p14", quantity: 5, unitPrice: 199, discountPercent: 0, gstPercent: 18 },
    ],
    createdDate: "2026-07-12",
    dueDate: "2026-07-22",
    amountPaid: 0,
    notes: "",
    terms: "Payment due within 10 days.",
    placeOfSupply: "Kerala",
    isInterState: true,
    salesperson: "Sneha Patel",
    referenceNumber: "REF-ME-014",
  },
  {
    id: "inv6",
    invoiceNumber: "INV-2026-0046",
    customerId: "cu3",
    status: "paid",
    paymentStatus: "paid",
    paymentMode: "bank-transfer",
    items: [{ productId: "p5", quantity: 20, unitPrice: 399, discountPercent: 8, gstPercent: 18 }],
    createdDate: "2026-07-12",
    dueDate: "2026-07-19",
    amountPaid: 8646,
    notes: "Bulk order discount applied.",
    terms: "Payment due within 7 days.",
    placeOfSupply: "Tamil Nadu",
    isInterState: true,
    salesperson: "Arjun Mehta",
  },
  {
    id: "inv7",
    invoiceNumber: "INV-2026-0047",
    customerId: "cu6",
    status: "overdue",
    paymentStatus: "overdue",
    paymentMode: "credit",
    items: [{ productId: "p8", quantity: 8, unitPrice: 5799, discountPercent: 0, gstPercent: 18 }],
    createdDate: "2026-06-20",
    dueDate: "2026-06-30",
    amountPaid: 0,
    notes: "Second reminder sent.",
    terms: "Payment due within 10 days.",
    placeOfSupply: "Maharashtra",
    isInterState: false,
    salesperson: "Rohan Verma",
    referenceNumber: "REF-OD-007",
  },
  {
    id: "inv8",
    invoiceNumber: "INV-2026-0048",
    customerId: "cu7",
    status: "partial",
    paymentStatus: "partial",
    paymentMode: "wallet",
    items: [
      { productId: "p10", quantity: 4, unitPrice: 14999, discountPercent: 3, gstPercent: 18 },
    ],
    createdDate: "2026-07-08",
    dueDate: "2026-07-18",
    amountPaid: 40000,
    notes: "",
    terms: "Payment due within 10 days.",
    placeOfSupply: "Telangana",
    isInterState: true,
    salesperson: "Rohan Verma",
    poNumber: "PO-KR-2026-008",
  },
  {
    id: "inv9",
    invoiceNumber: "INV-2026-0049",
    customerId: "cu4",
    status: "paid",
    paymentStatus: "paid",
    paymentMode: "cash",
    items: [{ productId: "p3", quantity: 3, unitPrice: 10999, discountPercent: 0, gstPercent: 18 }],
    createdDate: "2026-07-09",
    dueDate: "2026-07-16",
    amountPaid: 38937,
    notes: "",
    terms: "Payment due within 7 days.",
    placeOfSupply: "Tamil Nadu",
    isInterState: false,
    salesperson: "Arjun Mehta",
  },
  {
    id: "inv10",
    invoiceNumber: "INV-2026-0050",
    customerId: "cu8",
    status: "draft",
    paymentStatus: "pending",
    paymentMode: "bank-transfer",
    items: [
      { productId: "p13", quantity: 10, unitPrice: 2299, discountPercent: 0, gstPercent: 18 },
    ],
    createdDate: "2026-07-13",
    dueDate: "2026-07-23",
    amountPaid: 0,
    notes: "Awaiting confirmation from customer.",
    internalNotes: "Customer prefers RTGS payment. Check stock before dispatch.",
    terms: "Payment due within 10 days.",
    placeOfSupply: "Maharashtra",
    isInterState: false,
    salesperson: "Rohan Verma",
    referenceNumber: "REF-DT-003",
  },
  {
    id: "inv11",
    invoiceNumber: "INV-2026-0051",
    customerId: "cu2",
    status: "sent",
    paymentStatus: "pending",
    paymentMode: "upi",
    items: [{ productId: "p9", quantity: 3, unitPrice: 3299, discountPercent: 0, gstPercent: 18 }],
    createdDate: "2026-07-13",
    dueDate: "2026-07-23",
    amountPaid: 0,
    notes: "",
    terms: "Payment due within 10 days.",
    placeOfSupply: "Delhi",
    isInterState: true,
    salesperson: "Divya Krishnan",
  },
  {
    id: "inv12",
    invoiceNumber: "INV-2026-0052",
    customerId: "cu6",
    status: "cancelled",
    paymentStatus: "pending",
    paymentMode: "cash",
    items: [{ productId: "p15", quantity: 2, unitPrice: 8999, discountPercent: 0, gstPercent: 18 }],
    createdDate: "2026-07-02",
    dueDate: "2026-07-12",
    amountPaid: 0,
    notes: "Order cancelled by customer.",
    terms: "Payment due within 10 days.",
    placeOfSupply: "Maharashtra",
    isInterState: false,
    salesperson: "Rohan Verma",
  },
];

// ── Quotations ────────────────────────────────────────────────────

const _emptyQT = {
  billingAddress: "",
  internalNotes: "",
  terms: "",
  subtotal: 0,
  discountTotal: 0,
  taxTotal: 0,
  grandTotal: 0,
  createdAt: "",
  updatedAt: "",
};

export const quotations: Quotation[] = [
  {
    ..._emptyQT,
    id: "qt1",
    quoteNumber: "QUO-2026-0021",
    customerId: "cu5",
    status: "sent",
    items: [{ productId: "p1", quantity: 2, unitPrice: 49999, discountPercent: 4, gstPercent: 18 }],
    createdDate: "2026-07-08",
    expiryDate: "2026-07-22",
    notes: "Bulk laptop order for new office.",
  },
  {
    ..._emptyQT,
    id: "qt2",
    quoteNumber: "QUO-2026-0022",
    customerId: "cu7",
    status: "converted",
    items: [
      { productId: "p10", quantity: 6, unitPrice: 14999, discountPercent: 2, gstPercent: 18 },
    ],
    createdDate: "2026-07-05",
    expiryDate: "2026-07-19",
    convertedInvoiceId: "inv8",
    notes: "",
  },
  {
    ..._emptyQT,
    id: "qt3",
    quoteNumber: "QUO-2026-0023",
    customerId: "cu4",
    status: "draft",
    items: [
      { productId: "p3", quantity: 10, unitPrice: 10999, discountPercent: 5, gstPercent: 18 },
    ],
    createdDate: "2026-07-12",
    expiryDate: "2026-07-26",
    notes: "Awaiting final specs from customer.",
  },
  {
    ..._emptyQT,
    id: "qt4",
    quoteNumber: "QUO-2026-0024",
    customerId: "cu6",
    status: "expired",
    items: [{ productId: "p9", quantity: 15, unitPrice: 3299, discountPercent: 0, gstPercent: 18 }],
    createdDate: "2026-06-10",
    expiryDate: "2026-06-24",
    notes: "",
  },
  {
    ..._emptyQT,
    id: "qt5",
    quoteNumber: "QUO-2026-0025",
    customerId: "cu8",
    status: "rejected",
    items: [{ productId: "p16", quantity: 5, unitPrice: 9499, discountPercent: 0, gstPercent: 18 }],
    createdDate: "2026-07-01",
    expiryDate: "2026-07-15",
    notes: "Customer opted for a different vendor.",
  },
  {
    ..._emptyQT,
    id: "qt6",
    quoteNumber: "QUO-2026-0026",
    customerId: "cu3",
    status: "sent",
    items: [{ productId: "p2", quantity: 4, unitPrice: 53990, discountPercent: 3, gstPercent: 18 }],
    createdDate: "2026-07-13",
    expiryDate: "2026-07-27",
    notes: "",
  },
];

// ── Proforma Invoices ─────────────────────────────────────────────

export const proformaInvoices: ProformaInvoice[] = [
  {
    id: "pi1",
    proformaNumber: "PRO-2026-0001",
    customerId: "cu3",
    status: "sent",
    items: [{ productId: "p1", quantity: 5, unitPrice: 49999, discountPercent: 3, gstPercent: 18 }],
    createdDate: "2026-07-10",
    validUntil: "2026-07-24",
    notes: "Proforma for bulk laptop procurement. Subject to stock availability.",
    convertedInvoiceId: undefined,
  },
  {
    id: "pi2",
    proformaNumber: "PRO-2026-0002",
    customerId: "cu5",
    status: "converted",
    items: [{ productId: "p10", quantity: 8, unitPrice: 14999, discountPercent: 2, gstPercent: 18 }],
    createdDate: "2026-07-01",
    validUntil: "2026-07-15",
    notes: "Converted to INV-2026-0045.",
    convertedInvoiceId: "inv5",
  },
  {
    id: "pi3",
    proformaNumber: "PRO-2026-0003",
    customerId: "cu7",
    status: "draft",
    items: [
      { productId: "p8", quantity: 12, unitPrice: 5799, discountPercent: 5, gstPercent: 18 },
      { productId: "p9", quantity: 10, unitPrice: 3299, discountPercent: 0, gstPercent: 18 },
    ],
    createdDate: "2026-07-13",
    validUntil: "2026-07-27",
    notes: "Pending customer approval.",
  },
];

// ── Delivery Challans ─────────────────────────────────────────────

export const deliveryChallans: DeliveryChallan[] = [
  {
    id: "dc1",
    challanNumber: "DC-2026-0001",
    invoiceId: "inv4",
    customerId: "cu1",
    items: [{ productId: "p11", quantity: 6, unitPrice: 4499, discountPercent: 0, gstPercent: 18 }],
    createdDate: "2026-07-12",
    deliveryDate: "2026-07-13",
    deliveryAddress: "12 MG Road, Bengaluru, Karnataka 560001",
    vehicleNumber: "KA-01-AB-1234",
    driverName: "Suresh Kumar",
    status: "delivered",
  },
  {
    id: "dc2",
    challanNumber: "DC-2026-0002",
    invoiceId: "inv8",
    customerId: "cu7",
    items: [{ productId: "p10", quantity: 4, unitPrice: 14999, discountPercent: 3, gstPercent: 18 }],
    createdDate: "2026-07-09",
    deliveryDate: "2026-07-11",
    deliveryAddress: "5 Jubilee Hills, Hyderabad, Telangana 500033",
    vehicleNumber: "TS-09-CD-5678",
    driverName: "Ravi Shankar",
    status: "delivered",
  },
  {
    id: "dc3",
    challanNumber: "DC-2026-0003",
    customerId: "cu3",
    items: [{ productId: "p2", quantity: 2, unitPrice: 53990, discountPercent: 2, gstPercent: 18 }],
    createdDate: "2026-07-13",
    deliveryDate: "2026-07-15",
    deliveryAddress: "Halcyon Warehouse, Ambattur Industrial Estate, Chennai 600058",
    vehicleNumber: "TN-09-EF-9012",
    status: "in-transit",
  },
];

// ── Debit Notes ───────────────────────────────────────────────────

export const debitNotes: DebitNote[] = [
  {
    id: "dn1",
    debitNoteNumber: "DN-2026-0001",
    invoiceId: "inv3",
    customerId: "cu3",
    amount: 5000,
    reason: "Short delivery — 1 unit not shipped, billed at full quantity",
    status: "issued",
    createdDate: "2026-07-06",
  },
  {
    id: "dn2",
    debitNoteNumber: "DN-2026-0002",
    invoiceId: "inv7",
    customerId: "cu6",
    amount: 2500,
    reason: "Price revision — rate increased after PO confirmation",
    status: "settled",
    createdDate: "2026-06-22",
  },
];

// ── Credit Notes ──────────────────────────────────────────────────

export const creditNotes: CreditNote[] = [
  {
    id: "cn1",
    creditNoteNumber: "CN-2026-0011",
    creditNoteDate: "2026-07-13",
    invoiceId: "inv1",
    customerId: "cu2",
    reason: "2 units returned — packaging damaged",
    notes: "",
    items: [],
    subtotal: 1098,
    discountTotal: 0,
    taxTotal: 0,
    grandTotal: 1098,
    amount: 1098,
    status: "issued" as CreditNoteStatus,
    createdDate: "2026-07-13",
    createdAt: "2026-07-13T00:00:00Z",
    updatedAt: "2026-07-13T00:00:00Z",
  },
  {
    id: "cn2",
    creditNoteNumber: "CN-2026-0012",
    creditNoteDate: "2026-07-13",
    invoiceId: "inv6",
    customerId: "cu3",
    reason: "Price correction after billing error",
    notes: "",
    items: [],
    subtotal: 3990,
    discountTotal: 0,
    taxTotal: 0,
    grandTotal: 3990,
    amount: 3990,
    status: "applied" as CreditNoteStatus,
    createdDate: "2026-07-13",
    createdAt: "2026-07-13T00:00:00Z",
    updatedAt: "2026-07-13T00:00:00Z",
  },
  {
    id: "cn3",
    creditNoteNumber: "CN-2026-0013",
    creditNoteDate: "2026-07-12",
    invoiceId: "inv9",
    customerId: "cu4",
    reason: "Product exchanged for different model",
    notes: "",
    items: [],
    subtotal: 10999,
    discountTotal: 0,
    taxTotal: 0,
    grandTotal: 10999,
    amount: 10999,
    status: "issued" as CreditNoteStatus,
    createdDate: "2026-07-12",
    createdAt: "2026-07-12T00:00:00Z",
    updatedAt: "2026-07-12T00:00:00Z",
  },
];

// ── Recurring Invoices ────────────────────────────────────────────

export const recurringInvoices: RecurringInvoice[] = [
  {
    id: "ri1",
    templateName: "Monthly AMC — Halcyon Group",
    customerId: "cu3",
    frequency: "monthly",
    nextBillingDate: "2026-08-01",
    startDate: "2026-01-01",
    amount: 15000,
    status: "active",
    itemsSummary: "Annual Maintenance Contract — IT Support",
    invoicesGenerated: 6,
  },
  {
    id: "ri2",
    templateName: "Quarterly Supply — Priya Traders",
    customerId: "cu1",
    frequency: "quarterly",
    nextBillingDate: "2026-09-15",
    startDate: "2026-03-15",
    amount: 42000,
    status: "active",
    itemsSummary: "Peripheral bulk restock",
    invoicesGenerated: 2,
  },
  {
    id: "ri3",
    templateName: "Weekly Consumables — Om Distributors",
    customerId: "cu6",
    frequency: "weekly",
    nextBillingDate: "2026-07-20",
    startDate: "2026-05-05",
    amount: 6800,
    status: "paused",
    itemsSummary: "Cables & consumables restock",
    invoicesGenerated: 10,
  },
  {
    id: "ri4",
    templateName: "Yearly Licensing — Kavya Retail Hub",
    customerId: "cu7",
    frequency: "yearly",
    nextBillingDate: "2027-01-10",
    startDate: "2026-01-10",
    amount: 96000,
    status: "active",
    itemsSummary: "Software licensing renewal",
    invoicesGenerated: 1,
  },
];

// ── Payments ──────────────────────────────────────────────────────

export const payments: PaymentTxn[] = [
  {
    id: "pay1",
    paymentNumber: "PMT-2026-1001",
    invoiceId: "inv1",
    customerId: "cu2",
    amount: 8121,
    mode: "upi",
    status: "received",
    date: "2026-07-11",
    time: "2:40 PM",
    notes: "Paid in full via UPI",
    transactionRef: "UPI-GS-20260711-001",
  },
  {
    id: "pay2",
    paymentNumber: "PMT-2026-1002",
    invoiceId: "inv2",
    customerId: "cu1",
    amount: 30000,
    mode: "bank-transfer",
    status: "received",
    date: "2026-07-10",
    time: "11:05 AM",
    notes: "Partial payment, balance pending",
    transactionRef: "HDFC-TXN-20260710-4521",
  },
  {
    id: "pay3",
    paymentNumber: "PMT-2026-1003",
    invoiceId: "inv4",
    customerId: "cu1",
    amount: 31853,
    mode: "card",
    status: "received",
    date: "2026-07-12",
    time: "4:15 PM",
    notes: "",
    transactionRef: "POS-20260712-7812",
  },
  {
    id: "pay4",
    paymentNumber: "PMT-2026-1004",
    invoiceId: "inv6",
    customerId: "cu3",
    amount: 8646,
    mode: "neft",
    status: "received",
    date: "2026-07-12",
    time: "9:30 AM",
    notes: "NEFT transfer from Halcyon Group HDFC account",
    transactionRef: "NEFT-HG-20260712-0012",
  },
  {
    id: "pay5",
    paymentNumber: "PMT-2026-1005",
    invoiceId: "inv8",
    customerId: "cu7",
    amount: 40000,
    mode: "rtgs",
    status: "received",
    date: "2026-07-08",
    time: "5:50 PM",
    notes: "Partial payment via RTGS",
    transactionRef: "RTGS-KR-20260708-0089",
  },
  {
    id: "pay6",
    paymentNumber: "PMT-2026-1006",
    invoiceId: "inv9",
    customerId: "cu4",
    amount: 38937,
    mode: "cash",
    status: "received",
    date: "2026-07-09",
    time: "1:20 PM",
    notes: "",
  },
  {
    id: "pay7",
    paymentNumber: "PMT-2026-1007",
    invoiceId: "inv3",
    customerId: "cu3",
    amount: 127182,
    mode: "credit",
    status: "pending",
    date: "2026-07-05",
    time: "10:00 AM",
    notes: "Awaiting customer settlement",
  },
  {
    id: "pay8",
    paymentNumber: "PMT-2026-1008",
    invoiceId: "inv7",
    customerId: "cu6",
    amount: 54744,
    mode: "credit",
    status: "pending",
    date: "2026-06-30",
    time: "9:00 AM",
    notes: "Overdue — reminder sent",
  },
  {
    id: "pay9",
    paymentNumber: "PMT-2026-1009",
    invoiceId: "inv6",
    customerId: "cu3",
    amount: 3990,
    mode: "bank-transfer",
    status: "refunded",
    date: "2026-07-13",
    time: "3:10 PM",
    notes: "Refund against CN-2026-0012",
    transactionRef: "HDFC-REF-20260713-0023",
  },
  {
    id: "pay10",
    paymentNumber: "PMT-2026-1010",
    invoiceId: "inv11",
    customerId: "cu2",
    amount: 5000,
    mode: "cheque",
    status: "pending",
    date: "2026-07-13",
    time: "11:00 AM",
    notes: "Cheque #450231 received, awaiting clearance",
    transactionRef: "CHQ-450231",
  },
];

// ── Invoice Templates ─────────────────────────────────────────────

export const invoiceTemplates = [
  {
    id: "tpl1",
    name: "Classic Blue",
    description: "Clean layout with a bold header band — the Nexora default.",
    accentColor: "#2563eb",
    isDefault: true,
  },
  {
    id: "tpl2",
    name: "Minimal Slate",
    description: "Understated, text-forward layout for professional services.",
    accentColor: "#475569",
    isDefault: false,
  },
  {
    id: "tpl3",
    name: "Emerald Retail",
    description: "Retail-friendly layout with a compact item table.",
    accentColor: "#059669",
    isDefault: false,
  },
  {
    id: "tpl4",
    name: "Amber Contractor",
    description: "Warm accent, ideal for contractors and trade businesses.",
    accentColor: "#d97706",
    isDefault: false,
  },
];

// ── Activity Feed ─────────────────────────────────────────────────

export const activityEvents: ActivityEvent[] = [
  { id: "ae1", type: "payment-received", title: "Payment received", subtitle: "PMT-2026-1009 · Refund to Halcyon Group", timestamp: "2026-07-13T15:10:00", invoiceId: "inv6", amount: 3990 },
  { id: "ae2", type: "invoice-created", title: "Invoice created", subtitle: "INV-2026-0052 · Deshmukh Traders", timestamp: "2026-07-13T10:30:00", invoiceId: "inv10" },
  { id: "ae3", type: "draft-saved", title: "Draft saved", subtitle: "INV-2026-0050 · Deshmukh Traders", timestamp: "2026-07-13T09:45:00", invoiceId: "inv10" },
  { id: "ae4", type: "invoice-paid", title: "Invoice paid in full", subtitle: "INV-2026-0044 · Priya Traders", timestamp: "2026-07-12T16:15:00", invoiceId: "inv4", amount: 31853 },
  { id: "ae5", type: "payment-received", title: "Payment received", subtitle: "PMT-2026-1004 · Halcyon Group via NEFT", timestamp: "2026-07-12T09:30:00", invoiceId: "inv6", amount: 8646 },
  { id: "ae6", type: "invoice-printed", title: "Invoice printed", subtitle: "INV-2026-0041 · Gupta & Sons", timestamp: "2026-07-11T14:40:00", invoiceId: "inv1" },
  { id: "ae7", type: "invoice-paid", title: "Invoice paid in full", subtitle: "INV-2026-0041 · Gupta & Sons", timestamp: "2026-07-11T14:30:00", invoiceId: "inv1", amount: 8121 },
  { id: "ae8", type: "invoice-edited", title: "Invoice updated", subtitle: "INV-2026-0042 · Priya Traders", timestamp: "2026-07-10T11:05:00", invoiceId: "inv2" },
  { id: "ae9", type: "quotation-sent", title: "Quotation sent", subtitle: "QUO-2026-0026 · Halcyon Group", timestamp: "2026-07-08T10:00:00" },
  { id: "ae10", type: "credit-note-issued", title: "Credit note issued", subtitle: "CN-2026-0013 · Sundar Electronics", timestamp: "2026-07-12T08:00:00", amount: 10999 },
];

// ── Helpers ───────────────────────────────────────────────────────

export function getCustomer(id: string) {
  return customers.find((c) => c.id === id);
}

export function getInvoice(id: string) {
  return invoices.find((i) => i.id === id);
}

export function getInvoiceProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function fmtINR(v: number) {
  return "₹" + Math.round(v).toLocaleString("en-IN");
}

export function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function quotationTotal(quotation: Quotation) {
  return computeDocumentTotals(quotation.items, false).grandTotal;
}

export function proformaTotal(pi: ProformaInvoice) {
  return computeDocumentTotals(pi.items, false).grandTotal;
}

export function nextInvoiceNumber() {
  const nums = invoices.map((i) => parseInt(i.invoiceNumber.split("-").pop() ?? "0", 10));
  const next = Math.max(0, ...nums) + 1;
  return `INV-2026-${String(next).padStart(4, "0")}`;
}

export function nextQuoteNumber() {
  const nums = quotations.map((q) => parseInt(q.quoteNumber.split("-").pop() ?? "0", 10));
  const next = Math.max(0, ...nums) + 1;
  return `QUO-2026-${String(next).padStart(4, "0")}`;
}

export function nextProformaNumber() {
  const nums = proformaInvoices.map((p) => parseInt(p.proformaNumber.split("-").pop() ?? "0", 10));
  const next = Math.max(0, ...nums) + 1;
  return `PRO-2026-${String(next).padStart(4, "0")}`;
}

export function nextChallanNumber() {
  const nums = deliveryChallans.map((d) => parseInt(d.challanNumber.split("-").pop() ?? "0", 10));
  const next = Math.max(0, ...nums) + 1;
  return `DC-2026-${String(next).padStart(4, "0")}`;
}

export function nextDebitNoteNumber() {
  const nums = debitNotes.map((d) => parseInt(d.debitNoteNumber.split("-").pop() ?? "0", 10));
  const next = Math.max(0, ...nums) + 1;
  return `DN-2026-${String(next).padStart(4, "0")}`;
}

export const paymentModeLabels: Record<PaymentMode, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  "bank-transfer": "Bank Transfer",
  neft: "NEFT",
  rtgs: "RTGS",
  credit: "Credit",
  wallet: "Wallet",
  cheque: "Cheque",
};

// ── Payment Terms presets ─────────────────────────────────────────

export const paymentTermsPresets = [
  { label: "Immediate (Due on receipt)", days: 0 },
  { label: "Net 7 days", days: 7 },
  { label: "Net 15 days", days: 15 },
  { label: "Net 30 days", days: 30 },
  { label: "Net 45 days", days: 45 },
  { label: "Net 60 days", days: 60 },
  { label: "Net 90 days", days: 90 },
  { label: "Custom", days: -1 },
];

// ── Supported Currencies ──────────────────────────────────────────

export const currencies = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
];
