import type { BillItem, TaxSnapshotItem } from '@/features/repairs/services/bill.service';

function fmtDate(value: string | undefined | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}

function numberToWords(amount: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const toWords = (n: number): string => {
    if (!n) return '';
    if (n < 20) return `${ones[n]} `;
    if (n < 100) return `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ''} `;
    if (n < 1000) return `${ones[Math.floor(n / 100)]} Hundred ${toWords(n % 100)}`;
    if (n < 100000) return `${toWords(Math.floor(n / 1000))}Thousand ${toWords(n % 1000)}`;
    if (n < 10000000) return `${toWords(Math.floor(n / 100000))}Lakh ${toWords(n % 100000)}`;
    return `${toWords(Math.floor(n / 10000000))}Crore ${toWords(n % 10000000)}`;
  };
  const whole = Math.floor(amount);
  const fraction = Math.round((amount - whole) * 100);
  let words = `${toWords(whole).trim()} Rupees`;
  if (fraction > 0) words += ` and ${toWords(fraction).trim()} Paise`;
  return `${words} Only`;
}

interface Task {
  text: string;
  fixed?: boolean;
  failed?: boolean;
  reason?: string;
}

interface ServiceBlock {
  type: string;
  tasks: Task[];
}

export function buildInvoiceHtml(params: {
  shopName: string;
  shopPhone?: string;
  shopAddress?: string;
  invoiceNumber: string;
  date: string;
  ownerName: string;
  vehicleNumber: string;
  vehicleModel?: string;
  customerPhone?: string;
  technician?: string;
  kmReading?: string;
  vehicleImageSrc?: string;
  serviceBlocks?: ServiceBlock[];
  items: BillItem[];
  serviceCharge: number;
  taxSnapshot: TaxSnapshotItem[];
  paymentStatus: string;
  paymentMethod?: string | null;
  currency: string;
}): string {
  const {
    shopName, shopPhone, shopAddress, invoiceNumber, date,
    ownerName, vehicleNumber, vehicleModel, customerPhone, technician,
    kmReading, vehicleImageSrc, serviceBlocks,
    items, serviceCharge, taxSnapshot, paymentStatus, paymentMethod, currency,
  } = params;

  const subtotal = items.reduce((s, it) => s + (Number(it.cost) || 0) * (Number(it.qty) || 0), 0);
  const exclusiveTaxTotal = taxSnapshot
    .filter(t => !t.is_inclusive)
    .reduce((s, t) => s + Number(t.amount || 0), 0);
  const grandTotal = subtotal + Number(serviceCharge || 0) + exclusiveTaxTotal;

  const itemRows = items.length > 0
    ? items.map((item, i) => {
        const amt = (Number(item.cost) || 0) * (Number(item.qty) || 0);
        return `<tr>
          <td class="col-num">${i + 1}</td>
          <td>${item.name || `Item ${i + 1}`}</td>
          <td class="col-center">${item.qty}</td>
          <td class="col-center">${currency}${Number(item.cost).toFixed(2)}</td>
          <td class="col-right">${currency}${amt.toFixed(2)}</td>
        </tr>`;
      }).join('')
    : `<tr><td colspan="5" class="empty-row">No items listed</td></tr>`;

  const taxRows = taxSnapshot.map(t => `
    <div class="summary-row">
      <span>${t.name} (${t.rate}%)${t.is_inclusive ? ' <span class="incl-badge">incl.</span>' : ''}</span>
      <span>${t.is_inclusive ? '-' : '+'} ${currency}${Number(t.amount).toFixed(2)}</span>
    </div>`).join('');

  const vehicleImageHtml = vehicleImageSrc
    ? `<div class="vehicle-image-wrap"><img src="${vehicleImageSrc}" class="vehicle-image" /></div>`
    : '';

  const serviceHtml = serviceBlocks && serviceBlocks.length > 0
    ? `<div class="section-card">
      <div class="section-title">Services Performed</div>
      ${serviceBlocks.map(block => {
        const completedTasks = (block.tasks || []).filter(t => t.text?.trim() && t.fixed && !t.failed);
        const failedTasks = (block.tasks || []).filter(t => t.text?.trim() && t.failed);
        const otherTasks = (block.tasks || []).filter(t => t.text?.trim() && !t.fixed && !t.failed);
        if (completedTasks.length === 0 && failedTasks.length === 0 && otherTasks.length === 0) return '';
        return `<div class="service-block">
          <div class="service-block-type">${block.type}</div>
          ${completedTasks.map(t => `
            <div class="task-row">
              <span class="task-icon task-icon-done">&#10003;</span>
              <span class="task-text">${t.text}</span>
              <span class="task-badge task-badge-done">Done</span>
            </div>`).join('')}
          ${failedTasks.map(t => `
            <div class="task-row">
              <span class="task-icon task-icon-failed">&#10007;</span>
              <span class="task-text task-text-failed">${t.text}</span>
              <span class="task-badge task-badge-failed">Failed</span>
            </div>
            ${t.reason ? `<div class="task-reason">&#8627; ${t.reason}</div>` : ''}`).join('')}
          ${otherTasks.map(t => `
            <div class="task-row">
              <span class="task-icon task-icon-pending">&#9679;</span>
              <span class="task-text">${t.text}</span>
              <span class="task-badge task-badge-pending">Pending</span>
            </div>`).join('')}
        </div>`;
      }).filter(Boolean).join('')}
    </div>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Invoice ${invoiceNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, 'Helvetica Neue', 'Segoe UI', Arial, sans-serif;
    color: #1a1a1a;
    font-size: 12px;
    line-height: 1.6;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .header {
    padding: 24px 30px 16px;
    border-bottom: 1px solid #e5e5e5;
  }
  .header h1 { font-size: 20px; font-weight: 800; color: #1a1a1a; letter-spacing: -0.3px; }
  .header .shop-detail { font-size: 11px; color: #888; margin-top: 2px; }

  .title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 30px;
    border-bottom: 1px solid #e5e5e5;
  }
  .title-row .inv-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
  .title-row .inv-no { font-size: 13px; font-weight: 700; color: #1a1a1a; }

  .info-grid {
    display: flex;
    gap: 40px;
    padding: 20px 30px;
    border-bottom: 1px solid #e5e5e5;
  }
  .info-col { flex: 1; }
  .info-col .info-label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #888;
    margin-bottom: 6px;
  }
  .info-col .info-value { font-size: 12px; color: #1a1a1a; margin: 3px 0; font-weight: 600; }
  .info-col .info-sub { font-size: 11px; color: #555; margin: 2px 0; }
  .vehicle-image-wrap { margin-top: 8px; }
  .vehicle-image {
    width: 100px;
    height: 68px;
    object-fit: cover;
    border-radius: 6px;
    border: 1px solid #e5e5e5;
  }

  .section-card {
    margin: 16px 30px;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    overflow: hidden;
  }
  .section-title {
    padding: 10px 14px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #888;
    border-bottom: 1px solid #e5e5e5;
  }
  .service-block {
    padding: 8px 14px;
    border-bottom: 1px solid #f0f0f0;
  }
  .service-block:last-child { border-bottom: none; }
  .service-block-type {
    font-size: 11px;
    font-weight: 700;
    color: #0d9488;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  .task-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 2px 0;
  }
  .task-text { flex: 1; font-size: 11px; color: #444; }
  .task-text-failed { text-decoration: line-through; color: #999; font-style: italic; }
  .task-icon { font-size: 12px; width: 16px; text-align: center; }
  .task-icon-done { color: #0d9488; }
  .task-icon-failed { color: #dc2626; }
  .task-icon-pending { color: #d97706; font-size: 8px; }
  .task-badge {
    font-size: 8px;
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  .task-badge-done { background: #e6f7f2; color: #0d9488; }
  .task-badge-failed { background: #fee2e2; color: #dc2626; }
  .task-badge-pending { background: #fef3c7; color: #d97706; }
  .task-reason {
    font-size: 10px;
    color: #dc2626;
    font-style: italic;
    margin-left: 24px;
    margin-bottom: 2px;
  }

  table.items {
    width: calc(100% - 60px);
    margin: 4px 30px;
    border-collapse: collapse;
  }
  table.items thead th {
    padding: 10px 12px;
    text-align: left;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #888;
    border-bottom: 1px solid #e5e5e5;
    font-weight: 700;
  }
  table.items tbody td {
    padding: 10px 12px;
    border-bottom: 1px solid #f0f0f0;
    font-size: 11px;
    color: #444;
  }
  .col-num { width: 36px; color: #999; }
  .col-center { text-align: center; }
  .col-right { text-align: right; font-weight: 700; color: #1a1a1a; }
  .empty-row { text-align: center; color: #bbb; padding: 24px; font-style: italic; }

  .amt-words {
    margin: 4px 30px;
    padding: 8px 14px;
    font-size: 10px;
    color: #888;
    font-style: italic;
  }

  .summary-wrap {
    margin: 8px 30px 0 auto;
    width: 280px;
    padding: 4px 0;
  }
  .summary-row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    font-size: 11px;
    color: #555;
  }
  .summary-row.total {
    border-top: 1.5px solid #1a1a1a;
    margin-top: 6px;
    padding-top: 8px;
    font-size: 15px;
    font-weight: 800;
    color: #1a1a1a;
  }
  .incl-badge {
    font-size: 8px;
    color: #999;
    font-weight: 400;
    font-style: italic;
  }

  .payment-section {
    margin: 16px 30px;
    padding: 10px 16px;
    border-radius: 6px;
    text-align: center;
    border: 1px solid #e5e5e5;
  }
  .payment-section.paid { border-color: #0d9488; }
  .payment-section .status { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .payment-section.paid .status { color: #0d9488; }
  .payment-section.unpaid .status { color: #d97706; }
  .payment-section .detail { font-size: 10px; color: #888; margin-top: 2px; }

  .footer {
    margin-top: 24px;
    padding: 14px 30px;
    border-top: 1px solid #e5e5e5;
    font-size: 9px;
    color: #bbb;
    text-align: center;
  }
</style>
</head>
<body>

<div class="header">
  <h1>${shopName}</h1>
  <div class="shop-detail">${shopPhone ? `Phone: ${shopPhone}` : ''}${shopPhone && shopAddress ? ' &middot; ' : ''}${shopAddress || ''}</div>
</div>

<div class="title-row">
  <span class="inv-label">Invoice</span>
  <span class="inv-no">#${invoiceNumber}</span>
</div>

<div class="info-grid">
  <div class="info-col">
    <div class="info-label">Bill To</div>
    <div class="info-value">${ownerName || '-'}</div>
    <div class="info-sub">${vehicleNumber}${vehicleModel ? ` &middot; ${vehicleModel}` : ''}</div>
    ${customerPhone ? `<div class="info-sub">${customerPhone}</div>` : ''}
  </div>
  <div class="info-col">
    <div class="info-label">Details</div>
    <div class="info-sub">Date: ${fmtDate(date)}</div>
    ${kmReading ? `<div class="info-sub">KM: ${kmReading}</div>` : ''}
    ${technician ? `<div class="info-sub">Tech: ${technician}</div>` : ''}
    ${vehicleImageHtml}
  </div>
</div>

${serviceHtml}

<table class="items">
  <thead>
    <tr>
      <th class="col-num">#</th>
      <th>Description</th>
      <th class="col-center">Qty</th>
      <th class="col-center">Rate</th>
      <th class="col-right">Amount</th>
    </tr>
  </thead>
  <tbody>
    ${itemRows}
  </tbody>
</table>

<div class="amt-words">${numberToWords(grandTotal)}</div>

<div class="summary-wrap">
  <div class="summary-row">
    <span>Subtotal</span>
    <span>${currency}${subtotal.toFixed(2)}</span>
  </div>
  ${Number(serviceCharge) > 0 ? `
  <div class="summary-row">
    <span>Service Charge</span>
    <span>${currency}${Number(serviceCharge).toFixed(2)}</span>
  </div>` : ''}
  ${taxRows}
  <div class="summary-row total">
    <span>Grand Total</span>
    <span>${currency}${grandTotal.toFixed(2)}</span>
  </div>
</div>

<div class="payment-section ${paymentStatus === 'Paid' ? 'paid' : 'unpaid'}">
  <div class="status">${paymentStatus === 'Paid' ? 'Payment Received' : 'Payment Pending'}</div>
  ${paymentMethod ? `<div class="detail">via ${paymentMethod}</div>` : ''}
</div>

<div class="footer">
  ${shopName} &middot; Invoice #${invoiceNumber}
</div>

</body>
</html>`;
}
