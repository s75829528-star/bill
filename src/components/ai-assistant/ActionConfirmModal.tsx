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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-[#292D3B] bg-[#10121B] p-6 shadow-2xl transition-all text-[#F5F5FA]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-[#A1A5B7] hover:bg-[#171A26] hover:text-[#F5F5FA] transition-colors"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/25">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#F5F5FA] tracking-tight">
              Confirm Action
            </h3>
            <p className="mt-0.5 text-xs text-[#A1A5B7] leading-relaxed">{action.label}</p>
          </div>
        </div>

        {/* Details card */}
        {action.payload && (
          <div className="mt-4 rounded-xl border border-[#292D3B] bg-[#171A26] p-3.5 text-xs text-[#A1A5B7] space-y-2">
            {Boolean(action.payload.customer) && (
              <div className="flex items-center justify-between">
                <span className="text-[#A1A5B7]">Customer:</span>
                <span className="font-semibold text-[#F5F5FA]">
                  {String(action.payload.customer)}
                </span>
              </div>
            )}
            {Boolean(action.payload.invoiceNumber) && (
              <div className="flex items-center justify-between">
                <span className="text-[#A1A5B7]">Invoice:</span>
                <span className="font-semibold text-[#F5F5FA] font-mono">
                  {String(action.payload.invoiceNumber)}
                </span>
              </div>
            )}
            {Boolean(action.payload.amount) && (
              <div className="flex items-center justify-between">
                <span className="text-[#A1A5B7]">Outstanding:</span>
                <span className="font-bold font-mono text-rose-400">
                  ₹{Number(action.payload.amount).toLocaleString("en-IN")}
                </span>
              </div>
            )}
          </div>
        )}

        <p className="mt-4 text-xs text-[#A1A5B7] leading-relaxed">
          This operation will prepare a formal communication record. Please review the details
          before proceeding.
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#292D3B] bg-[#171A26] px-4 py-2 text-xs font-medium text-[#A1A5B7] hover:bg-[#202534] hover:text-[#F5F5FA] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(action);
              onClose();
            }}
            className="flex items-center gap-1.5 rounded-xl bg-[#7667FF] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#897BFF] transition-all active:scale-[0.98]"
          >
            <CheckCircle2 className="h-4 w-4" />
            Proceed & Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
