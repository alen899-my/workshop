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

const CURRENCY_NAMES: Record<string, [string, string]> = {
  INR: ['Rupees', 'Paise'],
  USD: ['Dollars', 'Cents'],
  EUR: ['Euro', 'Cents'],
  GBP: ['Pounds', 'Pence'],
  AED: ['Dirhams', 'Fils'],
  SAR: ['Riyals', 'Halalas'],
  QAR: ['Riyals', 'Dirhams'],
  KWD: ['Dinars', 'Fils'],
  OMR: ['Rials', 'Baisa'],
  BHD: ['Dinars', 'Fils'],
  MYR: ['Ringgit', 'Sen'],
  SGD: ['Dollars', 'Cents'],
  LKR: ['Rupees', 'Cents'],
  BDT: ['Taka', 'Poisha'],
  NPR: ['Rupees', 'Paisa'],
  PKR: ['Rupees', 'Paisa'],
  AUD: ['Dollars', 'Cents'],
  NZD: ['Dollars', 'Cents'],
  CAD: ['Dollars', 'Cents'],
  CHF: ['Francs', 'Rappen'],
  SEK: ['Kronor', 'Ore'],
  NOK: ['Kroner', 'Ore'],
  DKK: ['Kroner', 'Ore'],
  JPY: ['Yen', 'Sen'],
  KRW: ['Won', 'Jeon'],
  CNY: ['Yuan', 'Fen'],
  BRL: ['Reais', 'Centavos'],
  ZAR: ['Rand', 'Cents'],
  NGN: ['Naira', 'Kobo'],
  KES: ['Shillings', 'Cents'],
  EGP: ['Pounds', 'Piastres'],
  TRY: ['Lira', 'Kurus'],
  RUB: ['Rubles', 'Kopeks'],
  THB: ['Baht', 'Satang'],
  VND: ['Dong', 'Xu'],
  IDR: ['Rupiah', 'Sen'],
  PHP: ['Pesos', 'Centavos'],
  MXN: ['Pesos', 'Centavos'],
  ARS: ['Pesos', 'Centavos'],
  CLP: ['Pesos', 'Centavos'],
  COP: ['Pesos', 'Centavos'],
  PEN: ['Soles', 'Centimos'],
  HKD: ['Dollars', 'Cents'],
  TWD: ['Dollars', 'Cents'],
  ILS: ['Shekels', 'Agorot'],
  PLN: ['Zloty', 'Groszy'],
  CZK: ['Koruny', 'Haliru'],
  HUF: ['Forints', 'Fillér'],
  RON: ['Lei', 'Bani'],
  BGN: ['Leva', 'Stotinki'],
  ISK: ['Kronur', 'Aurar'],
  UAH: ['Hryvni', 'Kopiyky'],
  GHS: ['Cedis', 'Pesewas'],
  TZS: ['Shillings', 'Cents'],
  UGX: ['Shillings', 'Cents'],
  MAD: ['Dirhams', 'Centimes'],
  DZD: ['Dinars', 'Centimes'],
  TND: ['Dinars', 'Millimes'],
  JOD: ['Dinars', 'Fils'],
  IQD: ['Dinars', 'Fils'],
  IRR: ['Rials', 'Dinars'],
  MVR: ['Rufiyaa', 'Laari'],
  ETB: ['Birr', 'Santim'],
  BOB: ['Bolivianos', 'Centavos'],
  PYG: ['Guarani', 'Centimos'],
  UYU: ['Pesos', 'Centésimos'],
  CRC: ['Colones', 'Centimos'],
  DOP: ['Pesos', 'Centavos'],
  GTQ: ['Quetzales', 'Centavos'],
  PAB: ['Balboas', 'Centésimos'],
  MNT: ['Tugriks', 'Mongo'],
  KHR: ['Riels', 'Sen'],
  LAK: ['Kip', 'Att'],
  MMK: ['Kyats', 'Pyas'],
  BND: ['Dollars', 'Cents'],
  FJD: ['Dollars', 'Cents'],
  PGK: ['Kina', 'Toea'],
  MOP: ['Patacas', 'Avos'],
  XPF: ['Francs', 'Centimes'],
};

