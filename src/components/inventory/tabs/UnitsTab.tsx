import { useState } from "react";
import { Plus, MoreVertical, Pencil, Trash2, Ruler } from "lucide-react";
import { units as initialUnits } from "@/lib/inventory-data";
import type { Unit } from "@/lib/inventory-data";
import { SectionCard, PrimaryButton, EmptyState } from "@/components/inventory/shared";
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

interface UnitFormState {
  name: string;
  shortCode: string;
  isCustom: boolean;
}

function UnitFormDialog({
  open,
  onClose,
  initial,
  onSubmit,
  title,
}: {
  open: boolean;
  onClose: () => void;
  initial?: UnitFormState;
  onSubmit: (data: UnitFormState) => void;
  title: string;
}) {
  const [form, setForm] = useState<UnitFormState>(
    initial ?? { name: "", shortCode: "", isCustom: false }
  );

  const handleOpenChange = (o: boolean) => {
    if (o && initial) setForm(initial);
    if (!o) onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.shortCode.trim()) return;
    onSubmit(form);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Unit Name</label>
            <input
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Kilogram"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Short Code</label>
            <input
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={form.shortCode}
              onChange={(e) => setForm((f) => ({ ...f, shortCode: e.target.value }))}
              placeholder="e.g. kg"
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              id="isCustom"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 accent-blue-500"
              checked={form.isCustom}
              onChange={(e) => setForm((f) => ({ ...f, isCustom: e.target.checked }))}
            />
            <label htmlFor="isCustom" className="text-sm font-medium text-foreground cursor-pointer">
              Custom Unit
            </label>
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
              Save Unit
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UnitsTab() {
  const [units, setUnits] = useState<Unit[]>(initialUnits);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Unit | null>(null);

  const handleCreate = (data: UnitFormState) => {
    const newUnit: Unit = {
      id: `u-${Date.now()}`,
      name: data.name,
      shortCode: data.shortCode,
      isCustom: data.isCustom,
    };
    setUnits((prev) => [...prev, newUnit]);
  };

  const handleEdit = (data: UnitFormState) => {
    if (!editTarget) return;
    setUnits((prev) =>
      prev.map((u) =>
        u.id === editTarget.id
          ? { ...u, name: data.name, shortCode: data.shortCode, isCustom: data.isCustom }
          : u
      )
    );
    setEditTarget(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Delete this unit? This cannot be undone.")) {
      setUnits((prev) => prev.filter((u) => u.id !== id));
    }
  };

  return (
    <SectionCard
      title="Manage Units"
      subtitle={`${units.length} units configured`}
      action={
        <PrimaryButton icon={Plus} onClick={() => setCreateOpen(true)}>
          Add Unit
        </PrimaryButton>
      }
      noPadding
    >
      {units.length === 0 ? (
        <EmptyState icon={Ruler} title="No units configured" subtitle="Add a unit to get started." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-slate-100 hover:bg-transparent">
              <TableHead className="text-xs font-semibold text-muted-foreground">Unit Name</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Short Code</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Type</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {units.map((unit) => (
              <TableRow key={unit.id} className="border-slate-100 hover:bg-slate-50/60">
                <TableCell className="text-sm font-medium text-foreground">{unit.name}</TableCell>
                <TableCell>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-semibold text-slate-700">
                    {unit.shortCode}
                  </span>
                </TableCell>
                <TableCell>
                  {unit.isCustom ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                      Custom
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                      Standard
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={() => setEditTarget(unit)}>
                        <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(unit.id)}
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
      )}

      <UnitFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        title="Add Unit"
      />

      {editTarget && (
        <UnitFormDialog
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          initial={{ name: editTarget.name, shortCode: editTarget.shortCode, isCustom: editTarget.isCustom }}
          onSubmit={handleEdit}
          title="Edit Unit"
        />
      )}
    </SectionCard>
  );
}
