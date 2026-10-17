export interface InvoiceMathItem {
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  gstPercent: number;
}

export interface InvoiceMathInput {
  items: InvoiceMathItem[];
  isInterState: boolean;
  amountPaid: number;
}

export function computeLineItem(item: InvoiceMathItem) {
  const gross = item.quantity * item.unitPrice;
  const discountAmount = gross * (item.discountPercent / 100);
  const taxable = gross - discountAmount;
  const gstAmount = taxable * (item.gstPercent / 100);
  const total = taxable + gstAmount;
  return { gross, discountAmount, taxable, gstAmount, total };
}

export function computeDocumentTotals(items: InvoiceMathItem[], isInterState: boolean) {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalGst = 0;
  for (const item of items) {
    const { gross, discountAmount, gstAmount } = computeLineItem(item);
    subtotal += gross;
    totalDiscount += discountAmount;
    totalGst += gstAmount;
  }
  const taxableValue = subtotal - totalDiscount;
  const cgst = isInterState ? 0 : totalGst / 2;
  const sgst = isInterState ? 0 : totalGst / 2;
  const igst = isInterState ? totalGst : 0;
  const cess = 0;
  const preRoundTotal = taxableValue + totalGst + cess;
  const grandTotal = Math.round(preRoundTotal);
  const roundOff = grandTotal - preRoundTotal;
  return { subtotal, totalDiscount, taxableValue, cgst, sgst, igst, cess, roundOff, grandTotal };
}

export function invoiceGrandTotal(
  invoice: Pick<InvoiceMathInput, "items" | "isInterState">,
): number {
  return computeDocumentTotals(invoice.items, invoice.isInterState).grandTotal;
}

export function invoiceBalance(invoice: InvoiceMathInput): number {
  return invoiceGrandTotal(invoice) - invoice.amountPaid;
}
