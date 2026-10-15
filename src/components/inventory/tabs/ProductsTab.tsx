// ── Products Tab ──────────────────────────────────────────────────
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Copy,
  Archive,
  Trash2,
  Download,
  Upload,
  Plus,
  Package,
  Tag,
  AlertTriangle,
  XCircle,
  X,
  RotateCcw,
  Loader2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  units,
  getUnit,
  getStockStatus,
  fmtINR,
  estimatedDaysRemaining,
  type Product,
} from "@/lib/inventory-data";
import {
  SectionCard,
  StatTile,
  StatusPill,
  SearchInput,
  Select,
  Pagination,
  PrimaryButton,
  SecondaryButton,
  EmptyState,
} from "@/components/inventory/shared";
import { useBusiness } from "@/contexts/BusinessContext";
import {
  useProducts,
  useCategories,
  useSuppliers,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useDeleteManyProducts,
  useBulkUpdateProducts,
} from "@/hooks/useProductsQuery";
import { useBrands, useBrandOptions } from "@/hooks/useBrandsQuery";
import {
  dbToProduct,
  productFormToDb,
  type DbCategory,
  type DbSupplier,
} from "@/services/products";
import type { DbBrand } from "@/services/brands";

// ── Constants ──────────────────────────────────────────────────────
const PAGE_SIZE = 8;

