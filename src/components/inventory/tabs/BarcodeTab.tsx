// ── BarcodeTab ────────────────────────────────────────────────────
import { useState, useCallback } from "react";
import { Camera, ScanLine, RefreshCw, Printer, QrCode, Barcode } from "lucide-react";
import { motion } from "framer-motion";
import { useBusiness } from "@/contexts/BusinessContext";
import { useProducts } from "@/hooks/useProductsQuery";
import { SectionCard, Select, PrimaryButton, SecondaryButton } from "@/components/inventory/shared";

// ── Helpers ───────────────────────────────────────────────────────

function generateBarcode(): string {
  // Pseudo-random 13-digit numeric string (EAN-13 style)
  let n = "";
  for (let i = 0; i < 12; i++) n += Math.floor(Math.random() * 10).toString();
  // Simple check digit: sum of alternating *1 and *3
  const sum = n.split("").reduce((acc, d, i) => acc + parseInt(d) * (i % 2 === 0 ? 1 : 3), 0);
  const check = (10 - (sum % 10)) % 10;
  return n + check.toString();
}

// Seeded bar-width pattern from a string (deterministic per barcode value)
function barcodePattern(value: string): number[] {
  const bars: number[] = [];
  for (let i = 0; i < 60; i++) {
    const charCode = value.charCodeAt(i % value.length);
    bars.push(((charCode * (i + 1) * 7) % 3) + 1); // width 1–3
  }
  return bars;
}

// Seeded QR grid from a string
function qrGrid(value: string, size = 15): boolean[][] {
  const grid: boolean[][] = [];
  for (let r = 0; r < size; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < size; c++) {
      const idx = r * size + c;
      const charCode = value.charCodeAt(idx % value.length);
      row.push((charCode + r * 3 + c * 7) % 2 === 0);
    }
    grid.push(row);
  }
  return grid;
}

// ── CSS Barcode visual ────────────────────────────────────────────

function CSSBarcode({ value }: { value: string }) {
  const pattern = barcodePattern(value);
  return (
    <div className="flex items-end justify-center gap-[1px]" style={{ height: 56 }}>
      {pattern.map((w, i) => (
        <div
          key={i}
          style={{ width: w * 2, height: i % 5 === 0 ? 56 : 48 }}
          className={i % 2 === 0 ? "bg-slate-900" : "bg-transparent"}
        />
      ))}
    </div>
  );
}

// ── CSS QR visual ─────────────────────────────────────────────────

function CSSQRCode({ value }: { value: string }) {
  const grid = qrGrid(value);
  return (
    <div className="inline-grid border-4 border-white" style={{ gridTemplateColumns: `repeat(${grid[0].length}, 1fr)` }}>
      {grid.map((row, r) =>
        row.map((filled, c) => (
          <div
            key={`${r}-${c}`}
            style={{ width: 12, height: 12 }}
            className={filled ? "bg-slate-900" : "bg-white"}
          />
        ))
      )}
    </div>
  );
}

// ── Label Card ────────────────────────────────────────────────────

function LabelCard({
  productName,
  sku,
  barcodeValue,
  mode,
}: {
  productName: string;
  sku: string;
  barcodeValue: string;
  mode: "barcode" | "qr";
}) {
  return (
    <div className="flex w-56 flex-col items-center rounded-xl border-2 border-dashed border-slate-300 bg-white p-3 shadow-sm">
      <p className="mb-1.5 max-w-full truncate text-center text-[11px] font-semibold text-foreground">
        {productName}
      </p>
      {mode === "barcode" ? (
        <CSSBarcode value={barcodeValue} />
      ) : (
        <div className="my-1">
          <CSSQRCode value={barcodeValue} />
        </div>
      )}
      <p className="mt-1.5 font-mono text-[10px] tracking-widest text-slate-600">{barcodeValue}</p>
      <p className="text-[9px] text-muted-foreground">{sku}</p>
    </div>
  );
}

// ── Main Tab ──────────────────────────────────────────────────────

