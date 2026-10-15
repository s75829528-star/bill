import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, MoreVertical, Package, Pencil, Plus, Trash2, Copy, Power } from "lucide-react";
import type { Brand } from "@/lib/inventory-data";
import { SectionCard, PrimaryButton, SearchInput, Select, Pagination, EmptyState, StatusPill, fmtDate } from "@/components/inventory/shared";
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
import { useBusiness } from "@/contexts/BusinessContext";
import {
  dbToBrand,
  type DbBrand,
  type BrandStatus,
} from "@/services/brands";
import {
  useBrands,
  useCreateBrand,
  useDeleteBrand,
  useDuplicateBrand,
  useSetBrandStatus,
  useUpdateBrand,
} from "@/hooks/useBrandsQuery";

const PAGE_SIZE = 8;
const COLOR_OPTIONS = [
  { label: "Blue", value: "bg-blue-500" },
  { label: "Violet", value: "bg-violet-500" },
  { label: "Emerald", value: "bg-emerald-500" },
  { label: "Amber", value: "bg-amber-500" },
  { label: "Red", value: "bg-red-500" },
  { label: "Cyan", value: "bg-cyan-500" },
  { label: "Orange", value: "bg-orange-500" },
  { label: "Pink", value: "bg-pink-500" },
];
const EMPTY_FORM: BrandFormState = {
  name: "",
  description: "",
  logoInitial: "",
  color: "bg-blue-500",
  website: "",
};

interface BrandFormState {
  name: string;
  description: string;
  logoInitial: string;
  color: string;
  website: string;
}

