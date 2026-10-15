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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#19172A]/35 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-[#E7E2F3] bg-[#FFFFFF] p-6 shadow-2xl transition-all text-[#19172A]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-[#6B6880] hover:bg-[#FFFFFF] hover:text-[#19172A] transition-colors"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#19172A] tracking-tight">
              Confirm Action
            </h3>
            <p className="mt-0.5 text-xs text-[#6B6880] leading-relaxed">{action.label}</p>
          </div>
        </div>

        {/* Details card */}
        {action.payload && (
          <div className="mt-4 rounded-xl border border-[#E7E2F3] bg-[#FFFFFF] p-3.5 text-xs text-[#6B6880] space-y-2">
            {Boolean(action.payload.customer) && (
              <div className="flex items-center justify-between">
                <span className="text-[#6B6880]">Customer:</span>
                <span className="font-semibold text-[#19172A]">
                  {String(action.payload.customer)}
                </span>
              </div>
            )}
            {Boolean(action.payload.invoiceNumber) && (
              <div className="flex items-center justify-between">
                <span className="text-[#6B6880]">Invoice:</span>
                <span className="font-semibold text-[#19172A] font-mono">
                  {String(action.payload.invoiceNumber)}
                </span>
              </div>
            )}
            {Boolean(action.payload.amount) && (
              <div className="flex items-center justify-between">
                <span className="text-[#6B6880]">Outstanding:</span>
                <span className="font-bold font-mono text-rose-700">
                  ₹{Number(action.payload.amount).toLocaleString("en-IN")}
                </span>
              </div>
            )}
          </div>
        )}

        <p className="mt-4 text-xs text-[#6B6880] leading-relaxed">
          This operation will prepare a formal communication record. Please review the details
          before proceeding.
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#E7E2F3] bg-[#FFFFFF] px-4 py-2 text-xs font-medium text-[#6B6880] hover:bg-[#F0ECFF] hover:text-[#19172A] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(action);
              onClose();
            }}
            className="flex items-center gap-1.5 rounded-xl bg-[#6D5EF7] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#5B4BE8] transition-all active:scale-[0.98]"
          >
            <CheckCircle2 className="h-4 w-4" />
            Proceed & Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