export function BarcodeTab() {
  const { business } = useBusiness();
  const { data: dbProducts = [] } = useProducts(business?.id ?? null);

  const [selectedProductId, setSelectedProductId] = useState("");
  const [barcodeValue, setBarcodeValue] = useState("");
  const [mode, setMode] = useState<"barcode" | "qr">("barcode");
  const [labelCount, setLabelCount] = useState(6);

  // Initialise selection once products load
  const firstProduct = dbProducts[0];
  const effectiveProductId = selectedProductId || firstProduct?.id || "";
  const selectedProduct = dbProducts.find((p) => p.id === effectiveProductId) ?? firstProduct;
  const effectiveBarcodeValue = barcodeValue || selectedProduct?.barcode || selectedProduct?.sku || "";

  const handleProductChange = useCallback(
    (id: string) => {
      setSelectedProductId(id);
      const p = dbProducts.find((x) => x.id === id);
      if (p) setBarcodeValue(p.barcode ?? p.sku ?? "");
    },
    [dbProducts]
  );

  const handleGenerateNew = useCallback(() => {
    setBarcodeValue(generateBarcode());
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const clampedCount = Math.min(Math.max(1, labelCount), 24);
  const labels = Array.from({ length: clampedCount });

  return (
    <SectionCard
      title="Barcode Management"
      subtitle="Generate, preview, and print product barcodes"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT: Generator form + scanner placeholder */}
        <div className="space-y-5">
          {/* Generator form */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Barcode Generator</h4>

            {/* Product select */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Select Product</label>
              <Select
                value={selectedProductId}
                onChange={handleProductChange}
                options={dbProducts.map((p) => ({ value: p.id, label: p.name }))}
                className="w-full"
              />
            </div>

            {/* Current barcode display */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Barcode Value</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-foreground">
                  {barcodeValue}
                </div>
                <button
                  onClick={handleGenerateNew}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-slate-50"
                  title="Generate new barcode"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  New
                </button>
              </div>
            </div>

            {/* Mode toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Label Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode("barcode")}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                    mode === "barcode"
                      ? "border-blue-300 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-foreground hover:bg-slate-50"
                  }`}
                >
                  <Barcode className="h-3.5 w-3.5" />
                  Barcode
                </button>
                <button
                  onClick={() => setMode("qr")}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                    mode === "qr"
                      ? "border-blue-300 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-foreground hover:bg-slate-50"
                  }`}
                >
                  <QrCode className="h-3.5 w-3.5" />
                  QR Code
                </button>
              </div>
            </div>

            {/* Label count */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Number of Labels <span className="text-slate-400">(max 24)</span>
              </label>
              <input
                type="number"
                min={1}
                max={24}
                value={labelCount}
                onChange={(e) => setLabelCount(parseInt(e.target.value) || 1)}
                className="h-9 w-28 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <PrimaryButton onClick={handlePrint} icon={Printer}>
                Print Labels
              </PrimaryButton>
            </div>
          </div>

          {/* Scanner placeholder */}
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
            <div className="flex items-center gap-2 mb-4">
              <ScanLine className="h-4 w-4 text-slate-500" />
              <h4 className="text-sm font-semibold text-foreground">Barcode Scanner</h4>
            </div>
            {/* Viewfinder box */}
            <div className="mx-auto mb-4 flex h-32 w-48 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white">
              <Camera className="h-10 w-10 text-slate-300" />
            </div>
            <p className="text-center text-xs text-muted-foreground leading-relaxed mb-4">
              Scanner integration coming soon — connect a barcode scanner device to auto-fill product lookup.
            </p>
            <div className="flex justify-center">
              <button
                disabled
                title="Coming soon"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-400 cursor-not-allowed"
              >
                <Camera className="h-4 w-4" />
                Start Scanning
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Preview + label sheet */}
        <div className="space-y-5">
          {/* Single preview */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h4 className="mb-4 text-sm font-semibold text-foreground">Label Preview</h4>
            <div className="flex justify-center">
              <motion.div
                key={`${selectedProductId}-${barcodeValue}-${mode}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
              >
                <LabelCard
                  productName={selectedProduct?.name ?? ""}
                  sku={selectedProduct?.sku ?? ""}
                  barcodeValue={barcodeValue}
                  mode={mode}
                />
              </motion.div>
            </div>
          </div>

          {/* Label sheet grid */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">
                Label Sheet ({clampedCount} label{clampedCount !== 1 ? "s" : ""})
              </h4>
              <SecondaryButton onClick={handlePrint} icon={Printer}>
                Print
              </SecondaryButton>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 overflow-y-auto max-h-[480px] pr-1">
              {labels.map((_, i) => (
                <LabelCard
                  key={i}
                  productName={selectedProduct?.name ?? ""}
                  sku={selectedProduct?.sku ?? ""}
                  barcodeValue={barcodeValue}
                  mode={mode}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