function BrandFormDialog({
  open,
  onClose,
  initial,
  onSubmit,
  title,
  saving,
  error,
}: {
  open: boolean;
  onClose: () => void;
  initial?: BrandFormState;
  onSubmit: (data: BrandFormState) => Promise<void>;
  title: string;
  saving: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<BrandFormState>(initial ?? EMPTY_FORM);

  const handleNameChange = (name: string) => {
    setForm((f) => ({
      ...f,
      name,
      logoInitial: f.logoInitial || name.charAt(0).toUpperCase(),
    }));
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) setForm(initial ?? EMPTY_FORM);
    if (!isOpen && !saving) onClose();
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    await onSubmit({ ...form, logoInitial: form.logoInitial || form.name.charAt(0).toUpperCase() });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white ${form.color}`}>
              {form.logoInitial || form.name.charAt(0).toUpperCase() || "?"}
            </div>
            <span className="text-sm text-muted-foreground">Brand logo preview</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Name</label>
            <input
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Brand name"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Description</label>
            <input
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Short description"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Website</label>
            <input
              type="url"
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              placeholder="https://example.com"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Logo Initial</label>
            <input
              className="h-9 w-20 rounded-xl border border-slate-200 bg-white px-3 text-center text-sm font-bold uppercase outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={form.logoInitial}
              onChange={(e) => setForm((f) => ({ ...f, logoInitial: e.target.value.slice(0, 1).toUpperCase() }))}
              placeholder="A"
              maxLength={1}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  title={color.label}
                  onClick={() => setForm((f) => ({ ...f, color: color.value }))}
                  className={`h-7 w-7 rounded-full ${color.value} transition-transform hover:scale-110 ${form.color === color.value ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : ""}`}
                />
              ))}
            </div>
          </div>
          {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <button type="button" disabled={saving} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-slate-50">
                Cancel
              </button>
            </DialogClose>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Brand
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function toFormState(brand: Brand): BrandFormState {
  return {
    name: brand.name,
    description: brand.description,
    logoInitial: brand.logoInitial,
    color: brand.color,
    website: brand.website ?? "",
  };
}

export function BrandsTab() {
  const { business } = useBusiness();
  const businessId = business?.id ?? null;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | BrandStatus>("all");
  const [hasProducts, setHasProducts] = useState<"all" | "yes" | "no">("all");
  const [createdRange, setCreatedRange] = useState<"all" | "30d" | "90d" | "year">("all");
  const [sortValue, setSortValue] = useState("name-asc");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [createKey, setCreateKey] = useState(0);
  const [editTarget, setEditTarget] = useState<DbBrand | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [sortBy, sortDirection] = sortValue.split("-") as [string, "asc" | "desc"];
  const filters = useMemo(
    () => ({
      search,
      status,
      hasProducts,
      createdRange,
      sortBy: sortBy as "name" | "created_at" | "updated_at" | "product_count",
      sortDirection,
      page,
      pageSize: PAGE_SIZE,
    }),
    [search, status, hasProducts, createdRange, sortBy, sortDirection, page]
  );
  const { data, isLoading, error: queryError } = useBrands(businessId, filters);
  const brands = data?.data ?? [];
  const displayBrands = brands.map(dbToBrand);
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const createMutation = useCreateBrand(businessId);
  const updateMutation = useUpdateBrand(businessId);
  const deleteMutation = useDeleteBrand(businessId);
  const duplicateMutation = useDuplicateBrand(businessId);
  const statusMutation = useSetBrandStatus(businessId);
  const saving = createMutation.isPending || updateMutation.isPending;

  function openCreate() {
    setFormError(null);
    setCreateKey((key) => key + 1);
    setCreateOpen(true);
  }

  function resetToFirstPage() {
    if (page !== 1) setPage(1);
  }

  async function handleCreate(form: BrandFormState) {
    if (!businessId) return;
    setFormError(null);
    try {
      await createMutation.mutateAsync({
        business_id: businessId,
        name: form.name,
        description: form.description,
        logo_initial: form.logoInitial,
        logo_color: form.color,
        website: form.website || null,
        status: "active",
      });
      setCreateOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to create brand.");
    }
  }

  async function handleEdit(form: BrandFormState) {
    if (!editTarget) return;
    setFormError(null);
    try {
      await updateMutation.mutateAsync({
        id: editTarget.id,
        payload: {
          name: form.name,
          description: form.description,
          logo_initial: form.logoInitial,
          logo_color: form.color,
          website: form.website || null,
        },
      });
      setEditTarget(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to update brand.");
    }
  }

  async function handleDelete(brand: DbBrand) {
    if (!window.confirm("Delete this brand? This cannot be undone.")) return;
    setActionError(null);
    try {
      await deleteMutation.mutateAsync(brand.id);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to delete brand.");
    }
  }

  async function handleDuplicate(brand: DbBrand) {
    setActionError(null);
    try {
      await duplicateMutation.mutateAsync(brand);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to duplicate brand.");
    }
  }

  async function handleStatus(brand: DbBrand) {
    setActionError(null);
    try {
      await statusMutation.mutateAsync({
        id: brand.id,
        status: brand.status === "active" ? "inactive" : "active",
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to change brand status.");
    }
  }

  const empty = !isLoading && brands.length === 0;
  const loadError = queryError instanceof Error ? queryError.message : queryError ? "Failed to load brands." : null;

  return (
    <SectionCard
      title="Brands"
      subtitle={`${total} brand${total === 1 ? "" : "s"}`}
      action={
        <PrimaryButton
          icon={Plus}
          onClick={openCreate}
        >
          Create Brand
        </PrimaryButton>
      }
      noPadding
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-6 py-3">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            resetToFirstPage();
          }}
          placeholder="Search brands..."
          className="w-56"
        />
        <Select
          value={status}
          onChange={(value) => {
            setStatus(value as "all" | BrandStatus);
            resetToFirstPage();
          }}
          options={[
            { value: "all", label: "All Status" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
          className="w-32"
        />
        <Select
          value={hasProducts}
          onChange={(value) => {
            setHasProducts(value as "all" | "yes" | "no");
            resetToFirstPage();
          }}
          options={[
            { value: "all", label: "All Products" },
            { value: "yes", label: "Has Products" },
            { value: "no", label: "No Products" },
          ]}
          className="w-36"
        />
        <Select
          value={createdRange}
          onChange={(value) => {
            setCreatedRange(value as "all" | "30d" | "90d" | "year");
            resetToFirstPage();
          }}
          options={[
            { value: "all", label: "Any Date" },
            { value: "30d", label: "Last 30 Days" },
            { value: "90d", label: "Last 90 Days" },
            { value: "year", label: "Last Year" },
          ]}
          className="w-36"
        />
        <Select
          value={sortValue}
          onChange={(value) => {
            setSortValue(value);
            resetToFirstPage();
          }}
          options={[
            { value: "name-asc", label: "Name A–Z" },
            { value: "name-desc", label: "Name Z–A" },
            { value: "created_at-desc", label: "Newest" },
            { value: "created_at-asc", label: "Oldest" },
            { value: "updated_at-desc", label: "Recently Updated" },
            { value: "product_count-desc", label: "Most Products" },
            { value: "product_count-asc", label: "Fewest Products" },
          ]}
          className="w-40"
        />
      </div>

      {(loadError || actionError) && (
        <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">
          {loadError || actionError}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => <div key={index} className="h-48 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      ) : empty ? (
        <div className="p-6">
          <EmptyState
            icon={Package}
            title={search || status !== "all" || hasProducts !== "all" ? "No brands match your filters" : "No brands yet"}
            subtitle={search || status !== "all" || hasProducts !== "all" ? "Try adjusting your filters." : "Create your first brand to use it across your products."}
          />
          {!search && status === "all" && hasProducts === "all" && (
            <div className="flex justify-center pb-6">
              <PrimaryButton icon={Plus} onClick={openCreate}>Create Brand</PrimaryButton>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
            {displayBrands.map((brand, index) => {
              const source = brands[index];
              return (
                <motion.div
                  key={brand.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
                  className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="absolute right-3 top-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => { setFormError(null); setEditTarget(source); }}>
                          <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(source)}>
                          <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatus(source)}>
                          <Power className="mr-2 h-3.5 w-3.5" /> {source.status === "active" ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(source)} className="text-red-600 focus:text-red-600">
                          <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {brand.logoUrl ? (
                    <img src={brand.logoUrl} alt="" className="mb-4 h-12 w-12 rounded-xl object-contain" />
                  ) : (
                    <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white ${brand.color}`}>
                      {brand.logoInitial}
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2 pr-6">
                    <h4 className="text-sm font-semibold leading-snug text-foreground">{brand.name}</h4>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{brand.productCount}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{brand.description || "No description"}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {brand.productCount} {brand.productCount === 1 ? "product" : "products"}
                    </p>
                    <StatusPill status={brand.status} />
                  </div>
                  {brand.createdAt && <p className="mt-2 text-[10px] text-muted-foreground">Created {fmtDate(brand.createdAt.slice(0, 10))}</p>}
                </motion.div>
              );
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      <BrandFormDialog
        key={`create-${createKey}`}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        title="Create Brand"
        saving={saving}
        error={formError}
      />
      {editTarget && (
        <BrandFormDialog
          key={editTarget.id}
          open
          onClose={() => setEditTarget(null)}
          initial={toFormState(dbToBrand(editTarget))}
          onSubmit={handleEdit}
          title="Edit Brand"
          saving={saving}
          error={formError}
        />
      )}
    </SectionCard>
  );
}