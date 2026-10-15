import { AlertCircle, CheckCircle2, X } from "lucide-react";
import type { CopilotAction } from "../../services/ai-assistant";

interface ActionConfirmModalProps {
  action: CopilotAction | null;
  onClose: () => void;
  onConfirm: (action: CopilotAction) => void;
}

export function ActionConfirmModal({ action, onClose, onConfirm }: ActionConfirmModalProps) {
  if (!action) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl transition-all">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-900">Confirm Action</h3>
            <p className="mt-1 text-sm text-zinc-500">{action.label}</p>
          </div>
        </div>

        {/* Details card */}
        {action.payload && (
          <div className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50/80 p-3.5 text-xs text-zinc-600 space-y-1.5">
            {Boolean(action.payload.customer) && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Customer:</span>
                <span className="font-semibold text-zinc-900">{String(action.payload.customer)}</span>
              </div>
            )}
            {Boolean(action.payload.invoiceNumber) && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Invoice:</span>
                <span className="font-semibold text-zinc-900">{String(action.payload.invoiceNumber)}</span>
              </div>
            )}
            {Boolean(action.payload.amount) && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Outstanding:</span>
                <span className="font-bold font-mono text-rose-600">
                  ₹{Number(action.payload.amount).toLocaleString("en-IN")}
                </span>
              </div>
            )}
          </div>
        )}

        <p className="mt-4 text-xs text-zinc-500 leading-relaxed">
          This operation will prepare a formal communication record. Review details before
          proceeding.
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(action);
              onClose();
            }}
            className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-zinc-800 transition-all active:scale-95"
          >
            <CheckCircle2 className="h-4 w-4" />
            Proceed & Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
