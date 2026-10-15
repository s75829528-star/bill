// ── Documents Tab ─────────────────────────────────────────────────
import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  FileSpreadsheet,
  FileClock,
  Truck,
  Undo2,
  Redo2,
  Repeat,
  ShoppingCart,
  ArrowRight,
  Plus,
  Upload,
  Download,
  Eye,
  Pencil,
  FolderInput,
  Archive,
  ArchiveRestore,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  FileUp,
  AlertCircle,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBusiness } from "@/contexts/BusinessContext";
import { SectionCard } from "@/components/billing/shared";
import { useInvoices } from "@/hooks/useInvoicesQuery";
import { useQuotations } from "@/hooks/useQuotationsQuery";
import { useCreditNotes } from "@/hooks/useCreditNotesQuery";
import { useRecurringInvoices } from "@/hooks/useRecurringQuery";
import {
  useDocuments,
  useUploadDocument,
  useDeleteDocument,
  useArchiveDocument,
  useRestoreDocument,
  useRenameDocument,
  useMoveDocument,
  useReplaceDocument,
} from "@/hooks/useDocumentsQuery";
import {
  DOCUMENT_TYPES,
  LINKED_MODULES,
  MIME_TO_EXT,
  documentsService,
} from "@/services/documents";
import type { DbDocument } from "@/services/documents";

// ── Utilities ──────────────────────────────────────────────────────

function fmtFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function extBadge(mimeType: string): string {
  return (MIME_TO_EXT[mimeType] ?? "file").toUpperCase();
}

const EXT_COLORS: Record<string, string> = {
  PDF: "bg-red-50 text-red-600",
  PNG: "bg-emerald-50 text-emerald-600",
  JPG: "bg-emerald-50 text-emerald-600",
  WEBP: "bg-emerald-50 text-emerald-600",
  DOCX: "bg-blue-50 text-blue-600",
  XLSX: "bg-green-50 text-green-600",
  CSV: "bg-teal-50 text-teal-600",
  TXT: "bg-slate-50 text-slate-600",
  ZIP: "bg-amber-50 text-amber-600",
};

function linkedModuleLabel(m: string | null): string {
  if (!m) return "—";
  return LINKED_MODULES.find((l) => l.value === m)?.label ?? m;
}

// ── Document type card types ───────────────────────────────────────

interface DocTypeCard {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  count: number;
  colorBg: string;
  colorText: string;
  colorBorder: string;
  viewTab?: string;
  comingSoon?: boolean;
}

function DocCard({
  doc,
  index,
  onNavigate,
}: {
  doc: DocTypeCard;
  index: number;
  onNavigate?: (tabId: string) => void;
}) {
  const Icon = doc.icon;

  const handleViewAll = () => {
    if (doc.comingSoon) return;
    if (doc.viewTab && onNavigate) {
      onNavigate(doc.viewTab);
    }
  };

  const handleCreate = () => {
    if (doc.comingSoon) return;
    if (doc.viewTab && onNavigate) {
      onNavigate(doc.viewTab);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className={`relative rounded-2xl border ${doc.colorBorder} bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200`}
    >
      {doc.comingSoon && (
        <div className="absolute top-3 right-3">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Coming Soon
          </span>
        </div>
      )}

      <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${doc.colorBg}`}>
        <Icon className={`h-6 w-6 ${doc.colorText}`} />
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-foreground">{doc.label}</h3>
          {!doc.comingSoon && (
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${doc.colorBg} ${doc.colorText}`}>
              {doc.count}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{doc.description}</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleViewAll}
          disabled={doc.comingSoon}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
            doc.comingSoon
              ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
              : `${doc.colorBorder} ${doc.colorBg} ${doc.colorText} hover:opacity-80`
          }`}
        >
          View All <ArrowRight className="h-3 w-3" />
        </button>
        <button
          onClick={handleCreate}
          disabled={doc.comingSoon}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
            doc.comingSoon
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-[image:var(--gradient-brand)] text-white shadow-sm hover:opacity-90"
          }`}
        >
          <Plus className="h-3 w-3" /> Create New
        </button>
      </div>
    </motion.div>
  );
}

// ── Upload Dialog ──────────────────────────────────────────────────

