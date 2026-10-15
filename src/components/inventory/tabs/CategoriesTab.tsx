import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Tag, MoreVertical, Plus, Pencil, Trash2 } from "lucide-react";
import { useBusiness } from "@/contexts/BusinessContext";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useProducts,
} from "@/hooks/useProductsQuery";
import { SectionCard, PrimaryButton } from "@/components/inventory/shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

const colorDotMap: Record<string, string> = {
  "bg-blue-500": "bg-blue-500",
  "bg-violet-500": "bg-violet-500",
  "bg-emerald-500": "bg-emerald-500",
  "bg-amber-500": "bg-amber-500",
  "bg-red-500": "bg-red-500",
  "bg-cyan-500": "bg-cyan-500",
  "bg-orange-500": "bg-orange-500",
  "bg-pink-500": "bg-pink-500",
};

interface CategoryFormState {
  name: string;
  description: string;
  color: string;
}

function CategoryFormDialog({
  open,
  onClose,
  initial,
  onSubmit,
  title,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  initial?: CategoryFormState;
  onSubmit: (data: CategoryFormState) => void;
  title: string;
  loading?: boolean;
}) {
  const [form, setForm] = useState<CategoryFormState>(
    initial ?? { name: "", description: "", color: "bg-blue-500" }
  );

  const handleOpenChange = (o: boolean) => {
    if (o && initial) setForm(initial);
    if (!o) onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogDescription className="sr-only">
            {title === "Create Category" ? "Fill in the details to create a new category." : "Edit the category details below."}
          </DialogDescription>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Name</label>
            <input
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Category name"
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
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setForm((f) => ({ ...f, color: c.value }))}
                  className={`h-7 w-7 rounded-full ${colorDotMap[c.value]} transition-transform hover:scale-110 ${form.color === c.value ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : ""}`}
                />
              ))}
            </div>
          </div>
          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-slate-50">
                Cancel
              </button>
            </DialogClose>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md disabled:opacity-60"
            >
              {loading ? "Saving…" : "Save Category"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CategoriesTab() {
  const { business } = useBusiness();
  const businessId = business?.id ?? null;

  const { data: dbCategories = [], isLoading } = useCategories(businessId);
  const { data: dbProducts = [] } = useProducts(businessId);

  const createMutation = useCreateCategory(businessId);
  const updateMutation = useUpdateCategory(businessId);
  const deleteMutation = useDeleteCategory(businessId);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ id: string; name: string; description: string; color: string } | null>(null);

  // Compute product count per category from live products
  const productCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    dbProducts.forEach((p) => {
      if (p.category_id) map[p.category_id] = (map[p.category_id] ?? 0) + 1;
    });
    return map;
  }, [dbProducts]);

  const maxCount = Math.max(...dbCategories.map((c) => productCountMap[c.id] ?? 0), 1);

  const handleCreate = (data: CategoryFormState) => {
    if (!businessId) return;
    createMutation.mutate(
      {
        business_id: businessId,
        name: data.name.trim(),
        description: data.description.trim() || null,
        color: data.color,
      },
      { onSuccess: () => setCreateOpen(false) }
    );
  };

  const handleEdit = (data: CategoryFormState) => {
    if (!editTarget) return;
    updateMutation.mutate(
      {
        id: editTarget.id,
        payload: {
          name: data.name.trim(),
          description: data.description.trim() || null,
          color: data.color,
        },
      },
      { onSuccess: () => setEditTarget(null) }
    );
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Delete this category? This cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <SectionCard title="Categories" subtitle="Loading…">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 rounded-2xl border border-slate-200 bg-slate-100 animate-pulse" />
          ))}
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Categories"
      subtitle={`${dbCategories.length} categories`}
      action={
        <PrimaryButton icon={Plus} onClick={() => setCreateOpen(true)}>
          Create Category
        </PrimaryButton>
      }
    >
      {dbCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Tag className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-foreground">No categories yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create your first category to organise products.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dbCategories.map((cat, i) => {
            const count = productCountMap[cat.id] ?? 0;
            const color = cat.color ?? "bg-blue-500";
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04, ease: "easeOut" }}
                className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Actions menu */}
                <div className="absolute right-3 top-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem
                        onClick={() =>
                          setEditTarget({
                            id: cat.id,
                            name: cat.name,
                            description: cat.description ?? "",
                            color,
                          })
                        }
                      >
                        <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(cat.id)}
                        className="text-red-600 focus:text-red-600"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Icon chip */}
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
                  <Tag className="h-5 w-5 text-white" />
                </div>

                {/* Name + badge */}
                <div className="flex items-start justify-between gap-2 pr-6">
                  <h4 className="text-sm font-semibold text-foreground leading-snug">{cat.name}</h4>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                    {count}
                  </span>
                </div>

                {/* Description */}
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{cat.description ?? ""}</p>

                {/* Mini progress bar */}
                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Category Analytics</span>
                    <span className="text-[10px] font-semibold text-foreground">{count} products</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100">
                    <div
                      className={`h-1.5 rounded-full ${color} transition-all duration-500`}
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <CategoryFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        title="Create Category"
        loading={createMutation.isPending}
      />

      {/* Edit Dialog */}
      {editTarget && (
        <CategoryFormDialog
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          initial={{ name: editTarget.name, description: editTarget.description, color: editTarget.color }}
          onSubmit={handleEdit}
          title="Edit Category"
          loading={updateMutation.isPending}
        />
      )}
    </SectionCard>
  );
}
