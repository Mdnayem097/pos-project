/**
 * Professional Retail POS Receipt & Voucher Printing Utility
 * Generates self-contained, high-fidelity thermal receipt layouts (80mm)
 * compatible with standard POS printers, A4 paper, and PDF exports.
 */

export interface PosReceiptItem {
  id: string | number;
  name: string;
  sku: string;
  price: number;
  qty: number;
  total: number;
}

export interface PosReceiptData {
  id: string;
  date: string;
  time: string;
  counter?: string;
  outletName?: string;
  storeName?: string;
  customerName?: string;
  items: PosReceiptItem[];
  subtotal: number;
  discountValue?: number;
  vat: number;
  netTotal: number;
  paymentMethod: string;
  customerPaid: number;
  change: number;
  billBy?: string;
}

export interface PosReturnItem {
  id: string | number;
  product?: { name?: string | null } | null;
  qty: number;
  unitPrice: number;
  refundAmount: number;
  reason?: string | null;
}

export interface PosReturnData {
  returnNo: string;
  orderId?: number;
  order?: {
    invoiceNo?: string;
    customerName?: string | null;
    customer?: { name?: string | null } | null;
  } | null;
  createdAt: string;
  items?: PosReturnItem[];
  refundAmount: number;
  refundMethod: string;
}