// ── Helpers ────────────────────────────────────────────────────────
function buildCSV(rows: Product[], cats: DbCategory[], sups: DbSupplier[], dbBrands: DbBrand[]): string {
  const catMap = new Map(cats.map((c) => [c.id, c.name]));
  const supMap = new Map(sups.map((s) => [s.id, s.name]));
  const brandMap = new Map(dbBrands.map((b) => [b.id, b.name]));
  const headers = [
    "SKU", "Name", "Barcode", "Category", "Brand", "Supplier",
    "Purchase Price", "Selling Price", "MRP", "Cost Price", "Tax %", "HSN Code",
    "Current Stock", "Min Stock", "Max Stock", "Reorder Qty", "Lead Time Days",
    "Weight (kg)", "Color", "Size", "Material", "Status", "Description",
  ];
  const escape = (v: string | number | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [
    headers.join(","),
    ...rows.map((p) =>
      [
        p.sku, p.name, p.barcode,
        catMap.get(p.categoryId) ?? p.categoryId,
        brandMap.get(p.brandId) ?? p.brandId,
        supMap.get(p.supplierId) ?? p.supplierId,
        p.purchasePrice, p.sellingPrice, p.mrp, p.costPrice, p.taxPercent, p.hsnCode,
        p.currentStock, p.minStock, p.maxStock, p.reorderQty, p.leadTimeDays,
        p.weight ?? "", p.color ?? "", p.size ?? "", p.material ?? "",
        p.status, p.description,
      ].map(escape).join(",")
    ),
  ];
  return lines.join("\n");
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── ProductForm ────────────────────────────────────────────────────
type ProductFormData = Omit<Product, "id" | "images">;

function makeEmptyForm(cats: DbCategory[], sups: DbSupplier[], dbBrands: DbBrand[]): ProductFormData {
  return {
    name: "", sku: "", barcode: "", categoryId: cats[0]?.id ?? "",
    subcategory: "", manufacturer: "",
    brandId: dbBrands[0]?.id ?? "", unitId: units[0]?.id ?? "",
    supplierId: sups[0]?.id ?? "", purchasePrice: 0, sellingPrice: 0,
    mrp: 0, costPrice: 0,
    taxPercent: 18, hsnCode: "", currentStock: 0, minStock: 0, maxStock: 0,
    reorderQty: 0, leadTimeDays: 0,
    weight: undefined, color: "", size: "", material: "",
    dimensions: undefined,
    status: "active", description: "", internalNotes: "", tags: [],
    emoji: "📦",
  };
}

type FormTab = "basic" | "pricing" | "stock" | "physical" | "notes";

function ProductForm({
  initial,
  isEdit,
  onSave,
  onCancel,
  saving,
  saveError,
  dbCategories,
  dbSuppliers,
  dbBrands,
}: {
  initial: ProductFormData;
  isEdit: boolean;
  onSave: (data: ProductFormData) => void;
  onCancel: () => void;
  saving: boolean;
  saveError: string | null;
  dbCategories: DbCategory[];
  dbSuppliers: DbSupplier[];
  dbBrands: DbBrand[];
}) {
  const [form, setForm] = useState<ProductFormData>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<FormTab>("basic");
  const [tagsInput, setTagsInput] = useState((initial.tags ?? []).join(", "));

  function set<K extends keyof ProductFormData>(key: K, val: ProductFormData[K]) {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key as string]) setErrors((e) => ({ ...e, [key as string]: "" }));
  }

  function setDim(axis: "l" | "w" | "h", val: number) {
    setForm((f) => ({
      ...f,
      dimensions: { l: f.dimensions?.l ?? 0, w: f.dimensions?.w ?? 0, h: f.dimensions?.h ?? 0, [axis]: val },
    }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Product name is required";
    if (!form.sku.trim()) e.sku = "SKU is required";
    if (form.purchasePrice < 0) e.purchasePrice = "Must be 0 or more";
    if (form.sellingPrice < 0) e.sellingPrice = "Must be 0 or more";
    if (form.currentStock < 0) e.currentStock = "Must be 0 or more";
    if (form.minStock < 0) e.minStock = "Must be 0 or more";
    if (form.maxStock < 0) e.maxStock = "Must be 0 or more";
    return e;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); setActiveTab("basic"); return; }
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    onSave({ ...form, tags });
  }

  const inputCls = "h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition-colors focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)] placeholder:text-slate-400";
  const labelCls = "mb-1 block text-xs font-medium text-foreground";
  const errCls = "mt-0.5 text-[11px] text-red-500";
  const selectCls = "h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none transition-colors focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]";
  const textareaCls = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)] placeholder:text-slate-400 resize-none";

  const tabs: { key: FormTab; label: string }[] = [
    { key: "basic", label: "Basic" },
    { key: "pricing", label: "Pricing" },
    { key: "stock", label: "Stock" },
    { key: "physical", label: "Physical" },
    { key: "notes", label: "Notes" },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-0">
      {/* Tab nav */}
      <div className="flex gap-1 border-b border-slate-100 mb-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors ${
              activeTab === t.key
                ? "bg-white border border-b-white border-slate-200 text-[color:var(--brand-electric)] -mb-px"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-h-[55vh] overflow-y-auto px-1 py-1">
        {/* ── Basic Info ── */}
        {activeTab === "basic" && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="col-span-2">
              <label className={labelCls}>Product Name *</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Dell Vostro 15 Laptop" className={inputCls} />
              {errors.name && <p className={errCls}>{errors.name}</p>}
            </div>
            <div>
              <label className={labelCls}>SKU *</label>
              <input value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="e.g. DEL-VOS15-001" className={inputCls} />
              {errors.sku && <p className={errCls}>{errors.sku}</p>}
            </div>
            <div>
              <label className={labelCls}>Barcode</label>
              <input value={form.barcode} onChange={(e) => set("barcode", e.target.value)} placeholder="e.g. 8901234500011" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Emoji / Icon</label>
              <input value={form.emoji} onChange={(e) => set("emoji", e.target.value)} placeholder="📦" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Subcategory</label>
              <input value={form.subcategory ?? ""} onChange={(e) => set("subcategory", e.target.value)} placeholder="e.g. Business Laptops" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Manufacturer</label>
              <input value={form.manufacturer ?? ""} onChange={(e) => set("manufacturer", e.target.value)} placeholder="e.g. Dell Technologies Inc." className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} className={selectCls}>
                <option value="">— Select category —</option>
                {dbCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Brand</label>
              <select value={form.brandId} onChange={(e) => set("brandId", e.target.value)} className={selectCls}>
                <option value="">— Select brand —</option>
                {dbBrands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Unit</label>
              <select value={form.unitId} onChange={(e) => set("unitId", e.target.value)} className={selectCls}>
                <option value="">— Select unit —</option>
                {units.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.shortCode})</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Supplier</label>
              <select value={form.supplierId} onChange={(e) => set("supplierId", e.target.value)} className={selectCls}>
                <option value="">— Select supplier —</option>
                {dbSuppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>HSN / SAC Code</label>
              <input value={form.hsnCode} onChange={(e) => set("hsnCode", e.target.value)} placeholder="e.g. 8471" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value as Product["status"])} className={selectCls}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        )}

        {/* ── Pricing ── */}
        {activeTab === "pricing" && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <label className={labelCls}>Purchase Price (₹)</label>
              <input type="number" min={0} value={form.purchasePrice} onChange={(e) => set("purchasePrice", Number(e.target.value))} className={inputCls} />
              {errors.purchasePrice && <p className={errCls}>{errors.purchasePrice}</p>}
            </div>
            <div>
              <label className={labelCls}>Cost Price (₹)</label>
              <input type="number" min={0} value={form.costPrice} onChange={(e) => set("costPrice", Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Selling Price (₹)</label>
              <input type="number" min={0} value={form.sellingPrice} onChange={(e) => set("sellingPrice", Number(e.target.value))} className={inputCls} />
              {errors.sellingPrice && <p className={errCls}>{errors.sellingPrice}</p>}
            </div>
            <div>
              <label className={labelCls}>MRP (₹)</label>
              <input type="number" min={0} value={form.mrp} onChange={(e) => set("mrp", Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Tax %</label>
              <input type="number" min={0} max={100} value={form.taxPercent} onChange={(e) => set("taxPercent", Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>HSN / SAC Code</label>
              <input value={form.hsnCode} onChange={(e) => set("hsnCode", e.target.value)} placeholder="e.g. 8471" className={inputCls} />
            </div>
          </div>
        )}

        {/* ── Stock ── */}
        {activeTab === "stock" && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <label className={labelCls}>{isEdit ? "Current Stock" : "Opening Stock"}</label>
              <input type="number" min={0} value={form.currentStock} onChange={(e) => set("currentStock", Number(e.target.value))} className={inputCls} />
              {errors.currentStock && <p className={errCls}>{errors.currentStock}</p>}
            </div>
            <div>
              <label className={labelCls}>Min Stock Level</label>
              <input type="number" min={0} value={form.minStock} onChange={(e) => set("minStock", Number(e.target.value))} className={inputCls} />
              {errors.minStock && <p className={errCls}>{errors.minStock}</p>}
            </div>
            <div>
              <label className={labelCls}>Max Stock Level</label>
              <input type="number" min={0} value={form.maxStock} onChange={(e) => set("maxStock", Number(e.target.value))} className={inputCls} />
              {errors.maxStock && <p className={errCls}>{errors.maxStock}</p>}
            </div>
            <div>
              <label className={labelCls}>Reorder Qty</label>
              <input type="number" min={0} value={form.reorderQty} onChange={(e) => set("reorderQty", Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Lead Time (days)</label>
              <input type="number" min={0} value={form.leadTimeDays} onChange={(e) => set("leadTimeDays", Number(e.target.value))} className={inputCls} />
            </div>
          </div>
        )}

        {/* ── Physical ── */}
        {activeTab === "physical" && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <label className={labelCls}>Weight (kg)</label>
              <input type="number" min={0} step="0.001" value={form.weight ?? ""} onChange={(e) => set("weight", e.target.value === "" ? undefined : Number(e.target.value))} placeholder="e.g. 1.85" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Color</label>
              <input value={form.color ?? ""} onChange={(e) => set("color", e.target.value)} placeholder="e.g. Black" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Size</label>
              <input value={form.size ?? ""} onChange={(e) => set("size", e.target.value)} placeholder="e.g. 15.6-inch" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Material</label>
              <input value={form.material ?? ""} onChange={(e) => set("material", e.target.value)} placeholder="e.g. ABS Plastic" className={inputCls} />
            </div>
            {/* Dimensions */}
            <div className="col-span-2">
              <label className={labelCls}>Dimensions (cm) — L × W × H</label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <input type="number" min={0} step="0.1" value={form.dimensions?.l ?? ""} onChange={(e) => setDim("l", Number(e.target.value))} placeholder="Length" className={inputCls} />
                </div>
                <div>
                  <input type="number" min={0} step="0.1" value={form.dimensions?.w ?? ""} onChange={(e) => setDim("w", Number(e.target.value))} placeholder="Width" className={inputCls} />
                </div>
                <div>
                  <input type="number" min={0} step="0.1" value={form.dimensions?.h ?? ""} onChange={(e) => setDim("h", Number(e.target.value))} placeholder="Height" className={inputCls} />
                </div>
              </div>
            </div>
            {/* Images placeholder */}
            <div className="col-span-2">
              <label className={labelCls}>Images</label>
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
                <Upload className="h-4 w-4 text-slate-400" />
                <span className="text-xs text-muted-foreground">Drag & drop or click to upload images (coming soon)</span>
                <input type="file" disabled className="hidden" />
              </div>
            </div>
          </div>
        )}

        {/* ── Notes ── */}
        {activeTab === "notes" && (
          <div className="flex flex-col gap-3">
            <div>
              <label className={labelCls}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
                placeholder="Short product description..."
                className={textareaCls}
              />
            </div>
            <div>
              <label className={labelCls}>Internal Notes <span className="text-[10px] text-muted-foreground">(staff only)</span></label>
              <textarea
                value={form.internalNotes ?? ""}
                onChange={(e) => set("internalNotes", e.target.value)}
                rows={3}
                placeholder="Notes visible only to staff..."
                className={textareaCls}
              />
            </div>
            <div>
              <label className={labelCls}>Tags <span className="text-[10px] text-muted-foreground">(comma-separated)</span></label>
              <input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. laptop, business, bestseller"
                className={inputCls}
              />
            </div>
          </div>
        )}
      </div>

      {saveError && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">
          {saveError}
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button type="button" onClick={onCancel} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {isEdit ? "Save Changes" : "Add Product"}
        </button>
      </div>
    </form>
  );
}

// ── ProductDetailDialog ────────────────────────────────────────────
function ProductDetailDialog({
  product,
  open,
  onOpenChange,
  onEdit,
  dbCategories,
  dbSuppliers,
  dbBrands,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onEdit: (p: Product) => void;
  dbCategories: DbCategory[];
  dbSuppliers: DbSupplier[];
  dbBrands: DbBrand[];
}) {
  if (!product) return null;
  const cat = dbCategories.find((c) => c.id === product.categoryId);
  const brand = dbBrands.find((item) => item.id === product.brandId);
  const unit = getUnit(product.unitId);
  const supplier = dbSuppliers.find((s) => s.id === product.supplierId);
  const stockStatus = getStockStatus(product);
  const daysLeft = estimatedDaysRemaining(product);

  const field = (label: string, value: string | number | undefined | null) => (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value ?? "—"}</p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogDescription className="sr-only">Product details</DialogDescription>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{product.emoji}</span>
            {product.name}
          </DialogTitle>
        </DialogHeader>

        {/* Status pills */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusPill status={product.status} />
          <StatusPill status={stockStatus} />
          {cat && <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">{cat.name}</span>}
          {product.subcategory && <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">{product.subcategory}</span>}
        </div>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {product.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">
                <Tag className="h-2.5 w-2.5" />{tag}
              </span>
            ))}
          </div>
        )}

        {/* Basic Info */}
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
          {field("SKU", product.sku)}
          {field("Barcode", product.barcode)}
          {field("Brand", brand?.name)}
          {field("Manufacturer", product.manufacturer)}
          {field("Unit", unit ? `${unit.name} (${unit.shortCode})` : undefined)}
          {field("Supplier", supplier?.name)}
          {field("HSN / SAC Code", product.hsnCode)}
          {field("Category", cat?.name)}
        </div>

        {/* Barcode preview */}
        {product.barcode && (
          <div className="mt-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Barcode</p>
            <div className="inline-block rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
              <span className="font-mono text-sm tracking-widest text-foreground">{product.barcode}</span>
            </div>
          </div>
        )}

        {/* Pricing section */}
        <div className="mt-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-slate-100 pb-1">Pricing</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {field("Purchase Price", fmtINR(product.purchasePrice))}
            {field("Cost Price", fmtINR(product.costPrice))}
            {field("Selling Price", fmtINR(product.sellingPrice))}
            {field("MRP", fmtINR(product.mrp))}
            {field("Tax %", `${product.taxPercent}%`)}
          </div>
        </div>

        {/* Stock Summary section */}
        <div className="mt-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-slate-100 pb-1">Stock Summary</p>
          <div className="grid grid-cols-3 gap-x-4 gap-y-4">
            {field("Current Stock", product.currentStock)}
            {field("Min Stock", product.minStock)}
            {field("Max Stock", product.maxStock)}
            {field("Reorder Qty", product.reorderQty)}
            {field("Lead Time (days)", product.leadTimeDays)}
            {field("Est. Days Remaining", daysLeft !== null ? `${daysLeft} days` : "—")}
          </div>
        </div>

        {/* Physical section */}
        {(product.weight || product.dimensions || product.color || product.size || product.material) && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-slate-100 pb-1">Physical</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {product.weight !== undefined && field("Weight", `${product.weight} kg`)}
              {product.color && field("Color", product.color)}
              {product.size && field("Size", product.size)}
              {product.material && field("Material", product.material)}
              {product.dimensions && field("Dimensions (L×W×H)", `${product.dimensions.l} × ${product.dimensions.w} × ${product.dimensions.h} cm`)}
            </div>
          </div>
        )}

        {/* Description */}
        {product.description && (
          <div className="mt-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Description</p>
            <p className="mt-0.5 text-sm text-foreground">{product.description}</p>
          </div>
        )}

        {/* Internal Notes */}
        {product.internalNotes && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 mb-1">Internal Notes (Staff Only)</p>
            <p className="text-sm text-amber-900">{product.internalNotes}</p>
          </div>
        )}

        {/* Purchase History placeholder */}
        <div className="mt-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-slate-100 pb-1">Purchase History</p>
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
            <p className="text-xs text-muted-foreground">Purchase history will show here</p>
          </div>
        </div>

        {/* Activity Log placeholder */}
        <div className="mt-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-slate-100 pb-1">Activity Log</p>
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
            <p className="text-xs text-muted-foreground">Activity log will show here</p>
          </div>
        </div>

        <DialogFooter className="mt-4 flex gap-2">
          <DialogClose asChild>
            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-slate-50 transition-colors">
              Close
            </button>
          </DialogClose>
          <button
            onClick={() => { onOpenChange(false); onEdit(product); }}
            className="inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all"
          >
            <Pencil className="h-4 w-4" /> Edit
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── ProductsTab ────────────────────────────────────────────────────
export function ProductsTab() {
  const { business } = useBusiness();
  const businessId = business?.id ?? null;

  // ── Server state ───────────────────────────────────────────────
  const { data: dbProducts = [], isLoading: productsLoading } = useProducts(businessId);
  const { data: dbCategories = [] } = useCategories(businessId);
  const { data: dbSuppliers = [] } = useSuppliers(businessId);
  const { data: activeBrands = [] } = useBrandOptions(businessId);
  const { data: brandPage } = useBrands(businessId, { page: 1, pageSize: 100 });
  const dbBrands = brandPage?.data ?? activeBrands;

  // Map DB rows to UI Product type
  const allProducts: Product[] = useMemo(
    () => dbProducts.map(dbToProduct),
    [dbProducts]
  );

  // ── Mutations ──────────────────────────────────────────────────
  const createMutation = useCreateProduct(businessId);
  const updateMutation = useUpdateProduct(businessId);
  const deleteMutation = useDeleteProduct(businessId);
  const deleteManyMutation = useDeleteManyProducts(businessId);
  const bulkUpdateMutation = useBulkUpdateProducts(businessId);

  // Toolbar filters
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterBrand, setFilterBrand] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterStockStatus, setFilterStockStatus] = useState("all");
  const [sortKey, setSortKey] = useState("name-az");

  // Pagination
  const [page, setPage] = useState(1);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Detail dialog
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Create / Edit dialog
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formInitial, setFormInitial] = useState<ProductFormData>(() => makeEmptyForm(dbCategories, dbSuppliers, activeBrands));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Filter options
  const categoryOptions = [
    { value: "all", label: "All Categories" },
    ...dbCategories.map((c) => ({ value: c.id, label: c.name })),
  ];
  const brandOptions = [
    { value: "all", label: "All Brands" },
    ...dbBrands.map((b) => ({ value: b.id, label: b.name })),
  ];
  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "archived", label: "Archived" },
  ];
  const stockStatusOptions = [
    { value: "all", label: "All Stock" },
    { value: "in-stock", label: "In Stock" },
    { value: "low-stock", label: "Low Stock" },
    { value: "out-of-stock", label: "Out of Stock" },
  ];
  const sortOptions = [
    { value: "name-az", label: "Name A–Z" },
    { value: "name-za", label: "Name Z–A" },
    { value: "price-high", label: "Price High–Low" },
    { value: "price-low", label: "Price Low–High" },
    { value: "stock-high", label: "Stock High–Low" },
  ];

  // Computed stats
  const totalActive = allProducts.filter((p) => p.status === "active").length;
  const totalLowStock = allProducts.filter((p) => getStockStatus(p) === "low-stock").length;
  const totalOutOfStock = allProducts.filter((p) => getStockStatus(p) === "out-of-stock").length;

  const anyFilterActive =
    filterCategory !== "all" ||
    filterBrand !== "all" ||
    filterStatus !== "all" ||
    filterStockStatus !== "all" ||
    search !== "";

  // Filtered + sorted products
  const filtered = useMemo(() => {
    let rows = allProducts;
    const q = search.toLowerCase();
    if (q) rows = rows.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode.toLowerCase().includes(q)
    );
    if (filterCategory !== "all") rows = rows.filter((p) => p.categoryId === filterCategory);
    if (filterBrand !== "all") rows = rows.filter((p) => p.brandId === filterBrand);
    if (filterStatus !== "all") rows = rows.filter((p) => p.status === filterStatus);
    if (filterStockStatus !== "all") rows = rows.filter((p) => getStockStatus(p) === filterStockStatus);

    rows = [...rows].sort((a, b) => {
      if (sortKey === "name-az") return a.name.localeCompare(b.name);
      if (sortKey === "name-za") return b.name.localeCompare(a.name);
      if (sortKey === "price-high") return b.sellingPrice - a.sellingPrice;
      if (sortKey === "price-low") return a.sellingPrice - b.sellingPrice;
      if (sortKey === "stock-high") return b.currentStock - a.currentStock;
      return 0;
    });
    return rows;
  }, [allProducts, search, filterCategory, filterBrand, filterStatus, filterStockStatus, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset page on filter change
  function handleSearch(v: string) { setSearch(v); setPage(1); }
  function handleCatFilter(v: string) { setFilterCategory(v); setPage(1); }
  function handleBrandFilter(v: string) { setFilterBrand(v); setPage(1); }
  function handleStatusFilter(v: string) { setFilterStatus(v); setPage(1); }
  function handleStockStatusFilter(v: string) { setFilterStockStatus(v); setPage(1); }

  function clearFilters() {
    setSearch("");
    setFilterCategory("all");
    setFilterBrand("all");
    setFilterStatus("all");
    setFilterStockStatus("all");
    setPage(1);
  }

  // Selection helpers
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    if (pageRows.every((r) => selectedIds.has(r.id))) {
      setSelectedIds((prev) => { const next = new Set(prev); pageRows.forEach((r) => next.delete(r.id)); return next; });
    } else {
      setSelectedIds((prev) => { const next = new Set(prev); pageRows.forEach((r) => next.add(r.id)); return next; });
    }
  }
  const allPageSelected = pageRows.length > 0 && pageRows.every((r) => selectedIds.has(r.id));
  const someSelected = selectedIds.size > 0;

  // ── CRUD actions ───────────────────────────────────────────────
  function handleDuplicate(product: Product) {
    if (!businessId) return;
    const form = (({ id: _id, images: _img, ...rest }) => rest)(product as Product & { images?: unknown });
    const payload = productFormToDb(
      { ...form as ProductFormData, sku: form.sku + "-COPY", name: form.name + " (Copy)" },
      businessId
    );
    createMutation.mutate(payload);
  }

  function handleArchive(id: string) {
    updateMutation.mutate({ id, payload: { status: "archived" } });
  }

  function handleRestore(id: string) {
    updateMutation.mutate({ id, payload: { status: "active" } });
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id);
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
  }

  function handleBulkArchive() {
    bulkUpdateMutation.mutate({ ids: [...selectedIds], payload: { status: "archived" } });
    setSelectedIds(new Set());
  }

  function handleBulkDelete() {
    deleteManyMutation.mutate([...selectedIds]);
    setSelectedIds(new Set());
  }

  // Export
  function handleExportCSV() {
    const csv = buildCSV(filtered, dbCategories, dbSuppliers, dbBrands);
    downloadFile(csv, "products-export.csv", "text/csv;charset=utf-8;");
  }
  function handleExportExcel() {
    const csv = buildCSV(filtered, dbCategories, dbSuppliers, dbBrands);
    downloadFile(csv, "products-export.csv", "text/csv;charset=utf-8;");
  }

  // Import placeholder
  function handleImport() {
    alert("Import functionality coming soon. Please use the CSV template.");
  }

  // Open detail
  function openDetail(p: Product) {
    setDetailProduct(p);
    setDetailOpen(true);
  }

  // Open create form
  function openCreate() {
    setFormMode("create");
    setFormInitial(makeEmptyForm(dbCategories, dbSuppliers, activeBrands));
    setEditingId(null);
    setSaveError(null);
    setFormOpen(true);
  }

  // Open edit form
  function openEdit(p: Product) {
    setFormMode("edit");
    const { id: _id, images: _img, ...rest } = p as Product & { images?: unknown };
    setFormInitial(rest as ProductFormData);
    setEditingId(p.id);
    setSaveError(null);
    setFormOpen(true);
  }

  // Save form
  async function handleFormSave(data: ProductFormData) {
    if (!businessId) return;
    setSaveError(null);
    try {
      if (formMode === "create") {
        const payload = productFormToDb(data, businessId);
        await createMutation.mutateAsync(payload);
      } else if (editingId) {
        const payload = productFormToDb(data, businessId);
        await updateMutation.mutateAsync({ id: editingId, payload });
      }
      setFormOpen(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save product. Please try again.");
    }
  }

  const uniqueCategories = new Set(allProducts.map((p) => p.categoryId).filter(Boolean)).size;

  // ── Loading state ──────────────────────────────────────────────
  if (productsLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
        <div className="h-96 rounded-2xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Stat Tiles ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile
          label="Total Products"
          value={String(allProducts.length)}
          sub={`${uniqueCategories} categories`}
          icon={Package}
          bg="bg-blue-50"
          iconColor="text-blue-600"
          index={0}
        />
        <StatTile
          label="Active"
          value={String(totalActive)}
          sub="listed products"
          icon={Package}
          bg="bg-emerald-50"
          iconColor="text-emerald-600"
          index={1}
        />
        <StatTile
          label="Low Stock"
          value={String(totalLowStock)}
          sub="need reorder"
          icon={AlertTriangle}
          bg="bg-amber-50"
          iconColor="text-amber-600"
          index={2}
        />
        <StatTile
          label="Out of Stock"
          value={String(totalOutOfStock)}
          sub="unavailable"
          icon={XCircle}
          bg="bg-red-50"
          iconColor="text-red-600"
          index={3}
        />
      </div>

      <SectionCard
        title="Products"
        subtitle={`${allProducts.length} products across ${uniqueCategories} categories`}
        action={<PrimaryButton icon={Plus} onClick={openCreate}>Add Product</PrimaryButton>}
        noPadding
      >
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-6 py-3">
          <SearchInput
            value={search}
            onChange={handleSearch}
            placeholder="Search by name, SKU, barcode…"
            className="w-56"
          />
          <Select value={sortKey} onChange={setSortKey} options={sortOptions} className="w-40" />
          <div className="ml-auto flex items-center gap-2">
            <SecondaryButton icon={Upload} onClick={handleImport}>Import</SecondaryButton>
            <SecondaryButton icon={Download} onClick={handleExportCSV}>Export CSV</SecondaryButton>
            <SecondaryButton icon={Download} onClick={handleExportExcel}>Export Excel</SecondaryButton>
          </div>
        </div>

        {/* Advanced Filters row */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-6 py-2 bg-slate-50/50">
          <Select value={filterCategory} onChange={handleCatFilter} options={categoryOptions} className="w-40" />
          <Select value={filterStatus} onChange={handleStatusFilter} options={statusOptions} className="w-32" />
          <Select value={filterStockStatus} onChange={handleStockStatusFilter} options={stockStatusOptions} className="w-36" />
          <Select value={filterBrand} onChange={handleBrandFilter} options={brandOptions} className="w-36" />
          {anyFilterActive && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-slate-50 transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Clear Filters
            </button>
          )}
          {filtered.length !== allProducts.length && (
            <span className="ml-auto text-xs text-muted-foreground">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        {/* Bulk action bar */}
        {someSelected && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 border-b border-amber-100 bg-amber-50 px-6 py-2"
          >
            <span className="text-xs font-semibold text-amber-700">{selectedIds.size} selected</span>
            <button onClick={handleBulkArchive} className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 transition-colors">
              <Archive className="h-3.5 w-3.5" /> Archive selected
            </button>
            <button onClick={handleBulkDelete} className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
              <Trash2 className="h-3.5 w-3.5" /> Delete selected
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors">
              Clear
            </button>
          </motion.div>
        )}

        {/* Table */}
        {filtered.length === 0 ? (
          <EmptyState icon={Package} title="No products found" subtitle="Try adjusting your filters or add a new product." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
                <TableHead className="w-10 pl-6">
                  <Checkbox
                    checked={allPageSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Product</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Barcode</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Category</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Brand</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Supplier</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground text-right">Purchase</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground text-right">Selling</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground text-right">MRP</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground text-center">Stock</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground text-center">Min</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground text-center">Status</TableHead>
                <TableHead className="w-10 pr-6" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((product, i) => {
                const cat = dbCategories.find((c) => c.id === product.categoryId);
                const brand = dbBrands.find((item) => item.id === product.brandId);
                const supplier = dbSuppliers.find((s) => s.id === product.supplierId);
                const stockStatus = getStockStatus(product);
                const isSelected = selectedIds.has(product.id);

                const catColor = cat?.color ?? "bg-slate-100";

                return (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    className={`group cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50/70 ${isSelected ? "bg-blue-50/50" : ""}`}
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.closest("[data-no-row-click]")) return;
                      openDetail(product);
                    }}
                  >
                    <TableCell className="pl-6" data-no-row-click>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(product.id)}
                        aria-label={`Select ${product.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg ${catColor}`}>
                          {product.emoji}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{product.name}</p>
                          <p className="text-[11px] text-muted-foreground">{product.sku}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{product.barcode}</TableCell>
                    <TableCell className="text-xs text-foreground">{cat?.name ?? "—"}</TableCell>
                    <TableCell className="text-xs text-foreground">{brand?.name ?? "—"}</TableCell>
                    <TableCell className="max-w-[120px] truncate text-xs text-muted-foreground">{supplier?.name ?? "—"}</TableCell>
                    <TableCell className="text-right text-xs font-medium text-foreground">{fmtINR(product.purchasePrice)}</TableCell>
                    <TableCell className="text-right text-xs font-semibold text-foreground">{fmtINR(product.sellingPrice)}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{fmtINR(product.mrp)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-sm font-bold text-foreground">{product.currentStock}</span>
                        <StatusPill status={stockStatus} />
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">{product.minStock}</TableCell>
                    <TableCell className="text-center">
                      <StatusPill status={product.status} />
                    </TableCell>
                    <TableCell className="pr-4" data-no-row-click>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-700">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => openDetail(product)} className="gap-2 text-xs">
                            <Eye className="h-3.5 w-3.5" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(product)} className="gap-2 text-xs">
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(product)} className="gap-2 text-xs">
                            <Copy className="h-3.5 w-3.5" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {product.status === "archived" ? (
                            <DropdownMenuItem onClick={() => handleRestore(product.id)} className="gap-2 text-xs text-emerald-600 focus:text-emerald-600">
                              <RotateCcw className="h-3.5 w-3.5" /> Restore
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleArchive(product.id)} className="gap-2 text-xs text-amber-600 focus:text-amber-600">
                              <Archive className="h-3.5 w-3.5" /> Archive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDelete(product.id)} className="gap-2 text-xs text-red-600 focus:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />

        {/* Detail Dialog */}
        <ProductDetailDialog
          product={detailProduct}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onEdit={openEdit}
          dbCategories={dbCategories}
          dbSuppliers={dbSuppliers}
          dbBrands={dbBrands}
        />

        {/* Create / Edit Dialog */}
        <Dialog open={formOpen} onOpenChange={(v) => { if (!isSaving) setFormOpen(v); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogDescription className="sr-only">
                {formMode === "create" ? "Fill in the details to add a new product." : "Edit the product details below."}
              </DialogDescription>
              <DialogTitle>{formMode === "create" ? "Add New Product" : "Edit Product"}</DialogTitle>
            </DialogHeader>
            <ProductForm
              key={editingId ?? "create"}
              initial={formInitial}
              isEdit={formMode === "edit"}
              onSave={handleFormSave}
              onCancel={() => setFormOpen(false)}
              saving={isSaving}
              saveError={saveError}
              dbCategories={dbCategories}
              dbSuppliers={dbSuppliers}
              dbBrands={activeBrands}
            />
          </DialogContent>
        </Dialog>
      </SectionCard>
    </div>
  );
}
