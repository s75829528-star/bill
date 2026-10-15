// ── Nexora CRM Module — Mock Data Layer ────────────────────────────
// All data here is static/mock, generated deterministically at module
// load time. No backend, no Supabase, no API calls. Structured so it
// can be swapped for real API responses later without changing
// component shapes. Independent from billing/inventory mock data but
// follows the same conventions (₹ pricing, GST numbers, Indian cities).

// ── Deterministic PRNG (so the dataset is stable across reloads) ──

function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}
const rng = makeRng(42);
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}
function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]);
  }
  return out;
}
function randInt(min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}
function pad(n: number, len: number) {
  return String(n).padStart(len, "0");
}

// ── Enums & Status Types ────────────────────────────────────────────

export type CustomerStatus = "active" | "inactive" | "new" | "at-risk";
export type CustomerGroupName = "Retail" | "Wholesale" | "Corporate" | "VIP" | "Distributor" | "Dealer";
export type LeadStatus = "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
export type LeadSource = "website" | "referral" | "cold-call" | "trade-show" | "social-media" | "advertisement" | "walk-in";
export type LeadPriority = "low" | "medium" | "high";
export type FollowUpStatus = "pending" | "completed" | "overdue";
export type FollowUpPriority = "low" | "medium" | "high";
export type CrmActivityType =
  | "customer-created"
  | "invoice-generated"
  | "payment-received"
  | "customer-updated"
  | "lead-created"
  | "lead-converted"
  | "note-added"
  | "follow-up-scheduled"
  | "follow-up-completed";

// ── Core Entity Types ───────────────────────────────────────────────

export interface CustomerNote {
  id: string;
  text: string;
  author: string;
  date: string;
}

export interface PurchaseRecord {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
}

export interface CrmCustomer {
  id: string;
  customerCode: string;
  name: string;
  company: string;
  contactPerson: string;
  gstin: string;
  pan: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  billingAddress: string;
  shippingAddress: string;
  group: CustomerGroupName;
  status: CustomerStatus;
  outstandingAmount: number;
  creditLimit: number;
  creditDays: number;
  totalRevenue: number;
  lastPurchase: string;
  createdDate: string;
  rating: number; // 1-5
  notes: CustomerNote[];
  purchaseHistory: PurchaseRecord[];
}

export interface Lead {
  id: string;
  leadCode: string;
  name: string;
  company: string;
  contactPerson: string;
  phone: string;
  email: string;
  source: LeadSource;
  status: LeadStatus;
  expectedRevenue: number;
  assignedUser: string;
  priority: LeadPriority;
  createdDate: string;
  convertedCustomerId?: string;
}

export interface FollowUp {
  id: string;
  customerId?: string;
  leadId?: string;
  subjectName: string;
  purpose: string;
  date: string;
  time: string;
  priority: FollowUpPriority;
  status: FollowUpStatus;
  notes: string;
}

export interface CrmActivityEvent {
  id: string;
  type: CrmActivityType;
  title: string;
  subtitle: string;
  timestamp: string;
  customerId?: string;
  leadId?: string;
}

export interface CustomerGroupDef {
  id: string;
  name: CustomerGroupName;
  description: string;
  color: string;
}

// ── Reference lists (Indian business context) ──────────────────────

