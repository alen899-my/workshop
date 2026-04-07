export interface ReceiptData {
  // Shop
  shopName: string;
  shopLocation?: string;
  shopPhone?: string;
  shopCurrency: string;
  currencySymbol: string;

  // Repair Job
  repairId: string | number;
  repairDate?: string;
  serviceType?: string;
  status?: string;
  paymentStatus?: string;

  // Vehicle
  vehicleNumber: string;
  vehicleType?: string;
  modelName?: string;

  // Customer
  ownerName: string;
  phoneNumber?: string;

  // Technician
  workerName?: string;

  // Bill
  items: { name: string; cost: number; qty: number }[];
  serviceCharge: number;
  taxSnapshot?: { name: string; rate: number; amount: number; is_inclusive: boolean }[];
  taxTotal: number;
  totalAmount: number;
}

function fmt(symbol: string, amount: number): string {
  return `${symbol}${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function buildComplaintsText(complaints: string | any): string {
  if (!complaints) return "";
  try {
    const parsed = typeof complaints === "string" ? JSON.parse(complaints) : complaints;
    if (Array.isArray(parsed)) {
      return parsed
        .map((c: any) => {
          if (typeof c === "string") return `• ${c}`;
          if (c.text || c.complaint) {
            const label = c.fixed ? "[✓]" : "[—]";
            return `${label} ${c.text || c.complaint}`;
          }
          if (c.tasks && Array.isArray(c.tasks)) {
            const header = `[${c.type}]`;
            const tasks = c.tasks.map((t: any) => `  ${t.fixed ? "✓" : "○"} ${t.text}`).join("\n");
            return `${header}\n${tasks}`;
          }
          return "";
        })
        .filter(Boolean)
        .join("\n");
    }
  } catch {}
  return typeof complaints === "string" ? complaints : "";
}

export function generateReceipt(data: ReceiptData, complaints?: string | any): void {
  const {
    shopName,
    shopLocation,
    shopPhone,
    currencySymbol: sym,
    repairId,
    repairDate,
    serviceType,
    status,
    paymentStatus,
    vehicleNumber,
    vehicleType,
    modelName,
    ownerName,
    phoneNumber,
    workerName,
    items,
    serviceCharge,
    taxSnapshot,
    taxTotal,
    totalAmount,
  } = data;

  const partsSubtotal = items.reduce((acc, i) => acc + i.cost * i.qty, 0);
  const isPaid = paymentStatus?.toLowerCase() === "paid";
  const isCompleted = status?.toLowerCase() === "completed";
  const complaintsText = buildComplaintsText(complaints);
  const invoiceNo = `INV-${String(repairId).padStart(5, "0")}`;
  const printedAt = new Date().toLocaleString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const itemRows = items
    .map(
      (item) => `
    <tr>
      <td class="item-name">${item.name || "—"}</td>
      <td class="center">${item.qty}</td>
      <td class="right">${fmt(sym, item.cost)}</td>
      <td class="right amount">${fmt(sym, item.cost * item.qty)}</td>
    </tr>`
    )
    .join("");

  const taxRows =
    taxSnapshot && taxSnapshot.length > 0
      ? taxSnapshot
          .map(
            (t) => `
      <div class="summary-row tax-row">
        <span class="tax-label">
          <span class="tax-badge">TAX</span>
          ${t.name} (${t.rate}%)${t.is_inclusive ? " [Incl.]" : ""}
        </span>
        <span>${fmt(sym, t.amount)}</span>
      </div>`
          )
          .join("")
      : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Receipt — ${invoiceNo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --primary: #6366f1;
      --primary-light: #e0e7ff;
      --green: #10b981;
      --green-light: #d1fae5;
      --amber: #f59e0b;
      --amber-light: #fef3c7;
      --red: #ef4444;
      --red-light: #fee2e2;
      --text: #0f172a;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --bg: #f8fafc;
      --card: #ffffff;
      --radius: 12px;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg);
      color: var(--text);
      font-size: 13px;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      max-width: 800px;
      margin: 0 auto;
      background: var(--card);
      min-height: 100vh;
    }

    /* ── Header ── */
    .header {
      background: var(--primary);
      padding: 36px 40px 28px;
      color: white;
      position: relative;
      overflow: hidden;
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: -30px;
      right: -30px;
      width: 200px;
      height: 200px;
      border-radius: 50%;
      background: rgba(255,255,255,0.06);
    }
    .header::before {
      content: '';
      position: absolute;
      top: -40px;
      left: -20px;
      width: 140px;
      height: 140px;
      border-radius: 50%;
      background: rgba(255,255,255,0.04);
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      position: relative;
      z-index: 1;
    }
    .brand {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }
    .brand-sub {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      opacity: 0.7;
      margin-top: 2px;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-no {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: 0.05em;
    }
    .invoice-date {
      font-size: 11px;
      opacity: 0.75;
      margin-top: 4px;
    }
    .header-badges {
      display: flex;
      gap: 8px;
      margin-top: 20px;
      position: relative;
      z-index: 1;
    }
    .badge {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 100px;
      border: 1px solid rgba(255,255,255,0.25);
      background: rgba(255,255,255,0.12);
      color: white;
    }
    .badge.paid { background: rgba(16,185,129,0.25); border-color: rgba(16,185,129,0.5); }
    .badge.unpaid { background: rgba(245,158,11,0.25); border-color: rgba(245,158,11,0.5); }
    .badge.completed { background: rgba(16,185,129,0.25); border-color: rgba(16,185,129,0.5); }
    .badge.in-progress { background: rgba(245,158,11,0.25); border-color: rgba(245,158,11,0.5); }

    /* ── Shop Info Row ── */
    .shop-bar {
      background: #f1f5f9;
      padding: 12px 40px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 11px;
      color: var(--text-muted);
      font-weight: 500;
    }
    .shop-bar span { display: flex; align-items: center; gap: 5px; }
    .dot { width: 3px; height: 3px; border-radius: 50%; background: var(--border); flex-shrink: 0; }

    /* ── Body ── */
    .body { padding: 32px 40px; }

    /* ── Info Grid ── */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 1px;
      background: var(--border);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      margin-bottom: 28px;
    }
    .info-block {
      background: var(--card);
      padding: 16px 18px;
    }
    .info-label {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 5px;
    }
    .info-value {
      font-size: 13px;
      font-weight: 700;
      color: var(--text);
      line-height: 1.3;
    }
    .info-sub {
      font-size: 10px;
      color: var(--text-muted);
      margin-top: 2px;
    }

    /* ── Section Heading ── */
    .section-heading {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--primary);
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--primary-light);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-heading::before {
      content: '';
      display: block;
      width: 3px;
      height: 14px;
      background: var(--primary);
      border-radius: 2px;
      flex-shrink: 0;
    }
    .section { margin-bottom: 28px; }

    /* ── Items Table ── */
    table {
      width: 100%;
      border-collapse: collapse;
    }
    thead tr {
      background: #f8fafc;
      border-bottom: 1px solid var(--border);
    }
    thead th {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--text-muted);
      padding: 10px 12px;
      text-align: left;
    }
    th.right, td.right { text-align: right; }
    th.center, td.center { text-align: center; }
    tbody tr { border-bottom: 1px solid #f1f5f9; }
    tbody tr:last-child { border-bottom: none; }
    td {
      padding: 11px 12px;
      font-size: 12px;
      color: var(--text);
    }
    td.item-name { font-weight: 600; }
    td.amount { font-weight: 700; }
    .table-wrap {
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
    }
    .table-footer {
      background: #f8fafc;
      border-top: 1px solid var(--border);
      padding: 12px;
      font-size: 11px;
      color: var(--text-muted);
      font-style: italic;
    }

    /* ── Totals ── */
    .totals-wrap {
      margin-left: auto;
      max-width: 320px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      margin-bottom: 28px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      font-size: 12px;
      border-bottom: 1px solid #f1f5f9;
    }
    .summary-row:last-child { border-bottom: none; }
    .summary-row .label { color: var(--text-muted); font-weight: 500; }
    .summary-row .value { font-weight: 700; color: var(--text); }
    .tax-row { background: #f0fdf4; }
    .tax-label {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--green);
      font-weight: 600;
      font-size: 11px;
    }
    .tax-badge {
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.1em;
      background: var(--green-light);
      color: var(--green);
      padding: 1px 5px;
      border-radius: 4px;
      border: 1px solid #a7f3d0;
    }
    .grand-total-row {
      background: var(--primary);
      color: white;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .grand-total-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      opacity: 0.85;
    }
    .grand-total-amount {
      font-size: 22px;
      font-weight: 900;
      letter-spacing: -0.02em;
    }
    .tax-note {
      font-size: 10px;
      opacity: 0.7;
      display: block;
      margin-top: 2px;
    }

    /* ── Complaints Section ── */
    .complaints-box {
      background: #fafafa;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 16px;
      font-size: 12px;
      color: var(--text-muted);
      white-space: pre-wrap;
      line-height: 1.7;
    }

    /* ── Payment Status Banner ── */
    .payment-banner {
      border-radius: var(--radius);
      padding: 14px 20px;
      margin-bottom: 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .payment-banner.paid {
      background: var(--green-light);
      border: 1px solid #a7f3d0;
    }
    .payment-banner.unpaid {
      background: var(--amber-light);
      border: 1px solid #fde68a;
    }
    .payment-banner-label {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }
    .payment-banner.paid .payment-banner-label { color: var(--green); }
    .payment-banner.unpaid .payment-banner-label { color: var(--amber); }
    .payment-banner-amount {
      font-size: 18px;
      font-weight: 900;
    }
    .payment-banner.paid .payment-banner-amount { color: var(--green); }
    .payment-banner.unpaid .payment-banner-amount { color: var(--amber); }

    /* ── Footer ── */
    .footer {
      border-top: 1px solid var(--border);
      margin-top: 16px;
      padding: 20px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-brand {
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--primary);
    }
    .footer-note {
      font-size: 10px;
      color: var(--text-muted);
      text-align: right;
    }

    /* ── Print overrides ── */
    @media print {
      body { background: white; }
      .page { max-width: 100%; }
      .no-print { display: none !important; }
      @page {
        margin: 0;
        size: A4;
      }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="header-top">
      <div>
        <div class="brand">${shopName}</div>
        <div class="brand-sub">Automotive Service Receipt</div>
      </div>
      <div class="invoice-meta">
        <div class="invoice-no">${invoiceNo}</div>
        <div class="invoice-date">Issued: ${formatDate(repairDate)}</div>
        <div class="invoice-date">Printed: ${printedAt}</div>
      </div>
    </div>
    <div class="header-badges">
      <div class="badge ${isCompleted ? "completed" : "in-progress"}">${status || "In Progress"}</div>
      <div class="badge ${isPaid ? "paid" : "unpaid"}">${paymentStatus || "Unpaid"}</div>
      ${serviceType ? `<div class="badge">${serviceType}</div>` : ""}
    </div>
  </div>

  <!-- Shop details bar -->
  ${shopLocation || shopPhone ? `
  <div class="shop-bar">
    ${shopLocation ? `<span>📍 ${shopLocation}</span>` : ""}
    ${shopLocation && shopPhone ? '<div class="dot"></div>' : ""}
    ${shopPhone ? `<span>📞 ${shopPhone}</span>` : ""}
  </div>` : ""}

  <div class="body">

    <!-- Info Grid -->
    <div class="info-grid">
      <div class="info-block">
        <div class="info-label">Vehicle</div>
        <div class="info-value">${vehicleNumber}</div>
        <div class="info-sub">${[modelName, vehicleType].filter(Boolean).join(" · ") || "—"}</div>
      </div>
      <div class="info-block">
        <div class="info-label">Customer</div>
        <div class="info-value">${ownerName || "—"}</div>
        <div class="info-sub">${phoneNumber || "—"}</div>
      </div>
      <div class="info-block">
        <div class="info-label">Technician</div>
        <div class="info-value">${workerName || "Self Managed"}</div>
        <div class="info-sub">Job Date: ${formatDate(repairDate)}</div>
      </div>
    </div>

    <!-- Parts & Labour -->
    <div class="section">
      <div class="section-heading">Services, Parts &amp; Labour</div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:50%">Description</th>
              <th class="center" style="width:10%">Qty</th>
              <th class="right" style="width:20%">Unit Price</th>
              <th class="right" style="width:20%">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${items.length > 0 ? itemRows : `<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:20px;font-style:italic">No items recorded</td></tr>`}
            ${serviceCharge > 0 ? `
            <tr style="background:#f0f4ff">
              <td class="item-name" style="color:#6366f1">Technician Service Fee</td>
              <td class="center" style="color:#6366f1">1</td>
              <td class="right" style="color:#6366f1">${fmt(sym, serviceCharge)}</td>
              <td class="right amount" style="color:#6366f1">${fmt(sym, serviceCharge)}</td>
            </tr>` : ""}
          </tbody>
        </table>
        <div class="table-footer">All amounts in ${data.shopCurrency}. Prices are exclusive of taxes unless stated.</div>
      </div>
    </div>

    <!-- Totals -->
    <div class="totals-wrap">
      <div class="summary-row">
        <span class="label">Items Subtotal</span>
        <span class="value">${fmt(sym, partsSubtotal)}</span>
      </div>
      ${serviceCharge > 0 ? `
      <div class="summary-row">
        <span class="label">Service Fee</span>
        <span class="value">${fmt(sym, serviceCharge)}</span>
      </div>` : ""}
      ${taxRows}
      ${taxTotal > 0 ? `
      <div class="summary-row" style="font-size:11px;color:#10b981;font-weight:700;background:#f0fdf4">
        <span>Total Tax</span>
        <span>${fmt(sym, taxTotal)}</span>
      </div>` : ""}
      <div class="grand-total-row">
        <div>
          <div class="grand-total-label">Grand Total</div>
          ${taxTotal > 0 ? `<span class="tax-note">Includes ${fmt(sym, taxTotal)} in taxes</span>` : ""}
        </div>
        <div class="grand-total-amount">${fmt(sym, totalAmount)}</div>
      </div>
    </div>

    <!-- Payment Banner -->
    <div class="payment-banner ${isPaid ? "paid" : "unpaid"}">
      <div>
        <div class="payment-banner-label">${isPaid ? "✓ Payment Received" : "⚠ Payment Pending"}</div>
        <div style="font-size:10px;margin-top:2px;opacity:0.7">${isPaid ? "This invoice has been fully settled." : "Please present this receipt for payment."}</div>
      </div>
      <div class="payment-banner-amount">${fmt(sym, totalAmount)}</div>
    </div>

    ${complaintsText ? `
    <!-- Reported Complaints -->
    <div class="section">
      <div class="section-heading">Reported Complaints &amp; Service Notes</div>
      <div class="complaints-box">${complaintsText}</div>
    </div>` : ""}

  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-brand">${shopName}</div>
    <div class="footer-note">
      Thank you for choosing us!<br/>
      ${invoiceNo} · Job #${repairId}
    </div>
  </div>
</div>
<script>
  window.onload = function() { window.print(); };
</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) {
    alert("Please allow pop-ups to generate the receipt.");
    return;
  }
  win.document.write(html);
  win.document.close();
}
