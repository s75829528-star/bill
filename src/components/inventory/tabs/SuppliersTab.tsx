import { useState } from "react";
import {
  Plus, MoreVertical, Pencil, Trash2, Users, Star, Phone, Mail, MapPin,
  Building2, Clock, CreditCard, FileText, Upload, TrendingUp, AlertCircle,
  ShoppingCart, DollarSign,
} from "lucide-react";
import { useBusiness } from "@/contexts/BusinessContext";
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from "@/hooks/useProductsQuery";
import type { DbSupplier, DbSupplierInsert } from "@/services/products";
import { fmtINR } from "@/lib/inventory-data";

// ── UI adapter type ────────────────────────────────────────────────

interface Supplier {
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
  paymentTerms: string;
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

function dbToSupplier(db: DbSupplier): Supplier {
  return {
    id: db.id,
    name: db.name,
    contactPerson: db.contact_person ?? "",
    phone: db.phone ?? "",
    email: db.email ?? "",
    gstNumber: db.gst_number ?? "",
    pan: db.pan ?? "",
    city: db.city ?? "",
    address: db.address ?? "",
    state: db.state ?? "",
    pincode: db.pincode ?? "",
    paymentTerms: db.payment_terms ?? "",
    leadTimeDays: db.lead_time_days ?? 0,
    outstandingAmount: db.outstanding_amount ?? 0,
    rating: db.rating ?? 0,
    totalPurchases: db.total_purchases ?? 0,
    productsSupplied: db.products_supplied ?? 0,
    bankName: db.bank_name ?? undefined,
    accountNumber: db.account_number ?? undefined,
    ifsc: db.ifsc ?? undefined,
    notes: db.notes ?? undefined,
  };
}

function supplierFormStateToDb(
  data: SupplierFormState,
  businessId: string
): DbSupplierInsert {
  return {
    business_id: businessId,
    name: data.name.trim(),
    contact_person: data.contactPerson || null,
    phone: data.phone || null,
    email: data.email || null,
    gst_number: data.gstNumber || null,
    pan: data.pan || null,
    city: data.city || null,
    address: data.address || null,
    state: data.state || null,
    pincode: data.pincode || null,
    payment_terms: data.paymentTerms || null,
    lead_time_days: parseInt(data.leadTimeDays, 10) || 0,
    outstanding_amount: 0,
    rating: 0,
    total_purchases: 0,
    products_supplied: 0,
    bank_name: data.bankName || null,
    account_number: data.accountNumber || null,
    ifsc: data.ifsc || null,
    notes: data.notes || null,
  };
}
import {
  SectionCard, StatTile, PrimaryButton, SearchInput, StatusPill, EmptyState, fmtDate,
} from "@/components/inventory/shared";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ── Star Rating ───────────────────────────────────────────────────

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const rounded = Math.round(rating);
  const iconSize = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${iconSize} ${i < rounded ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}`}
        />
      ))}
      {size === "lg" && (
        <span className="ml-1.5 text-sm font-semibold text-foreground">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}

// ── Supplier Profile Dialog ───────────────────────────────────────

const DOCUMENT_ITEMS = [
  "GST Certificate",
  "PAN Card",
  "Trade License",
  "MSME Certificate",
];

function maskAccount(acc?: string) {
  if (!acc) return "—";
  if (acc.length <= 4) return acc;
  return "•".repeat(acc.length - 4) + acc.slice(-4);
}

function SupplierProfileDialog({
  supplier,
  onClose,
}: {
  supplier: Supplier | null;
  onClose: () => void;
}) {
  if (!supplier) return null;

  // Purchase orders not yet in DB — always empty
  const supplierPOs: unknown[] = [];
  const recentPOs: unknown[] = [];
  const fullAddress = [supplier.address, supplier.city, supplier.state, supplier.pincode]
    .filter(Boolean)
    .join(", ");

  return (
    <Dialog open={!!supplier} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Supplier Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Header card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-lg font-bold text-white">
                {supplier.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-foreground">{supplier.name}</h3>
                <p className="text-sm text-muted-foreground">{supplier.contactPerson}</p>
                <div className="mt-2 flex items-center gap-3">
                  <StarRating rating={supplier.rating} size="lg" />
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {supplier.leadTimeDays} days lead time
                  </span>
                </div>
              </div>
              {supplier.outstandingAmount > 0 && (
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Outstanding</p>
                  <p className="text-base font-bold text-red-600">{fmtINR(supplier.outstandingAmount)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes section */}
          {supplier.notes && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">Notes</p>
                  <p className="text-sm text-amber-800">{supplier.notes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Purchase History stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
              <p className="text-lg font-bold text-foreground">{fmtINR(supplier.totalPurchases)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Purchases</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
              <p className={`text-lg font-bold ${supplier.outstandingAmount > 0 ? "text-red-600" : "text-emerald-600"}`}>
                {fmtINR(supplier.outstandingAmount)}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Outstanding</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
              <p className="text-lg font-bold text-foreground">{supplier.productsSupplied}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Products Supplied</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
              <p className="text-lg font-bold text-foreground">{supplier.rating.toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Rating</p>
            </div>
          </div>

          {/* Contact details */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Contact Details</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Phone</p>
                  <p className="text-sm font-medium text-foreground">{supplier.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Email</p>
                  <p className="text-sm font-medium text-foreground truncate">{supplier.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:col-span-2">
                <MapPin className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Address</p>
                  <p className="text-sm font-medium text-foreground">{fullAddress || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">GST Number</p>
                  <p className="text-sm font-mono font-medium text-foreground">{supplier.gstNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">PAN</p>
                  <p className="text-sm font-mono font-medium text-foreground">{supplier.pan || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <CreditCard className="h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Payment Terms</p>
                  <p className="text-sm font-medium text-foreground">{supplier.paymentTerms || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Lead Time</p>
                  <p className="text-sm font-medium text-foreground">{supplier.leadTimeDays} days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          {(supplier.bankName || supplier.accountNumber || supplier.ifsc) && (
            <div>
              <h4 className="mb-3 text-sm font-semibold text-foreground">Bank Details</h4>
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                {supplier.bankName && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Bank Name</p>
                    <p className="text-sm font-medium text-foreground">{supplier.bankName}</p>
                  </div>
                )}
                {supplier.accountNumber && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Account Number</p>
                    <p className="text-sm font-mono font-medium text-foreground">{maskAccount(supplier.accountNumber)}</p>
                  </div>
                )}
                {supplier.ifsc && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">IFSC Code</p>
                    <p className="text-sm font-mono font-medium text-foreground">{supplier.ifsc}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents Placeholder */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">Documents</h4>
              <button
                disabled
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-400 cursor-not-allowed"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload Documents
              </button>
            </div>
            <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {DOCUMENT_ITEMS.map((doc) => (
                <div key={doc} className="flex items-center justify-between bg-white px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-slate-300" />
                    <span className="text-sm text-foreground">{doc}</span>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                    Not uploaded
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders — Purchase Orders not yet available */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">
              Recent Orders
              <span className="ml-2 text-xs font-normal text-muted-foreground">({supplierPOs.length} total)</span>
            </h4>
            <p className="rounded-xl border border-slate-200 bg-slate-50 py-6 text-center text-sm text-muted-foreground">
              No purchase orders found.
            </p>
          </div>
        </div>

        <DialogFooter className="pt-4">
          <DialogClose asChild>
            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-slate-50">
              Close
            </button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Supplier Form Dialog ──────────────────────────────────────────

interface SupplierFormState {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstNumber: string;
  city: string;
  pan: string;
  address: string;
  state: string;
  pincode: string;
  paymentTerms: string;
  leadTimeDays: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  notes: string;
}

const PAYMENT_TERMS_OPTIONS = [
  { value: "", label: "Select payment terms" },
  { value: "Net 30", label: "Net 30" },
  { value: "Net 45", label: "Net 45" },
  { value: "Net 60", label: "Net 60" },
  { value: "Advance", label: "Advance" },
  { value: "On Delivery", label: "On Delivery" },
];

const EMPTY_FORM: SupplierFormState = {
  name: "", contactPerson: "", phone: "", email: "",
  gstNumber: "", city: "", pan: "", address: "", state: "",
  pincode: "", paymentTerms: "", leadTimeDays: "",
  bankName: "", accountNumber: "", ifsc: "", notes: "",
};

function SupplierFormDialog({
  open,
  onClose,
  initial,
  onSubmit,
  title,
}: {
  open: boolean;
  onClose: () => void;
  initial?: SupplierFormState;
  onSubmit: (data: SupplierFormState) => void;
  title: string;
}) {
  const [form, setForm] = useState<SupplierFormState>(initial ?? EMPTY_FORM);

  const handleOpenChange = (o: boolean) => {
    if (o && initial) setForm(initial);
    if (!o) onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit(form);
    onClose();
  };

  const set = (key: keyof SupplierFormState) => (
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))
  );

  const inputCls = "h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
  const labelCls = "text-sm font-medium text-foreground";

  const sectionLabel = (text: string) => (
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-2">{text}</p>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {sectionLabel("Basic Information")}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className={labelCls}>Supplier Name *</label>
              <input className={inputCls} value={form.name} onChange={set("name")} placeholder="e.g. Ingram Micro India" required />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Contact Person</label>
              <input className={inputCls} value={form.contactPerson} onChange={set("contactPerson")} placeholder="e.g. Rakesh Malhotra" />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Phone</label>
              <input className={inputCls} value={form.phone} onChange={set("phone")} placeholder="e.g. +91 98200 11223" />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Email</label>
              <input className={inputCls} type="email" value={form.email} onChange={set("email")} placeholder="e.g. contact@supplier.com" />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>City</label>
              <input className={inputCls} value={form.city} onChange={set("city")} placeholder="e.g. Mumbai" />
            </div>
          </div>

          {sectionLabel("Address")}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className={labelCls}>Street Address</label>
              <input className={inputCls} value={form.address} onChange={set("address")} placeholder="e.g. 4th Floor, Infinity Tower, Malad West" />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>State</label>
              <input className={inputCls} value={form.state} onChange={set("state")} placeholder="e.g. Maharashtra" />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Pincode</label>
              <input className={inputCls} value={form.pincode} onChange={set("pincode")} placeholder="e.g. 400064" />
            </div>
          </div>

          {sectionLabel("Tax & Compliance")}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className={labelCls}>GST Number</label>
              <input className={inputCls} value={form.gstNumber} onChange={set("gstNumber")} placeholder="e.g. 27AAACI1234M1Z5" />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>PAN</label>
              <input className={inputCls} value={form.pan} onChange={set("pan")} placeholder="e.g. AAACI1234M" />
            </div>
          </div>

          {sectionLabel("Commercial Terms")}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className={labelCls}>Payment Terms</label>
              <select
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={form.paymentTerms}
                onChange={set("paymentTerms")}
              >
                {PAYMENT_TERMS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Lead Time (days)</label>
              <input
                className={inputCls}
                type="number"
                min="0"
                value={form.leadTimeDays}
                onChange={set("leadTimeDays")}
                placeholder="e.g. 5"
              />
            </div>
          </div>

          {sectionLabel("Bank Details")}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className={labelCls}>Bank Name</label>
              <input className={inputCls} value={form.bankName} onChange={set("bankName")} placeholder="e.g. HDFC Bank" />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>IFSC Code</label>
              <input className={inputCls} value={form.ifsc} onChange={set("ifsc")} placeholder="e.g. HDFC0001234" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className={labelCls}>Account Number</label>
              <input className={inputCls} value={form.accountNumber} onChange={set("accountNumber")} placeholder="e.g. 50100112233445" />
            </div>
          </div>

          {sectionLabel("Notes")}
          <div className="space-y-1.5">
            <label className={labelCls}>Internal Notes</label>
            <textarea
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
              rows={3}
              value={form.notes}
              onChange={set("notes")}
              placeholder="e.g. Preferred distributor for Dell products."
            />
          </div>

          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-slate-50">
                Cancel
              </button>
            </DialogClose>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md"
            >
              Save Supplier
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function supplierToFormState(s: Supplier): SupplierFormState {
  return {
    name: s.name,
    contactPerson: s.contactPerson,
    phone: s.phone,
    email: s.email,
    gstNumber: s.gstNumber,
    city: s.city,
    pan: s.pan ?? "",
    address: s.address ?? "",
    state: s.state ?? "",
    pincode: s.pincode ?? "",
    paymentTerms: s.paymentTerms ?? "",
    leadTimeDays: s.leadTimeDays != null ? String(s.leadTimeDays) : "",
    bankName: s.bankName ?? "",
    accountNumber: s.accountNumber ?? "",
    ifsc: s.ifsc ?? "",
    notes: s.notes ?? "",
  };
}

// ── Main Tab ──────────────────────────────────────────────────────

export function SuppliersTab() {
  const { business } = useBusiness();
  const businessId = business?.id ?? null;

  const { data: dbSuppliers = [], isLoading } = useSuppliers(businessId);
  const createMutation = useCreateSupplier(businessId);
  const updateMutation = useUpdateSupplier(businessId);
  const deleteMutation = useDeleteSupplier(businessId);

  const suppliers: Supplier[] = dbSuppliers.map(dbToSupplier);

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Supplier | null>(null);
  const [profileTarget, setProfileTarget] = useState<Supplier | null>(null);

  const filtered = suppliers.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      s.contactPerson.toLowerCase().includes(q) ||
      (s.state ?? "").toLowerCase().includes(q)
    );
  });

  // Stat tiles calculations
  const totalPurchasesValue = suppliers.reduce((acc, s) => acc + s.totalPurchases, 0);
  const totalOutstanding = suppliers.reduce((acc, s) => acc + s.outstandingAmount, 0);
  const avgRating = suppliers.length
    ? suppliers.reduce((acc, s) => acc + s.rating, 0) / suppliers.length
    : 0;

  const handleCreate = (data: SupplierFormState) => {
    if (!businessId) return;
    createMutation.mutate(supplierFormStateToDb(data, businessId), {
      onSuccess: () => setCreateOpen(false),
    });
  };

  const handleEdit = (data: SupplierFormState) => {
    if (!editTarget || !businessId) return;
    const { business_id: _bid, outstanding_amount: _oa, rating: _r, total_purchases: _tp, products_supplied: _ps, ...updatePayload } =
      supplierFormStateToDb(data, businessId);
    updateMutation.mutate(
      { id: editTarget.id, payload: updatePayload },
      { onSuccess: () => setEditTarget(null) }
    );
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Delete this supplier? This cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <>
      {/* Stat Tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
        <StatTile
          label="Total Suppliers"
          value={String(suppliers.length)}
          icon={Users}
          bg="bg-blue-50"
          iconColor="text-blue-600"
          index={0}
        />
        <StatTile
          label="Total Purchases Value"
          value={fmtINR(totalPurchasesValue)}
          icon={TrendingUp}
          bg="bg-emerald-50"
          iconColor="text-emerald-600"
          index={1}
        />
        <StatTile
          label="Total Outstanding"
          value={fmtINR(totalOutstanding)}
          icon={DollarSign}
          bg="bg-red-50"
          iconColor="text-red-500"
          index={2}
        />
        <StatTile
          label="Avg Rating"
          value={avgRating.toFixed(1)}
          icon={Star}
          bg="bg-amber-50"
          iconColor="text-amber-500"
          index={3}
        />
      </div>

      <SectionCard
        title="Suppliers"
        subtitle={`${suppliers.length} suppliers`}
        action={
          <div className="flex items-center gap-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search suppliers..."
              className="w-52"
            />
            <PrimaryButton icon={Plus} onClick={() => setCreateOpen(true)}>
              Add Supplier
            </PrimaryButton>
          </div>
        }
        noPadding
      >
        {filtered.length === 0 ? (
          <EmptyState icon={Users} title="No suppliers found" subtitle="Try adjusting your search or add a new supplier." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Supplier</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Phone</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Email</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground whitespace-nowrap">GST Number</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground whitespace-nowrap">City</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Payment Terms</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Lead Time</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground text-right whitespace-nowrap">Outstanding</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Rating</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground text-right whitespace-nowrap">Total Purchases</TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground text-right whitespace-nowrap">Products</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow
                    key={s.id}
                    className="border-slate-100 hover:bg-slate-50/60 cursor-pointer"
                    onClick={() => setProfileTarget(s)}
                  >
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-foreground whitespace-nowrap">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.contactPerson}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{s.phone}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">{s.email}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">{s.gstNumber}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{s.city}</TableCell>
                    <TableCell>
                      {s.paymentTerms ? (
                        <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 whitespace-nowrap">
                          {s.paymentTerms}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {s.leadTimeDays} days
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`text-sm font-semibold whitespace-nowrap ${s.outstandingAmount > 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {fmtINR(s.outstandingAmount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StarRating rating={s.rating} />
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                      {fmtINR(s.totalPurchases)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">{s.productsSupplied}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem onClick={() => setEditTarget(s)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(s.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      {/* Supplier Profile */}
      <SupplierProfileDialog
        supplier={profileTarget}
        onClose={() => setProfileTarget(null)}
      />

      {/* Create Dialog */}
      <SupplierFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        title="Add Supplier"
      />

      {/* Edit Dialog */}
      {editTarget && (
        <SupplierFormDialog
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          initial={supplierToFormState(editTarget)}
          onSubmit={handleEdit}
          title="Edit Supplier"
        />
      )}
    </>
  );
}