const firstNames = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Reyansh", "Krishna", "Ishaan", "Rohan", "Karan", "Priya", "Ananya", "Diya", "Saanvi", "Aadhya", "Kavya", "Meera", "Neha", "Pooja", "Riya", "Sanya", "Tanvi", "Anjali", "Divya", "Sneha", "Rahul", "Amit", "Vikram", "Sanjay", "Rajesh", "Suresh", "Manoj", "Deepak", "Nitin", "Varun", "Siddharth", "Akash", "Kunal", "Gaurav", "Harsh"];
const lastNames = ["Sharma", "Verma", "Gupta", "Mehta", "Patel", "Shah", "Reddy", "Nair", "Iyer", "Rao", "Singh", "Kumar", "Malhotra", "Kapoor", "Chopra", "Bose", "Das", "Joshi", "Desai", "Agarwal", "Bansal", "Chatterjee", "Menon", "Pillai", "Trivedi"];
const companyPrefixes = ["Shree", "Sri", "New", "Royal", "Prime", "National", "United", "Global", "Modern", "Classic", "Metro", "Elite", "Sunrise", "Silver", "Golden", "Star", "City", "Universal", "Deccan", "Kaveri"];
const companySuffixes = ["Traders", "Enterprises", "Industries", "Retail", "Distributors", "Corporation", "Textiles", "Electronics", "Foods", "Hardware", "Solutions", "Agencies", "Impex", "Merchants", "Stores", "Ventures", "Supplies", "Fabrics", "Exports", "Systems"];
const cities: { city: string; state: string }[] = [
  { city: "Mumbai", state: "Maharashtra" }, { city: "Pune", state: "Maharashtra" },
  { city: "Bengaluru", state: "Karnataka" }, { city: "Mysuru", state: "Karnataka" },
  { city: "Chennai", state: "Tamil Nadu" }, { city: "Coimbatore", state: "Tamil Nadu" },
  { city: "Hyderabad", state: "Telangana" }, { city: "Delhi", state: "Delhi" },
  { city: "Gurugram", state: "Haryana" }, { city: "Ahmedabad", state: "Gujarat" },
  { city: "Surat", state: "Gujarat" }, { city: "Jaipur", state: "Rajasthan" },
  { city: "Lucknow", state: "Uttar Pradesh" }, { city: "Kanpur", state: "Uttar Pradesh" },
  { city: "Kolkata", state: "West Bengal" }, { city: "Bhubaneswar", state: "Odisha" },
  { city: "Kochi", state: "Kerala" }, { city: "Indore", state: "Madhya Pradesh" },
  { city: "Nagpur", state: "Maharashtra" }, { city: "Chandigarh", state: "Punjab" },
];
const stateCodeMap: Record<string, string> = {
  Maharashtra: "27", Karnataka: "29", "Tamil Nadu": "33", Telangana: "36", Delhi: "07",
  Haryana: "06", Gujarat: "24", Rajasthan: "08", "Uttar Pradesh": "09", "West Bengal": "19",
  Odisha: "21", Kerala: "32", "Madhya Pradesh": "23", Punjab: "03",
};
const customerGroups: CustomerGroupName[] = ["Retail", "Wholesale", "Corporate", "VIP", "Distributor", "Dealer"];
const leadSources: LeadSource[] = ["website", "referral", "cold-call", "trade-show", "social-media", "advertisement", "walk-in"];
const leadStatuses: LeadStatus[] = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];
const assignedUsers = ["Arjun Mehta", "Divya Krishnan", "Rohan Verma", "Sneha Patel", "Karan Malhotra"];
const followUpPurposes = ["Product demo", "Contract renewal discussion", "Quotation follow-up", "Payment reminder", "Onboarding call", "Feedback call", "Upsell discussion", "Relationship check-in", "Order confirmation", "Complaint resolution"];
const noteTexts = ["Prefers WhatsApp communication over email.", "Interested in bulk order discounts for Q3.", "Requested extended credit terms.", "Very satisfied with recent delivery timelines.", "Follow up on pending GST invoice copies.", "Key decision maker is the procurement head.", "Long-standing customer, prioritize support.", "Asked about new product catalog.", "Sensitive to pricing — negotiate carefully.", "Referred two new customers this quarter."];

