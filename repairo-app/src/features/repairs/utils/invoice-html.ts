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
          <td>${i + 1}</td>
          <td>${item.name || `Item ${i + 1}`}</td>
          <td>${item.qty}</td>
          <td>${currency}${Number(item.cost).toFixed(2)}</td>
          <td>${currency}${amt.toFixed(2)}</td>
        </tr>`;
      }).join('')
    : `<tr><td colspan="5" style="text-align:center;color:#9ca3af;padding:20px;">No items listed</td></tr>`;

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
      <div class="section-title"><span class="section-icon">&#10003;</span> Services Performed</div>
      ${serviceBlocks.map(block => {
        const completedTasks = (block.tasks || []).filter(t => t.text?.trim() && t.fixed && !t.failed);
        const failedTasks = (block.tasks || []).filter(t => t.text?.trim() && t.failed);
        const otherTasks = (block.tasks || []).filter(t => t.text?.trim() && !t.fixed && !t.failed);
        if (completedTasks.length === 0 && failedTasks.length === 0 && otherTasks.length === 0) return '';
        return `<div class="service-block">
          <div class="service-block-type">${block.type}</div>
          ${completedTasks.map(t => `
            <div class="task-row">
              <span class="task-icon-completed">&#10003;</span>
              <span class="task-text">${t.text}</span>
              <span class="task-badge-completed">Done</span>
            </div>`).join('')}
          ${failedTasks.map(t => `
            <div class="task-row">
              <span class="task-icon-failed">&#10007;</span>
              <span class="task-text task-text-failed">${t.text}</span>
              <span class="task-badge-failed">Failed</span>
            </div>
            ${t.reason ? `<div class="task-reason">&#8627; Reason: ${t.reason}</div>` : ''}`).join('')}
          ${otherTasks.map(t => `
            <div class="task-row">
              <span class="task-icon-pending">&#9679;</span>
              <span class="task-text">${t.text}</span>
              <span class="task-badge-pending">Pending</span>
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
    color: #1f2937;
    font-size: 12px;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .header {
    background: linear-gradient(135deg, #234e52 0%, #3d7a78 100%);
    color: #fff;
    padding: 22px 30px;
  }
  .header h1 { font-size: 22px; font-weight: 800; letter-spacing: 0.5px; }
  .header .shop-detail { font-size: 11px; opacity: 0.85; margin-top: 2px; }
  .title-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 30px;
    border-bottom: 2px solid #3d7a78;
    background: #f0fdfa;
  }
  .title-bar h2 { font-size: 16px; color: #234e52; text-transform: uppercase; letter-spacing: 1px; }
  .title-bar .inv-no { font-size: 13px; font-weight: 600; color: #3d7a78; }
  .info-grid {
    display: flex;
    gap: 30px;
    padding: 16px 30px;
  }
  .info-col { flex: 1; }
  .info-col h3 {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #6b7280;
    margin-bottom: 6px;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 4px;
  }
  .info-col p { font-size: 12px; margin: 2px 0; color: #374151; }
  .vehicle-image-wrap { margin-top: 8px; }
  .vehicle-image {
    width: 120px;
    height: 80px;
    object-fit: cover;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
  }
  .section-card {
    margin: 10px 30px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
  }
  .section-title {
    padding: 10px 14px;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    color: #234e52;
    background: #f0fdfa;
    border-bottom: 1px solid #e5e7eb;
  }
  .section-icon { margin-right: 6px; }
  .service-block {
    padding: 8px 14px;
    border-bottom: 1px solid #f3f4f6;
  }
  .service-block:last-child { border-bottom: none; }
  .service-block-type {
    font-size: 11px;
    font-weight: 700;
    color: #3d7a78;
    margin-bottom: 5px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  .task-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 3px 0;
    font-size: 12px;
  }
  .task-text { flex: 1; color: #374151; }
  .task-text-failed { text-decoration: line-through; color: #9ca3af; font-style: italic; }
  .task-icon-completed { color: #047857; font-weight: 700; font-size: 14px; }
  .task-icon-failed { color: #dc2626; font-weight: 700; font-size: 14px; }
  .task-icon-pending { color: #d97706; font-size: 10px; }
  .task-badge-completed {
    font-size: 9px;
    padding: 2px 8px;
    border-radius: 10px;
    background: #d1fae5;
    color: #047857;
    font-weight: 600;
  }
  .task-badge-failed {
    font-size: 9px;
    padding: 2px 8px;
    border-radius: 10px;
    background: #fee2e2;
    color: #dc2626;
    font-weight: 600;
  }
  .task-badge-pending {
    font-size: 9px;
    padding: 2px 8px;
    border-radius: 10px;
    background: #fef3c7;
    color: #d97706;
    font-weight: 600;
  }
  .task-reason {
    font-size: 11px;
    color: #dc2626;
    font-style: italic;
    margin-left: 22px;
    margin-bottom: 4px;
  }
  table.items {
    width: calc(100% - 60px);
    margin: 8px 30px;
    border-collapse: collapse;
  }
  table.items thead th {
    background: #3d7a78;
    color: #fff;
    padding: 10px 12px;
    text-align: left;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  table.items thead th:nth-child(3),
  table.items thead th:nth-child(4) { text-align: center; }
  table.items thead th:last-child { text-align: right; }
  table.items tbody td {
    padding: 10px 12px;
    border-bottom: 1px solid #f3f4f6;
    font-size: 12px;
  }
  table.items tbody td:nth-child(3),
  table.items tbody td:nth-child(4) { text-align: center; }
  table.items tbody td:last-child { text-align: right; font-weight: 600; }
  .amt-words {
    margin: 6px 30px;
    padding: 8px 14px;
    background: #f9fafb;
    border-left: 3px solid #3d7a78;
    font-size: 11px;
    color: #6b7280;
    font-style: italic;
  }
  .summary-wrap {
    margin: 8px 30px 0 auto;
    width: 280px;
    padding: 6px 0;
  }
  .summary-row {
    display: flex;
    justify-content: space-between;
    padding: 5px 0;
    font-size: 12px;
  }
  .summary-row.total {
    border-top: 2px solid #234e52;
    margin-top: 6px;
    padding-top: 8px;
    font-size: 16px;
    font-weight: 800;
    color: #234e52;
  }
  .incl-badge {
    font-size: 9px;
    color: #6b7280;
    font-weight: 400;
    font-style: italic;
  }
  .payment-section {
    margin: 14px 30px;
    padding: 12px 16px;
    border-radius: 6px;
    text-align: center;
  }
  .payment-section.paid { background: #ecfdf5; border: 1px solid #6ee7b7; }
  .payment-section.unpaid { background: #fff7ed; border: 1px solid #fdba74; }
  .payment-section .status { font-size: 14px; font-weight: 700; text-transform: uppercase; }
  .payment-section.paid .status { color: #047857; }
  .payment-section.unpaid .status { color: #b45309; }
  .payment-section .detail { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .footer {
    margin-top: 20px;
    padding: 12px 30px;
    border-top: 1px solid #e5e7eb;
    font-size: 10px;
    color: #9ca3af;
    text-align: center;
  }
</style>
</head>
<body>

<div class="header">
  <h1>${shopName}</h1>
  <div class="shop-detail">${shopPhone ? `<span>Phone: ${shopPhone}</span>` : ''}${shopPhone && shopAddress ? ' | ' : ''}${shopAddress || ''}</div>
</div>

<div class="title-bar">
  <h2>TAX INVOICE</h2>
  <span class="inv-no">#${invoiceNumber}</span>
</div>

<div class="info-grid">
  <div class="info-col">
    <h3>Bill To</h3>
    <p><strong>${ownerName || '-'}</strong></p>
    <p>Vehicle: ${vehicleNumber}${vehicleModel ? ` (${vehicleModel})` : ''}</p>
    ${customerPhone ? `<p>Phone: ${customerPhone}</p>` : ''}
  </div>
  <div class="info-col">
    <h3>Invoice Details</h3>
    <p>Date: ${fmtDate(date)}</p>
    ${kmReading ? `<p>KM Reading: ${kmReading}</p>` : ''}
    ${technician ? `<p>Technician: ${technician}</p>` : ''}
    ${vehicleImageHtml}
  </div>
</div>

${serviceHtml}

<table class="items">
  <thead>
    <tr>
      <th style="width:36px">#</th>
      <th>Description</th>
      <th style="width:54px">Qty</th>
      <th style="width:76px">Rate</th>
      <th style="width:84px">Amount</th>
    </tr>
  </thead>
  <tbody>
    ${itemRows}
  </tbody>
</table>

<div class="amt-words">Amount: ${numberToWords(grandTotal)}</div>

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
  <div class="status">${paymentStatus === 'Paid' ? 'PAYMENT RECEIVED' : 'PAYMENT PENDING'}</div>
  ${paymentMethod ? `<div class="detail">via ${paymentMethod}</div>` : ''}
</div>

<div class="footer">
  <p>Thank you for your business! | ${shopName} | Invoice #${invoiceNumber}</p>
</div>

</body>
</html>`;
}