function numberToWords(amount: number, currencyCode = 'INR'): string {
  const [currencyName, fractionName] = CURRENCY_NAMES[currencyCode] ?? ['Rupees', 'Paise'];
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
  let words = `${toWords(whole).trim()} ${currencyName}`;
  if (fraction > 0) words += ` and ${toWords(fraction).trim()} ${fractionName}`;
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
  currencyCode?: string;
}): string {
  const {
    shopName, shopPhone, shopAddress, invoiceNumber, date,
    ownerName, vehicleNumber, vehicleModel, customerPhone, technician,
    kmReading, vehicleImageSrc, serviceBlocks,
    items, serviceCharge, taxSnapshot, paymentStatus, paymentMethod, currency, currencyCode,
  } = params;

  const subtotal = items.reduce((s, it) => s + (Number(it.cost) || 0) * (Number(it.qty) || 0), 0);
  const exclusiveTaxTotal = taxSnapshot
    .filter(t => !t.is_inclusive)
    .reduce((s, t) => s + Number(t.amount || 0), 0);
  const grandTotal = subtotal + Number(serviceCharge || 0) + exclusiveTaxTotal;

  const itemRows = items.length > 0
    ? items.map((item, i) => {
        const amt = (Number(item.cost) || 0) * (Number(item.qty) || 0);
        return `<tr${i % 2 === 0 ? ' class="alt"' : ''}>
          <td class="col-desc">${item.name || `Item ${i + 1}`}</td>
          <td class="col-center">${item.qty}</td>
          <td class="col-center">${currency}${Number(item.cost).toFixed(2)}</td>
          <td class="col-right">${currency}${amt.toFixed(2)}</td>
        </tr>`;
      }).join('')
    : `<tr><td colspan="4" class="empty-row">No items listed</td></tr>`;

  const appliesToLabel = (v: string) => v === 'all' ? 'Everything' : v === 'parts' ? 'Parts' : v === 'service' ? 'Labor' : v;

  const taxRows = taxSnapshot.map(t => `
    <div class="summary-row">
      <span>${t.name} (${t.rate}%) <span class="tax-tag ${t.is_inclusive ? 'tax-tag-incl' : 'tax-tag-excl'}">${t.is_inclusive ? 'incl' : 'excl'}</span> <span class="applies-tag">${appliesToLabel(t.applies_to)}</span></span>
      <span>${t.is_inclusive ? '' : '+'} ${currency}${Number(t.amount).toFixed(2)}</span>
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
    color: #1e293b;
    font-size: 12px;
    line-height: 1.6;
    background: #f8fafc;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    max-width: 800px;
    margin: 0 auto;
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0,0,0,.08);
    min-height: 100vh;
  }

  .header {
    padding: 28px 32px 20px;
    border-bottom: 3px solid #0d9488;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .header-left h1 {
    font-size: 24px;
    font-weight: 900;
    color: #0f172a;
    letter-spacing: -0.5px;
  }
  .header-left .shop-contact {
    font-size: 10px;
    color: #94a3b8;
    margin-top: 3px;
  }
  .header-right { text-align: right; }
  .header-right .inv-label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #94a3b8;
    font-weight: 600;
  }
  .header-right .inv-number {
    font-size: 16px;
    font-weight: 800;
    color: #0d9488;
    letter-spacing: 0.3px;
  }
  .header-right .inv-date {
    font-size: 10px;
    color: #94a3b8;
    margin-top: 2px;
  }

  .info-grid {
    display: flex;
    gap: 0;
    padding: 20px 32px;
    border-bottom: 1px solid #e2e8f0;
  }
  .info-col {
    flex: 1;
    padding: 12px 16px;
    border-right: 1px solid #f1f5f9;
  }
  .info-col:last-child { border-right: none; }
  .info-col .info-label {
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #94a3b8;
    font-weight: 700;
    margin-bottom: 4px;
  }
  .info-col .info-value {
    font-size: 13px;
    color: #0f172a;
    font-weight: 700;
    margin: 2px 0;
  }
  .info-col .info-sub {
    font-size: 11px;
    color: #475569;
    margin: 2px 0;
  }
  .vehicle-plate {
    display: inline-block;
    background: #0f172a;
    color: #ffffff;
    font-size: 14px;
    font-weight: 900;
    letter-spacing: 2px;
    padding: 4px 14px;
    border-radius: 4px;
    margin-top: 4px;
  }
  .vehicle-image-wrap { margin-top: 8px; }
  .vehicle-image {
    width: 100px;
    height: 68px;
    object-fit: cover;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
  }

  .section-card {
    margin: 16px 32px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(0,0,0,.04);
  }
  .section-title {
    padding: 10px 16px;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #94a3b8;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }
  .service-block {
    padding: 10px 16px;
    border-bottom: 1px solid #f1f5f9;
  }
  .service-block:last-child { border-bottom: none; }
  .service-block-type {
    font-size: 10px;
    font-weight: 700;
    color: #0d9488;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .task-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 3px 0;
  }
  .task-text { flex: 1; font-size: 11px; color: #475569; }
  .task-text-failed { text-decoration: line-through; color: #94a3b8; font-style: italic; }
  .task-icon { font-size: 12px; width: 16px; text-align: center; }
  .task-icon-done { color: #0d9488; }
  .task-icon-failed { color: #ef4444; }
  .task-icon-pending { color: #f59e0b; font-size: 8px; }
  .task-badge {
    font-size: 7px;
    padding: 2px 10px;
    border-radius: 20px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .task-badge-done { background: #e6f7f2; color: #0d9488; }
  .task-badge-failed { background: #fef2f2; color: #ef4444; }
  .task-badge-pending { background: #fffbeb; color: #f59e0b; }
  .task-reason {
    font-size: 10px;
    color: #ef4444;
    font-style: italic;
    margin-left: 24px;
    margin-bottom: 2px;
  }

  table.items {
    width: calc(100% - 64px);
    margin: 8px 32px;
    border-collapse: separate;
    border-spacing: 0;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
  }
  table.items thead th {
    padding: 10px 14px;
    text-align: left;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #ffffff;
    background: #0d9488;
    font-weight: 700;
  }
  table.items thead th:last-child { text-align: right; }
  table.items tbody td {
    padding: 10px 14px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 11px;
    color: #475569;
  }
  table.items tbody tr:last-child td { border-bottom: none; }
  table.items tbody tr.alt td { background: #f8fafc; }
  .col-desc { width: auto; font-weight: 600; color: #0f172a; }
  .col-center { text-align: center; }
  .col-right { text-align: right; font-weight: 700; color: #0f172a; }
  .empty-row { text-align: center; color: #94a3b8; padding: 24px; font-style: italic; }

  .amt-words {
    margin: 4px 32px;
    padding: 10px 16px;
    font-size: 10px;
    color: #475569;
    font-style: italic;
    background: #f8fafc;
    border-left: 3px solid #0d9488;
    border-radius: 4px;
  }

  .summary-wrap {
    margin: 8px 32px 0 auto;
    max-width: 300px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 14px 18px;
    background: #fafdfc;
  }
  .summary-row {
    display: flex;
    justify-content: space-between;
    padding: 5px 0;
    font-size: 11px;
    color: #475569;
    align-items: center;
  }
  .summary-row.sub-first { border-top: 1px dashed #cbd5e1; padding-top: 8px; margin-top: 4px; }
  .summary-row.total {
    border-top: 2px solid #0d9488;
    margin-top: 8px;
    padding-top: 10px;
    font-size: 15px;
    font-weight: 800;
    color: #0f172a;
  }
  .summary-row.total span:last-child { color: #0d9488; }
  .tax-tag {
    display: inline-block;
    font-size: 7px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    vertical-align: middle;
    margin-left: 2px;
  }
  .tax-tag-incl { background: #e6f7f2; color: #0d9488; }
  .tax-tag-excl { background: #fffbeb; color: #f59e0b; }
  .applies-tag {
    display: inline-block;
    font-size: 7px;
    font-weight: 500;
    color: #94a3b8;
    border: 1px solid #e2e8f0;
    padding: 1px 6px;
    border-radius: 4px;
    vertical-align: middle;
    margin-left: 2px;
  }

  .payment-section {
    margin: 20px 32px;
    padding: 14px 20px;
    border-radius: 8px;
    text-align: center;
  }
  .payment-section.paid {
    background: #e6f7f2;
    border: 1px solid #0d9488;
  }
  .payment-section.unpaid {
    background: #fffbeb;
    border: 1px solid #f59e0b;
  }
  .payment-section .status {
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  .payment-section.paid .status { color: #0d9488; }
  .payment-section.unpaid .status { color: #f59e0b; }
  .payment-section .detail {
    font-size: 10px;
    color: #64748b;
    margin-top: 3px;
  }
  .payment-section .status-icon {
    display: inline-block;
    margin-right: 6px;
  }

  .footer {
    margin-top: 28px;
    padding: 16px 32px 24px;
    border-top: 1px solid #e2e8f0;
    font-size: 10px;
    color: #94a3b8;
    text-align: center;
  }
  .footer .thanks {
    font-size: 12px;
    color: #64748b;
    font-weight: 600;
    margin-bottom: 4px;
  }

  @media print {
    body { background: none; }
    .page { box-shadow: none; }
  }
</style>
</head>
<body>
<div class="page">

<div class="header">
  <div class="header-left">
    <h1>${shopName}</h1>
    <div class="shop-contact">${[shopPhone, shopAddress].filter(Boolean).join(' &middot; ')}</div>
  </div>
  <div class="header-right">
    <div class="inv-label">Invoice</div>
    <div class="inv-number">#${invoiceNumber}</div>
    <div class="inv-date">${fmtDate(date)}</div>
  </div>
</div>

<div class="info-grid">
  <div class="info-col">
    <div class="info-label">Customer</div>
    <div class="info-value">${ownerName || 'Walk-in'}</div>
    ${customerPhone ? `<div class="info-sub">${customerPhone}</div>` : ''}
  </div>
  <div class="info-col">
    <div class="info-label">Vehicle</div>
    <div class="vehicle-plate">${vehicleNumber}</div>
    <div class="info-sub">${vehicleModel || ''}</div>
  </div>
  <div class="info-col">
    <div class="info-label">Service Details</div>
    ${technician ? `<div class="info-sub">Technician: ${technician}</div>` : ''}
    ${kmReading ? `<div class="info-sub">KM Reading: ${kmReading}</div>` : ''}
    ${vehicleImageHtml}
  </div>
</div>

${serviceHtml}

<table class="items">
  <thead>
    <tr>
      <th>Description</th>
      <th class="col-center">Qty</th>
      <th class="col-center">Unit Price</th>
      <th class="col-right">Amount</th>
    </tr>
  </thead>
  <tbody>
    ${itemRows}
  </tbody>
</table>

<div class="amt-words">${numberToWords(grandTotal, currencyCode)}</div>

<div class="summary-wrap">
  <div class="summary-row sub-first">
    <span>Subtotal</span>
    <span>${currency}${subtotal.toFixed(2)}</span>
  </div>
  ${Number(serviceCharge) > 0 ? `
  <div class="summary-row">
    <span>Labour Charge</span>
    <span>${currency}${Number(serviceCharge).toFixed(2)}</span>
  </div>` : ''}
  ${taxRows}
  <div class="summary-row total">
    <span>Grand Total</span>
    <span>${currency}${grandTotal.toFixed(2)}</span>
  </div>
</div>

<div class="payment-section ${paymentStatus === 'Paid' ? 'paid' : 'unpaid'}">
  <div class="status">
    <span class="status-icon">${paymentStatus === 'Paid' ? '&#10003;' : '&#9679;'}</span>
    ${paymentStatus === 'Paid' ? 'Payment Received' : 'Payment Pending'}
  </div>
  ${paymentMethod ? `<div class="detail">via ${paymentMethod}</div>` : ''}
</div>

<div class="footer">
  <div class="thanks">Thank you for your business!</div>
  ${shopName} &middot; Invoice #${invoiceNumber}
</div>

</div>
</body>
</html>`;
}