function fmtMoney(amount: number): string {
  return `৳ ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtNum(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function executePrint(htmlContent: string) {
  if (typeof window === "undefined") return;

  const existingFrame = document.getElementById("pos-print-iframe");
  if (existingFrame) {
    existingFrame.remove();
  }

  const iframe = document.createElement("iframe");
  iframe.id = "pos-print-iframe";
  iframe.setAttribute(
    "style",
    "position: fixed; top: -9999px; left: -9999px; width: 80mm; height: 0; border: none; visibility: hidden;"
  );
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

  // Allow styles & SVGs to fully render before opening print dialog
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.print();
    }
  }, 250);
}

/**
 * Shared thermal receipt CSS (80mm width)
 */
const THERMAL_CSS = `
  @page {
    size: 80mm auto;
    margin: 3mm 2mm;
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  html, body {
    background: #ffffff !important;
    color: #111111 !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 11px;
    line-height: 1.35;
    margin: 0 !important;
    padding: 0 !important;
    width: 100%;
  }
  .receipt-box {
    width: 74mm;
    max-width: 100%;
    margin: 0 auto;
    padding: 2mm 0;
    color: #111;
  }
  .header {
    text-align: center;
    padding-bottom: 2px;
  }
  .brand-title {
    font-size: 17px;
    font-weight: 800;
    letter-spacing: 0.5px;
    color: #000;
    text-transform: uppercase;
  }
  .brand-sub {
    font-size: 10.5px;
    color: #444;
    margin-top: 1px;
    font-weight: 500;
  }
  .brand-contact {
    font-size: 9.5px;
    color: #666;
    margin-top: 1px;
  }
  .receipt-badge {
    display: inline-block;
    margin-top: 4px;
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 1px;
    padding: 1.5px 7px;
    border: 1px solid #222;
    border-radius: 3px;
    text-transform: uppercase;
  }
  .divider {
    border-top: 1px dashed #333;
    margin: 5px 0;
    width: 100%;
  }
  .solid-divider {
    border-top: 1px solid #111;
    margin: 5px 0;
    width: 100%;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  .meta-table {
    font-size: 10.5px;
  }
  .meta-table td {
    padding: 1.5px 0;
    vertical-align: top;
  }
  .meta-lbl {
    color: #555;
    white-space: nowrap;
    width: 1%;
    padding-right: 5px !important;
  }
  .meta-val {
    color: #111;
    font-weight: 600;
  }
  .items-table {
    font-size: 10.5px;
  }
  .items-table thead th {
    border-top: 1px dashed #333;
    border-bottom: 1px dashed #333;
    padding: 4px 0;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    color: #000;
  }
  .items-table tbody td {
    padding: 2.5px 0;
    vertical-align: top;
  }
  .item-title {
    font-weight: 700;
    font-size: 11px;
    color: #000;
    line-height: 1.25;
  }
  .item-sku {
    font-size: 9px;
    color: #666;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
  .calc-table {
    font-size: 10.5px;
  }
  .calc-table td {
    padding: 1.5px 0;
  }
  .net-total-card {
    margin: 6px 0;
    padding: 5px 7px;
    background: #111111;
    color: #ffffff !important;
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .net-lbl {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: #ffffff !important;
  }
  .net-val {
    font-size: 15px;
    font-weight: 800;
    color: #ffffff !important;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
  .payment-card {
    background: #f7f7f7;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 4px 6px;
    font-size: 10px;
    margin-top: 4px;
  }
  .payment-card td {
    padding: 1.5px 0;
  }
  .paid-badge {
    background: #d1fae5;
    color: #047857;
    font-weight: 700;
    font-size: 9.5px;
    padding: 1px 5px;
    border-radius: 2px;
    display: inline-block;
  }
  .barcode-area {
    text-align: center;
    padding: 6px 0 2px 0;
  }
  .barcode-svg {
    height: 34px;
    width: 190px;
    max-width: 100%;
    margin: 0 auto;
    display: block;
  }
  .barcode-code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 10px;
    letter-spacing: 2px;
    color: #555;
    margin-top: 2px;
  }
  .footer {
    text-align: center;
    margin-top: 6px;
    padding-top: 5px;
    border-top: 1px dashed #555;
    font-size: 10px;
    color: #333;
  }
  .footer-bold {
    font-weight: 700;
    font-size: 10.5px;
    color: #000;
    margin-bottom: 2px;
  }
  .footer-sub {
    font-size: 9px;
    color: #555;
    line-height: 1.3;
  }
  .footer-powered {
    font-size: 8px;
    color: #888;
    margin-top: 4px;
    letter-spacing: 0.5px;
  }
  .text-left { text-align: left; }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .font-bold { font-weight: 700; }
  .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
  .discount-text { color: #047857; font-weight: 600; }
`;

const VECTOR_BARCODE = `
<svg viewBox="0 0 260 40" class="barcode-svg" fill="#000" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="3" height="40" />
  <rect x="5" y="0" width="2" height="40" />
  <rect x="10" y="0" width="4" height="40" />
  <rect x="17" y="0" width="2" height="40" />
  <rect x="22" y="0" width="5" height="40" />
  <rect x="30" y="0" width="2" height="40" />
  <rect x="34" y="0" width="3" height="40" />
  <rect x="40" y="0" width="1" height="40" />
  <rect x="44" y="0" width="6" height="40" />
  <rect x="53" y="0" width="2" height="40" />
  <rect x="58" y="0" width="4" height="40" />
  <rect x="65" y="0" width="2" height="40" />
  <rect x="70" y="0" width="5" height="40" />
  <rect x="78" y="0" width="3" height="40" />
  <rect x="84" y="0" width="2" height="40" />
  <rect x="89" y="0" width="6" height="40" />
  <rect x="98" y="0" width="2" height="40" />
  <rect x="103" y="0" width="4" height="40" />
  <rect x="110" y="0" width="2" height="40" />
  <rect x="115" y="0" width="5" height="40" />
  <rect x="123" y="0" width="3" height="40" />
  <rect x="129" y="0" width="2" height="40" />
  <rect x="134" y="0" width="6" height="40" />
  <rect x="143" y="0" width="2" height="40" />
  <rect x="148" y="0" width="4" height="40" />
  <rect x="155" y="0" width="2" height="40" />
  <rect x="160" y="0" width="5" height="40" />
  <rect x="168" y="0" width="3" height="40" />
  <rect x="174" y="0" width="2" height="40" />
  <rect x="179" y="0" width="6" height="40" />
  <rect x="188" y="0" width="3" height="40" />
  <rect x="194" y="0" width="2" height="40" />
  <rect x="199" y="0" width="5" height="40" />
  <rect x="207" y="0" width="2" height="40" />
  <rect x="212" y="0" width="4" height="40" />
  <rect x="219" y="0" width="2" height="40" />
  <rect x="224" y="0" width="5" height="40" />
  <rect x="232" y="0" width="3" height="40" />
  <rect x="238" y="0" width="2" height="40" />
  <rect x="243" y="0" width="5" height="40" />
  <rect x="251" y="0" width="3" height="40" />
  <rect x="257" y="0" width="3" height="40" />
</svg>
`;

/**
 * Print a completed POS sale receipt with professional supermarket typography.
 */
export function printPosReceipt(data: PosReceiptData) {
  const storeName = data.storeName || "Retail POS";
  const outlet = data.outletName || "Main Branch";
  const counter = data.counter || "Counter 1";
  const customerName = data.customerName || "Walk in customer";
  const billBy = data.billBy || "Admin";

  const totalQty = data.items.reduce((s, i) => s + (i.qty || 0), 0);

  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td colspan="4" style="padding-top: 3px;">
        <div class="item-title">${item.name}</div>
      </td>
    </tr>
    <tr>
      <td class="text-left item-sku">[${item.sku || "N/A"}]</td>
      <td class="text-center font-mono">${item.qty}</td>
      <td class="text-right font-mono">${fmtNum(item.price)}</td>
      <td class="text-right font-bold font-mono">${fmtMoney(item.total)}</td>
    </tr>
  `
    )
    .join("");

  const discountHtml =
    data.discountValue && data.discountValue > 0
      ? `
    <tr>
      <td class="text-left discount-text">Discount:</td>
      <td class="text-right font-mono discount-text">-${fmtMoney(data.discountValue)}</td>
    </tr>
  `
      : "";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Receipt - ${data.id}</title>
  <style>${THERMAL_CSS}</style>
</head>
<body>
  <div class="receipt-box">
    <!-- Header -->
    <div class="header">
      <div class="brand-title">${storeName}</div>
      <div class="brand-sub">${outlet} • ${counter}</div>
      <div class="brand-contact">Customer Support Hotline: +880 1700-000000</div>
      <div class="receipt-badge">*** SALES RECEIPT ***</div>
    </div>

    <div class="divider"></div>

    <!-- Meta Table -->
    <table class="meta-table">
      <tr>
        <td class="meta-lbl">Invoice:</td>
        <td class="meta-val font-mono">${data.id}</td>
        <td class="meta-lbl text-right">Date:</td>
        <td class="meta-val text-right font-mono">${data.date}</td>
      </tr>
      <tr>
        <td class="meta-lbl">Counter:</td>
        <td class="meta-val">${counter}</td>
        <td class="meta-lbl text-right">Time:</td>
        <td class="meta-val text-right font-mono">${data.time}</td>
      </tr>
      <tr>
        <td class="meta-lbl">Customer:</td>
        <td class="meta-val" colspan="3">${customerName}</td>
      </tr>
      <tr>
        <td class="meta-lbl">Billed By:</td>
        <td class="meta-val" colspan="3">${billBy}</td>
      </tr>
    </table>

    <div class="divider"></div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th class="text-left" style="width: 44%;">ITEM / SKU</th>
          <th class="text-center" style="width: 14%;">QTY</th>
          <th class="text-right" style="width: 20%;">PRICE</th>
          <th class="text-right" style="width: 22%;">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="divider"></div>

    <!-- Calculation Summary -->
    <table class="calc-table">
      <tr>
        <td class="text-left">Subtotal (${totalQty} items):</td>
        <td class="text-right font-mono font-bold">${fmtMoney(data.subtotal)}</td>
      </tr>
      ${discountHtml}
      <tr>
        <td class="text-left">VAT (5%):</td>
        <td class="text-right font-mono">${fmtMoney(data.vat)}</td>
      </tr>
    </table>

    <!-- Net Total Bar -->
    <div class="net-total-card">
      <span class="net-lbl">NET TOTAL</span>
      <span class="net-val">${fmtMoney(data.netTotal)}</span>
    </div>

    <!-- Payment Breakdown Box -->
    <div class="payment-card">
      <table>
        <tr>
          <td class="text-left">Payment Method:</td>
          <td class="text-right font-bold">${data.paymentMethod}</td>
        </tr>
        <tr>
          <td class="text-left">Customer Paid:</td>
          <td class="text-right font-mono">${fmtMoney(data.customerPaid)}</td>
        </tr>
        <tr>
          <td class="text-left">Change Return:</td>
          <td class="text-right font-mono">${fmtMoney(data.change)}</td>
        </tr>
        <tr>
          <td class="text-left">Payment Status:</td>
          <td class="text-right"><span class="paid-badge">PAID</span></td>
        </tr>
      </table>
    </div>

    <!-- Barcode Section -->
    <div class="barcode-area">
      ${VECTOR_BARCODE}
      <div class="barcode-code">*${data.id}*</div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-bold">Thank You For Shopping with Us!</div>
      <div class="footer-sub">Exchange or refund within 14 days with original receipt.</div>
      <div class="footer-powered">--- Retail Point of Sale System ---</div>
    </div>
  </div>
</body>
</html>
`;

  executePrint(html);
}

/**
 * Print Return Voucher / Credit Note
 */
export function printReturnVoucher(data: PosReturnData) {
  const returnNo = data.returnNo;
  const originalInvoice = data.order?.invoiceNo || (data.orderId ? `#${data.orderId}` : "N/A");
  const customer =
    data.order?.customerName || data.order?.customer?.name || "Walk in customer";
  const dateFormatted = new Date(data.createdAt).toLocaleString();

  const itemsHtml = (data.items || [])
    .map(
      (item) => `
    <tr>
      <td colspan="3" style="padding-top: 3px;">
        <div class="item-title">${item.product?.name || "Product"}</div>
        ${item.reason ? `<div style="font-size: 9px; color: #666;">Reason: ${item.reason}</div>` : ""}
      </td>
    </tr>
    <tr>
      <td class="text-left font-mono" style="font-size: 9.5px;">${item.qty} × ${fmtMoney(item.unitPrice)}</td>
      <td class="text-center"></td>
      <td class="text-right font-bold font-mono">${fmtMoney(item.refundAmount)}</td>
    </tr>
  `
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Return Voucher - ${returnNo}</title>
  <style>${THERMAL_CSS}</style>
</head>
<body>
  <div class="receipt-box">
    <div class="header">
      <div class="brand-title">Retail POS</div>
      <div class="brand-sub">Main Branch • Counter 1</div>
      <div class="receipt-badge" style="border-color: #047857; color: #047857;">*** CREDIT NOTE / RETURN VOUCHER ***</div>
    </div>

    <div class="divider"></div>

    <table class="meta-table">
      <tr>
        <td class="meta-lbl">Voucher No:</td>
        <td class="meta-val font-mono">${returnNo}</td>
      </tr>
      <tr>
        <td class="meta-lbl">Original Invoice:</td>
        <td class="meta-val font-mono">${originalInvoice}</td>
      </tr>
      <tr>
        <td class="meta-lbl">Date & Time:</td>
        <td class="meta-val font-mono">${dateFormatted}</td>
      </tr>
      <tr>
        <td class="meta-lbl">Customer:</td>
        <td class="meta-val">${customer}</td>
      </tr>
    </table>

    <div class="divider"></div>

    <table class="items-table">
      <thead>
        <tr>
          <th class="text-left" style="width: 60%;">RETURNED ITEM</th>
          <th class="text-center" style="width: 10%;"></th>
          <th class="text-right" style="width: 30%;">REFUND</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="divider"></div>

    <div class="net-total-card">
      <span class="net-lbl">TOTAL REFUNDED</span>
      <span class="net-val">${fmtMoney(data.refundAmount)}</span>
    </div>

    <div class="payment-card">
      <table>
        <tr>
          <td class="text-left">Refund Method:</td>
          <td class="text-right font-bold">${data.refundMethod}</td>
        </tr>
        <tr>
          <td class="text-left">Inventory Status:</td>
          <td class="text-right" style="color: #047857; font-weight: 700;">✓ Restocked</td>
        </tr>
      </table>
    </div>

    <div class="barcode-area">
      ${VECTOR_BARCODE}
      <div class="barcode-code">*${returnNo}*</div>
    </div>

    <div class="footer">
      <div class="footer-bold">Authorized Return Confirmation</div>
      <div class="footer-sub">Please retain this voucher for store credit records.</div>
    </div>
  </div>
</body>
</html>
`;

  executePrint(html);
}

/**
 * Fallback to print any generic element with embedded utility styling
 */
export function printReceiptElement(elementId: string, title: string = "Receipt") {
  if (typeof window === "undefined") return;

  const element = document.getElementById(elementId);
  if (!element) {
    window.print();
    return;
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    ${THERMAL_CSS}
    /* Utility classes matching POS card */
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .items-center { align-items: center; }
    .items-start { align-items: flex-start; }
    .justify-between { justify-content: space-between; }
    .justify-center { justify-content: center; }
    .flex-1 { flex: 1 1 0%; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .text-xs { font-size: 11px; }
    .text-sm { font-size: 12px; }
    .border-b { border-bottom: 1px dashed #333; }
    .border-t { border-top: 1px dashed #333; }
    .p-3 { padding: 4px; }
    .p-5 { padding: 4px; }
    .bg-stone-900 { background: #111 !important; color: #fff !important; }
    .bg-stone-900 * { color: #fff !important; }
    .tabular-nums { font-variant-numeric: tabular-nums; }
  </style>
</head>
<body>
  <div class="receipt-box">
    ${element.innerHTML}
  </div>
</body>
</html>
  `;

  executePrint(html);
}