function UploadDialog({
  open,
  businessId,
  onClose,
}: {
  open: boolean;
  businessId: string;
  onClose: () => void;
}) {
  const uploadMutation = useUploadDocument(businessId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("Other");
  const [linkedModule, setLinkedModule] = useState("none");
  const [linkedRecordId, setLinkedRecordId] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const reset = () => {
    setFile(null); setDocName(""); setDocType("Other");
    setLinkedModule("none"); setLinkedRecordId(""); setError("");
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFileSelect = (f: File) => {
    setError("");
    try { documentsService.validateFile(f); } catch (e: unknown) {
      setError((e as Error).message); return;
    }
    setFile(f);
    if (!docName) setDocName(f.name.replace(/\.[^.]+$/, ""));
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  }, [docName]);

  const handleSubmit = async () => {
    if (!file) { setError("Please select a file."); return; }
    if (!docName.trim()) { setError("Document name is required."); return; }
    setError("");
    try {
      await uploadMutation.mutateAsync({
        businessId,
        file,
        documentName: docName.trim(),
        documentType: docType,
        linkedModule: linkedModule === "none" ? undefined : linkedModule,
        linkedRecordId: linkedRecordId.trim() || undefined,
      });
      handleClose();
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors ${
              dragging ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.xlsx,.csv,.txt,.zip"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
            />
            {file ? (
              <>
                <FileText className="mb-2 h-8 w-8 text-blue-500" />
                <p className="text-sm font-semibold text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">{fmtFileSize(file.size)}</p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); setDocName(""); }}
                  className="mt-2 text-xs text-rose-500 hover:underline"
                >
                  Remove
                </button>
              </>
            ) : (
              <>
                <FileUp className="mb-2 h-8 w-8 text-slate-400" />
                <p className="text-sm font-semibold text-foreground">Click or drag a file here</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  PDF, PNG, JPG, WEBP, DOCX, XLSX, CSV, TXT, ZIP — max 10 MB
                </p>
              </>
            )}
          </div>

          {/* Document name */}
          <div className="space-y-1.5">
            <Label htmlFor="doc-name">Document Name</Label>
            <Input
              id="doc-name"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="e.g. Invoice INV-2024-001"
            />
          </div>

          {/* Document type */}
          <div className="space-y-1.5">
            <Label>Document Type</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Linked module */}
          <div className="space-y-1.5">
            <Label>Link to Module <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Select value={linkedModule} onValueChange={(v) => { setLinkedModule(v); setLinkedRecordId(""); }}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {LINKED_MODULES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {linkedModule && linkedModule !== "none" && (
            <div className="space-y-1.5">
              <Label htmlFor="linked-id">
                {LINKED_MODULES.find((m) => m.value === linkedModule)?.label} ID / Number
              </Label>
              <Input
                id="linked-id"
                value={linkedRecordId}
                onChange={(e) => setLinkedRecordId(e.target.value)}
                placeholder="e.g. INV-2024-001"
              />
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={handleClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploadMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60"
          >
            {uploadMutation.isPending ? (
              <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Uploading…</>
            ) : (
              <><Upload className="h-4 w-4" /> Upload</>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Preview Dialog ─────────────────────────────────────────────────

function PreviewDialog({
  doc,
  onClose,
}: {
  doc: DbDocument | null;
  onClose: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const open = !!doc;
  const isImage = doc?.mime_type.startsWith("image/") ?? false;
  const isPdf = doc?.mime_type === "application/pdf";
  const isText = doc?.mime_type === "text/plain" || doc?.mime_type === "text/csv";
  const canPreview = isImage || isPdf || isText;

  const loadUrl = useCallback(async (filePath: string) => {
    setLoading(true); setError(""); setUrl(null);
    try {
      const signed = await documentsService.getSignedUrl(filePath, 300);
      setUrl(signed);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load signed URL whenever doc changes and preview is supported
  useEffect(() => {
    if (doc && canPreview) {
      loadUrl(doc.file_path);
    } else {
      setUrl(null);
      setError("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc?.id]);

  const handleClose = () => { setUrl(null); setError(""); onClose(); };

  const handleDownload = async () => {
    if (!doc) return;
    try {
      const signed = await documentsService.getSignedUrl(doc.file_path, 60);
      const a = document.createElement("a");
      a.href = signed; a.download = doc.file_name;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch (e: unknown) { alert((e as Error).message); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">{doc?.document_name}</DialogTitle>
        </DialogHeader>

        <div className="min-h-[300px] overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
          {loading && (
            <div className="flex h-64 items-center justify-center">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
          )}
          {error && (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-sm text-rose-600">
              <AlertCircle className="h-8 w-8" />
              {error}
            </div>
          )}
          {url && isPdf && (
            <iframe src={url} className="h-[60vh] w-full" title={doc?.file_name} />
          )}
          {url && isImage && (
            <img src={url} alt={doc?.file_name} className="mx-auto max-h-[60vh] object-contain p-4" />
          )}
          {url && isText && (
            <iframe src={url} className="h-[60vh] w-full bg-white" title={doc?.file_name} />
          )}
          {!loading && !error && !canPreview && (
            <div className="flex h-64 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
              <FileText className="h-12 w-12 text-slate-300" />
              <p>Preview not available for <strong>.{extBadge(doc?.mime_type ?? "")}</strong> files.</p>
              <button onClick={handleDownload} className="rounded-xl bg-[image:var(--gradient-brand)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90">
                Download File
              </button>
            </div>
          )}
        </div>

        <DialogFooter>
          <button onClick={handleClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Close
          </button>
          <button onClick={handleDownload} className="inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90">
            <Download className="h-4 w-4" /> Download
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Rename Dialog ──────────────────────────────────────────────────

function RenameDialog({
  doc,
  businessId,
  onClose,
}: {
  doc: DbDocument | null;
  businessId: string;
  onClose: () => void;
}) {
  const renameMutation = useRenameDocument(businessId);
  const [name, setName] = useState(doc?.document_name ?? "");
  const [error, setError] = useState("");

  // Sync input when a different doc is opened
  useEffect(() => {
    if (doc) setName(doc.document_name);
  }, [doc?.id]);

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Name cannot be empty."); return; }
    if (!doc) return;
    try {
      await renameMutation.mutateAsync({ id: doc.id, name: name.trim() });
      onClose();
    } catch (e: unknown) { setError((e as Error).message); }
  };

  return (
    <Dialog open={!!doc} onOpenChange={(o) => { if (!o) { setError(""); onClose(); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Rename Document</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Document Name</Label>
            <Input
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              autoFocus
            />
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>
        <DialogFooter>
          <button onClick={() => { setError(""); onClose(); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={handleSubmit} disabled={renameMutation.isPending} className="rounded-xl bg-[image:var(--gradient-brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60">
            {renameMutation.isPending ? "Saving…" : "Save"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Move Dialog ────────────────────────────────────────────────────

function MoveDialog({
  doc,
  businessId,
  onClose,
}: {
  doc: DbDocument | null;
  businessId: string;
  onClose: () => void;
}) {
  const moveMutation = useMoveDocument(businessId);
  const [linkedModule, setLinkedModule] = useState(doc?.linked_module ?? "none");
  const [linkedRecordId, setLinkedRecordId] = useState(doc?.linked_record_id ?? "");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!doc) return;
    try {
      await moveMutation.mutateAsync({
        id: doc.id,
        linkedModule: linkedModule === "none" ? null : linkedModule,
        linkedRecordId: linkedRecordId.trim() || null,
      });
      onClose();
    } catch (e: unknown) { setError((e as Error).message); }
  };

  return (
    <Dialog open={!!doc} onOpenChange={(o) => { if (!o) { setError(""); onClose(); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Move Document</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Link to Module</Label>
            <Select
              value={linkedModule || "none"}
              onValueChange={(v) => { setLinkedModule(v); setLinkedRecordId(""); }}
            >
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {LINKED_MODULES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {linkedModule && linkedModule !== "none" && (
            <div className="space-y-1.5">
              <Label>Record ID / Number <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                value={linkedRecordId}
                onChange={(e) => setLinkedRecordId(e.target.value)}
                placeholder="e.g. INV-2024-001"
              />
            </div>
          )}
          {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>
        <DialogFooter>
          <button onClick={() => { setError(""); onClose(); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={handleSubmit} disabled={moveMutation.isPending} className="rounded-xl bg-[image:var(--gradient-brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60">
            {moveMutation.isPending ? "Moving…" : "Move"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Confirm Dialog ──────────────────────────────────────────

function DeleteDialog({
  doc,
  businessId,
  onClose,
}: {
  doc: DbDocument | null;
  businessId: string;
  onClose: () => void;
}) {
  const deleteMutation = useDeleteDocument(businessId);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!doc) return;
    try {
      await deleteMutation.mutateAsync({ id: doc.id, filePath: doc.file_path });
      onClose();
    } catch (e: unknown) { setError((e as Error).message); }
  };

  return (
    <Dialog open={!!doc} onOpenChange={(o) => { if (!o) { setError(""); onClose(); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Delete Document?</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            This will permanently delete <strong className="text-foreground">{doc?.document_name}</strong> and its file from storage. This action cannot be undone.
          </p>
          {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>
        <DialogFooter>
          <button onClick={() => { setError(""); onClose(); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={handleDelete} disabled={deleteMutation.isPending} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-60">
            {deleteMutation.isPending ? "Deleting…" : "Delete"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Replace File Dialog ────────────────────────────────────────────

function ReplaceDialog({
  doc,
  businessId,
  onClose,
}: {
  doc: DbDocument | null;
  businessId: string;
  onClose: () => void;
}) {
  const replaceMutation = useReplaceDocument(businessId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const handleFileSelect = (f: File) => {
    setError("");
    try { documentsService.validateFile(f); setFile(f); }
    catch (e: unknown) { setError((e as Error).message); }
  };

  const handleSubmit = async () => {
    if (!file || !doc) { setError("Please select a replacement file."); return; }
    try {
      await replaceMutation.mutateAsync({ id: doc.id, file });
      setFile(null); onClose();
    } catch (e: unknown) { setError((e as Error).message); }
  };

  return (
    <Dialog open={!!doc} onOpenChange={(o) => { if (!o) { setFile(null); setError(""); onClose(); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Replace File</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            Replacing <strong className="text-foreground">{doc?.file_name}</strong>. The document name and links are kept.
          </p>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 hover:border-slate-300"
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.xlsx,.csv,.txt,.zip"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
            />
            {file ? (
              <><FileText className="mb-1 h-6 w-6 text-blue-500" /><p className="text-sm font-semibold">{file.name}</p><p className="text-xs text-muted-foreground">{fmtFileSize(file.size)}</p></>
            ) : (
              <><FileUp className="mb-1 h-6 w-6 text-slate-400" /><p className="text-sm text-muted-foreground">Click to select new file</p></>
            )}
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>
        <DialogFooter>
          <button onClick={() => { setFile(null); setError(""); onClose(); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={handleSubmit} disabled={replaceMutation.isPending || !file} className="rounded-xl bg-[image:var(--gradient-brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60">
            {replaceMutation.isPending ? "Replacing…" : "Replace"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── File Manager ───────────────────────────────────────────────────

const PAGE_SIZE = 10;

function FileManager({ businessId }: { businessId: string }) {
  const archiveMutation = useArchiveDocument(businessId);
  const restoreMutation = useRestoreDocument(businessId);

  // Filters
  const [search, setSearch] = useState("");
  const [filterDocType, setFilterDocType] = useState("all");
  const [filterFileType, setFilterFileType] = useState("all");
  const [filterLinkedModule, setFilterLinkedModule] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(1);

  // Dialogs
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DbDocument | null>(null);
  const [renameDoc, setRenameDoc] = useState<DbDocument | null>(null);
  const [moveDoc, setMoveDoc] = useState<DbDocument | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<DbDocument | null>(null);
  const [replaceDoc, setReplaceDoc] = useState<DbDocument | null>(null);

  const filters = {
    search,
    docType: filterDocType === "all" ? undefined : filterDocType,
    fileType: filterFileType === "all" ? undefined : filterFileType,
    linkedModule: filterLinkedModule === "all" ? undefined : filterLinkedModule,
    dateFrom: filterDateFrom || undefined,
    dateTo: filterDateTo || undefined,
    showArchived,
  };

  const { data, isLoading } = useDocuments(businessId, filters, page, PAGE_SIZE);
  const documents = data?.documents ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleDownload = async (doc: DbDocument) => {
    try {
      const url = await documentsService.getSignedUrl(doc.file_path, 60);
      const a = document.createElement("a");
      a.href = url; a.download = doc.file_name;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch (e: unknown) { alert((e as Error).message); }
  };

  const clearFilters = () => {
    setSearch(""); setFilterDocType("all"); setFilterFileType("all");
    setFilterLinkedModule("all"); setFilterDateFrom(""); setFilterDateTo(""); setPage(1);
  };

  const hasFilters = search || filterDocType !== "all" || filterFileType !== "all" ||
    filterLinkedModule !== "all" || filterDateFrom || filterDateTo;

  return (
    <>
      <SectionCard title={showArchived ? "Archived Files" : "Uploaded Files"}>
        {/* Toolbar */}
        <div className="mb-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by name or filename…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>

            {/* Archive toggle */}
            <button
              onClick={() => { setShowArchived(!showArchived); setPage(1); }}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                showArchived ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Archive className="h-3.5 w-3.5" />
              {showArchived ? "Viewing Archived" : "View Archived"}
            </button>

            {/* Upload */}
            <button
              onClick={() => setUploadOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[image:var(--gradient-brand)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90"
            >
              <Upload className="h-3.5 w-3.5" /> Upload Document
            </button>
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-2">
            <Select value={filterDocType} onValueChange={(v) => { setFilterDocType(v); setPage(1); }}>
              <SelectTrigger className="h-8 w-40 rounded-lg text-xs">
                <SelectValue placeholder="Document Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {DOCUMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterFileType} onValueChange={(v) => { setFilterFileType(v); setPage(1); }}>
              <SelectTrigger className="h-8 w-36 rounded-lg text-xs">
                <SelectValue placeholder="File Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Files</SelectItem>
                {["pdf","png","jpg","webp","docx","xlsx","csv","txt","zip"].map((ext) => (
                  <SelectItem key={ext} value={ext}>{ext.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterLinkedModule} onValueChange={(v) => { setFilterLinkedModule(v); setPage(1); }}>
              <SelectTrigger className="h-8 w-36 rounded-lg text-xs">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                {LINKED_MODULES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1">
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-blue-300"
              />
              <span className="text-xs text-muted-foreground">–</span>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-blue-300"
              />
            </div>

            {hasFilters && (
              <button onClick={clearFilters} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead>
              <tr className="bg-slate-50">
                {["Document Name","Type","Linked Module","Size","Uploaded By","Date","Actions"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-muted-foreground first:pl-4 last:pr-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-3 py-3 first:pl-4">
                        <div className="h-3 rounded bg-slate-100" style={{ width: j === 0 ? "70%" : j === 6 ? "60px" : "50%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileText className="h-10 w-10 text-slate-200" />
                      <p className="text-sm font-semibold">
                        {hasFilters || showArchived ? "No documents match your filters" : "No documents yet"}
                      </p>
                      {!hasFilters && !showArchived && (
                        <p className="text-xs">Upload your first document using the button above.</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                documents.map((doc) => {
                  const ext = extBadge(doc.mime_type);
                  return (
                    <motion.tr
                      key={doc.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      {/* Name */}
                      <td className="pl-4 pr-3 py-3 max-w-[200px]">
                        <div className="flex items-center gap-2">
                          <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${EXT_COLORS[ext] ?? "bg-slate-100 text-slate-600"}`}>
                            {ext}
                          </span>
                          <span className="truncate font-semibold text-foreground text-xs" title={doc.document_name}>
                            {doc.document_name}
                          </span>
                        </div>
                        <p className="mt-0.5 ml-8 truncate text-[11px] text-muted-foreground" title={doc.file_name}>
                          {doc.file_name}
                        </p>
                      </td>

                      {/* Doc type */}
                      <td className="px-3 py-3">
                        <span className="whitespace-nowrap text-xs text-foreground">{doc.document_type}</span>
                      </td>

                      {/* Linked module */}
                      <td className="px-3 py-3">
                        <div className="text-xs text-foreground">{linkedModuleLabel(doc.linked_module)}</div>
                        {doc.linked_record_id && (
                          <div className="text-[11px] font-mono text-muted-foreground">{doc.linked_record_id}</div>
                        )}
                      </td>

                      {/* Size */}
                      <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {fmtFileSize(doc.file_size)}
                      </td>

                      {/* Uploaded by */}
                      <td className="px-3 py-3 max-w-[140px]">
                        <span className="truncate text-xs text-muted-foreground block" title={doc.uploaded_by_email ?? "Unknown"}>
                          {doc.uploaded_by_email ?? "Unknown"}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {fmtDate(doc.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="pr-4 pl-3 py-3">
                        <div className="flex items-center gap-1">
                          <button title="Download" onClick={() => handleDownload(doc)} className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button title="Preview" onClick={() => setPreviewDoc(doc)} className="rounded-lg p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button title="Rename" onClick={() => setRenameDoc(doc)} className="rounded-lg p-1.5 text-slate-500 hover:bg-violet-50 hover:text-violet-600 transition-colors">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button title="Move" onClick={() => setMoveDoc(doc)} className="rounded-lg p-1.5 text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition-colors">
                            <FolderInput className="h-3.5 w-3.5" />
                          </button>
                          <button title="Replace File" onClick={() => setReplaceDoc(doc)} className="rounded-lg p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                            <FileUp className="h-3.5 w-3.5" />
                          </button>
                          {doc.is_archived ? (
                            <button
                              title="Restore"
                              onClick={() => restoreMutation.mutate(doc.id)}
                              disabled={restoreMutation.isPending}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors disabled:opacity-50"
                            >
                              <ArchiveRestore className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              title="Archive"
                              onClick={() => archiveMutation.mutate(doc.id)}
                              disabled={archiveMutation.isPending}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition-colors disabled:opacity-50"
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button title="Delete" onClick={() => setDeleteDoc(doc)} className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} documents
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="px-2 font-semibold text-foreground">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Dialogs */}
      <UploadDialog open={uploadOpen} businessId={businessId} onClose={() => setUploadOpen(false)} />
      <PreviewDialog doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      <RenameDialog doc={renameDoc} businessId={businessId} onClose={() => setRenameDoc(null)} />
      <MoveDialog doc={moveDoc} businessId={businessId} onClose={() => setMoveDoc(null)} />
      <DeleteDialog doc={deleteDoc} businessId={businessId} onClose={() => setDeleteDoc(null)} />
      <ReplaceDialog doc={replaceDoc} businessId={businessId} onClose={() => setReplaceDoc(null)} />
    </>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export function DocumentsTab({ onNavigate }: { onNavigate?: (tabId: string) => void }) {
  const { business } = useBusiness();
  const businessId = business?.id ?? null;

  // Real counts from live Supabase hooks
  const { data: invoiceData } = useInvoices(businessId);
  const { data: quotationData } = useQuotations(businessId);
  const { data: creditNoteData } = useCreditNotes(businessId);
  const { data: recurringData } = useRecurringInvoices(businessId);

  const docTypes: DocTypeCard[] = [
    {
      id: "invoices",
      label: "Invoices",
      description: "GST-compliant tax invoices",
      icon: FileText,
      count: invoiceData?.length ?? 0,
      colorBg: "bg-blue-50",
      colorText: "text-blue-600",
      colorBorder: "border-blue-200",
      viewTab: "invoices",
    },
    {
      id: "quotations",
      label: "Quotations",
      description: "Price quotations for customers",
      icon: FileSpreadsheet,
      count: quotationData?.length ?? 0,
      colorBg: "bg-violet-50",
      colorText: "text-violet-600",
      colorBorder: "border-violet-200",
      viewTab: "quotations",
    },
    {
      id: "proforma",
      label: "Proforma Invoices",
      description: "Pre-invoice estimates",
      icon: FileClock,
      count: 0,
      colorBg: "bg-amber-50",
      colorText: "text-amber-600",
      colorBorder: "border-amber-200",
    },
    {
      id: "delivery-challans",
      label: "Delivery Challans",
      description: "Goods delivery documents",
      icon: Truck,
      count: 0,
      colorBg: "bg-emerald-50",
      colorText: "text-emerald-600",
      colorBorder: "border-emerald-200",
    },
    {
      id: "credit-notes",
      label: "Credit Notes",
      description: "Customer credit adjustments",
      icon: Undo2,
      count: creditNoteData?.length ?? 0,
      colorBg: "bg-rose-50",
      colorText: "text-rose-600",
      colorBorder: "border-rose-200",
      viewTab: "credit-notes",
    },
    {
      id: "debit-notes",
      label: "Debit Notes",
      description: "Supplier debit adjustments",
      icon: Redo2,
      count: 0,
      colorBg: "bg-orange-50",
      colorText: "text-orange-600",
      colorBorder: "border-orange-200",
    },
    {
      id: "recurring",
      label: "Recurring Invoices",
      description: "Scheduled recurring billing",
      icon: Repeat,
      count: recurringData?.length ?? 0,
      colorBg: "bg-indigo-50",
      colorText: "text-indigo-600",
      colorBorder: "border-indigo-200",
      viewTab: "recurring",
    },
    {
      id: "purchase",
      label: "Purchase Invoices",
      description: "Purchase invoices from suppliers",
      icon: ShoppingCart,
      count: 0,
      colorBg: "bg-slate-50",
      colorText: "text-slate-500",
      colorBorder: "border-slate-200",
      comingSoon: true,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="text-lg font-bold text-foreground">Document Management</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          All your billing documents in one place — invoices, challans, credit notes, and more.
        </p>
      </div>

      {/* Document type grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {docTypes.map((doc, i) => (
          <DocCard key={doc.id} doc={doc} index={i} onNavigate={onNavigate} />
        ))}
      </div>

      {/* File manager */}
      {businessId ? (
        <FileManager businessId={businessId} />
      ) : (
        <SectionCard title="Uploaded Files">
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            Loading business…
          </div>
        </SectionCard>
      )}
    </div>
  );
}