function randomDateWithin(daysBack: number, daysForward = 0) {
  const now = new Date("2026-07-13T00:00:00");
  const offset = randInt(-daysBack, daysForward);
  const d = new Date(now);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function makeCompanyName() {
  return `${pick(companyPrefixes)} ${pick(companySuffixes)}`;
}

function makeGstin(state: string) {
  const code = stateCodeMap[state] ?? "27";
  const pan = `${pick(lastNames).slice(0, 3).toUpperCase()}${randInt(1000, 9999)}${pick(["A", "B", "C", "D"])}`;
  return `${code}${pan}1Z${randInt(1, 9)}`;
}

function makePhone() {
  return `+91 ${randInt(70000, 99999)} ${pad(randInt(0, 99999), 5)}`;
}

// ── Generate Customer Groups ────────────────────────────────────────

export const customerGroupDefs: CustomerGroupDef[] = [
  { id: "grp-retail", name: "Retail", description: "Individual and small-shop buyers purchasing at list price.", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "grp-wholesale", name: "Wholesale", description: "Bulk buyers with negotiated volume pricing.", color: "bg-violet-50 text-violet-700 border-violet-200" },
  { id: "grp-corporate", name: "Corporate", description: "Registered businesses with GST billing and credit terms.", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  { id: "grp-vip", name: "VIP", description: "High-value, high-frequency customers with priority support.", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "grp-distributor", name: "Distributor", description: "Regional distributors reselling across a territory.", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "grp-dealer", name: "Dealer", description: "Authorized dealers with fixed margin agreements.", color: "bg-rose-50 text-rose-700 border-rose-200" },
];

// ── Generate Customers ───────────────────────────────────────────────

export const crmCustomers: CrmCustomer[] = Array.from({ length: 100 }, (_, i) => {
  const idx = i + 1;
  const first = pick(firstNames);
  const last = pick(lastNames);
  const { city, state } = pick(cities);
  const group = pick(customerGroups);
  const statusRoll = rng();
  const status: CustomerStatus = statusRoll < 0.62 ? "active" : statusRoll < 0.78 ? "new" : statusRoll < 0.92 ? "inactive" : "at-risk";
  const totalRevenue = randInt(15000, 1250000);
  const outstandingAmount = rng() < 0.35 ? randInt(0, Math.floor(totalRevenue * 0.3)) : 0;
  const company = makeCompanyName();
  const numNotes = randInt(0, 3);
  const numPurchases = randInt(1, 6);

  return {
    id: `cust-${idx}`,
    customerCode: `CUS-${pad(idx, 4)}`,
    name: `${first} ${last}`,
    company,
    contactPerson: `${first} ${last}`,
    gstin: makeGstin(state),
    pan: `${last.slice(0, 3).toUpperCase()}${randInt(1000, 9999)}${pick(["A", "B", "C"])}`,
    phone: makePhone(),
    email: `${first.toLowerCase()}.${last.toLowerCase()}@${company.split(" ")[1].toLowerCase()}.co.in`,
    city,
    state,
    billingAddress: `${randInt(1, 999)}, ${pick(["MG Road", "Ring Road", "Industrial Area", "Sector 12", "Main Bazaar", "Station Road", "Anna Nagar", "Civil Lines"])}, ${city}, ${state} ${randInt(100000, 999999)}`,
    shippingAddress: `${randInt(1, 999)}, ${pick(["Warehouse Zone", "Logistics Park", "Trade Centre", "Market Yard"])}, ${city}, ${state} ${randInt(100000, 999999)}`,
    group,
    status,
    outstandingAmount,
    creditLimit: pick([50000, 100000, 200000, 500000, 1000000]),
    creditDays: pick([0, 15, 30, 45, 60]),
    totalRevenue,
    lastPurchase: randomDateWithin(180),
    createdDate: randomDateWithin(720),
    rating: randInt(3, 5),
    notes: Array.from({ length: numNotes }, (_, n) => ({
      id: `note-${idx}-${n}`,
      text: pick(noteTexts),
      author: pick(assignedUsers),
      date: randomDateWithin(150),
    })),
    purchaseHistory: Array.from({ length: numPurchases }, (_, p) => ({
      id: `ph-${idx}-${p}`,
      invoiceNumber: `INV-2026-${pad(randInt(1, 999), 4)}`,
      date: randomDateWithin(200),
      amount: randInt(2000, 180000),
      status: pick(["paid", "paid", "paid", "pending", "overdue"] as const),
    })),
  };
});

// ── Generate Leads ───────────────────────────────────────────────────

export const leads: Lead[] = Array.from({ length: 50 }, (_, i) => {
  const idx = i + 1;
  const first = pick(firstNames);
  const last = pick(lastNames);
  const status = pick(leadStatuses);
  const company = makeCompanyName();
  const convertedCustomerId = status === "won" && rng() < 0.7 ? pick(crmCustomers).id : undefined;

  return {
    id: `lead-${idx}`,
    leadCode: `LEAD-${pad(idx, 4)}`,
    name: `${first} ${last}`,
    company,
    contactPerson: `${first} ${last}`,
    phone: makePhone(),
    email: `${first.toLowerCase()}.${last.toLowerCase()}@${company.split(" ")[1].toLowerCase()}mail.in`,
    source: pick(leadSources),
    status,
    expectedRevenue: randInt(8000, 450000),
    assignedUser: pick(assignedUsers),
    priority: pick(["low", "medium", "high"] as const),
    createdDate: randomDateWithin(180),
    convertedCustomerId,
  };
});

// ── Generate Follow-ups ──────────────────────────────────────────────

export const followUps: FollowUp[] = Array.from({ length: 42 }, (_, i) => {
  const idx = i + 1;
  const useCustomer = rng() < 0.65;
  const ref = useCustomer ? pick(crmCustomers) : pick(leads);
  const date = randomDateWithin(20, 25);
  const isPast = date < "2026-07-13";
  const status: FollowUpStatus = isPast ? pick(["completed", "completed", "overdue"] as const) : "pending";

  return {
    id: `fu-${idx}`,
    customerId: useCustomer ? (ref as CrmCustomer).id : undefined,
    leadId: !useCustomer ? (ref as Lead).id : undefined,
    subjectName: useCustomer ? (ref as CrmCustomer).name : (ref as Lead).name,
    purpose: pick(followUpPurposes),
    date,
    time: `${pad(randInt(9, 18), 2)}:${pick(["00", "15", "30", "45"])}`,
    priority: pick(["low", "medium", "high"] as const),
    status,
    notes: pick(noteTexts),
  };
});

// ── Generate Activity Timeline ───────────────────────────────────────

const activityTemplates: { type: CrmActivityType; title: (n: string) => string; subtitle: string }[] = [
  { type: "customer-created", title: (n) => `New customer added: ${n}`, subtitle: "Customer profile created" },
  { type: "invoice-generated", title: (n) => `Invoice generated for ${n}`, subtitle: "Billing module" },
  { type: "payment-received", title: (n) => `Payment received from ${n}`, subtitle: "Payment recorded" },
  { type: "customer-updated", title: (n) => `${n}'s profile was updated`, subtitle: "Contact details changed" },
  { type: "lead-created", title: (n) => `New lead captured: ${n}`, subtitle: "Lead pipeline" },
  { type: "lead-converted", title: (n) => `Lead converted to customer: ${n}`, subtitle: "Conversion" },
  { type: "note-added", title: (n) => `Note added for ${n}`, subtitle: "Customer notes" },
  { type: "follow-up-scheduled", title: (n) => `Follow-up scheduled with ${n}`, subtitle: "Follow-ups" },
  { type: "follow-up-completed", title: (n) => `Follow-up completed with ${n}`, subtitle: "Follow-ups" },
];

export const crmActivity: CrmActivityEvent[] = Array.from({ length: 60 }, (_, i) => {
  const idx = i + 1;
  const template = pick(activityTemplates);
  const useCustomer = rng() < 0.7;
  const ref = useCustomer ? pick(crmCustomers) : pick(leads);
  const name = useCustomer ? (ref as CrmCustomer).name : (ref as Lead).name;
  return {
    id: `act-${idx}`,
    type: template.type,
    title: template.title(name),
    subtitle: template.subtitle,
    timestamp: randomDateWithin(60),
    customerId: useCustomer ? (ref as CrmCustomer).id : undefined,
    leadId: !useCustomer ? (ref as Lead).id : undefined,
  };
}).sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

// ── CRM Settings (mock, editable in-session only) ───────────────────

export const crmSettings = {
  customerNumberPrefix: "CUS",
  customerNumberNextValue: 101,
  defaultCreditDays: 30,
  defaultCurrency: "INR",
  defaultCountry: "India",
  customerCategories: customerGroups as string[],
};

// ── Derived helpers ───────────────────────────────────────────────────

export function fmtINR(v: number) {
  return "₹" + v.toLocaleString("en-IN");
}

export function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function getCustomerById(id: string) {
  return crmCustomers.find((c) => c.id === id);
}

export function getLeadById(id: string) {
  return leads.find((l) => l.id === id);
}

export function groupStats(group: CustomerGroupName) {
  const members = crmCustomers.filter((c) => c.group === group);
  return {
    customerCount: members.length,
    revenue: members.reduce((s, c) => s + c.totalRevenue, 0),
    outstanding: members.reduce((s, c) => s + c.outstandingAmount, 0),
  };
}

export function crmSummary() {
  const active = crmCustomers.filter((c) => c.status === "active").length;
  const newCustomers = crmCustomers.filter((c) => c.status === "new").length;
  const returning = crmCustomers.filter((c) => c.purchaseHistory.length > 1).length;
  const convertedLeads = leads.filter((l) => l.status === "won").length;
  const outstandingReceivables = crmCustomers.reduce((s, c) => s + c.outstandingAmount, 0);
  const totalRevenue = crmCustomers.reduce((s, c) => s + c.totalRevenue, 0);
  const avgCustomerValue = Math.round(totalRevenue / crmCustomers.length);
  // Growth rate: customers created in the last 90 days vs the 90 days before that
  const last90 = crmCustomers.filter((c) => c.createdDate >= randomDateWithinFixed(90)).length;
  const prior90 = crmCustomers.filter((c) => c.createdDate >= randomDateWithinFixed(180) && c.createdDate < randomDateWithinFixed(90)).length;
  const growthRate = prior90 > 0 ? Math.round(((last90 - prior90) / prior90) * 100) : last90 > 0 ? 100 : 0;

  return {
    totalCustomers: crmCustomers.length,
    activeCustomers: active,
    newCustomers,
    returningCustomers: returning,
    totalLeads: leads.length,
    convertedLeads,
    outstandingReceivables,
    avgCustomerValue,
    growthRate,
  };
}

function randomDateWithinFixed(daysBack: number) {
  const now = new Date("2026-07-13T00:00:00");
  const d = new Date(now);
  d.setDate(d.getDate() - daysBack);
  return d.toISOString().slice(0, 10);
}

export function monthlyAcquisition() {
  // Bucket customers by created month, last 6 months
  const months: { key: string; label: string }[] = [];
  const now = new Date("2026-07-13T00:00:00");
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}`, label: d.toLocaleDateString("en-IN", { month: "short" }) });
  }
  return months.map(({ key, label }) => ({
    month: label,
    customers: crmCustomers.filter((c) => c.createdDate.startsWith(key)).length,
  }));
}

export function revenueByCustomer(topN = 8) {
  return [...crmCustomers]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, topN)
    .map((c) => ({ name: c.company, revenue: c.totalRevenue }));
}

export function customerDistribution() {
  return customerGroups.map((g) => ({ name: g, value: crmCustomers.filter((c) => c.group === g).length }));
}

export function leadConversionFunnel() {
  const stages: LeadStatus[] = ["new", "contacted", "qualified", "proposal", "negotiation", "won"];
  return stages.map((s) => ({ stage: s, count: leads.filter((l) => l.status === s).length }));
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New", contacted: "Contacted", qualified: "Qualified", proposal: "Proposal",
  negotiation: "Negotiation", won: "Won", lost: "Lost",
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  website: "Website", referral: "Referral", "cold-call": "Cold Call", "trade-show": "Trade Show",
  "social-media": "Social Media", advertisement: "Advertisement", "walk-in": "Walk-in",
};
