const puppeteer = require('puppeteer');
const db         = require('../../config/db');
const { uploadToR2 } = require('../../middleware/upload');

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

/** dd.mm.yyyy */
function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return '—';
  return `${String(dt.getDate()).padStart(2,'0')}.${String(dt.getMonth()+1).padStart(2,'0')}.${dt.getFullYear()}`;
}

/** Currency symbol map */
function currSymbol(code) {
  const map = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ' };
  return map[code] || code || '₹';
}

/** Format currency */
function fmt(sym, n) {
  return `${sym}${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Number to words (Indian system) */
function numberToWords(amount, currCode = 'INR') {
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
    'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function tw(n) {
    if (!n || n === 0) return '';
    if (n < 20) return ones[n] + ' ';
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '') + ' ';
    if (n < 1000) return ones[Math.floor(n/100)] + ' Hundred ' + tw(n%100);
    if (n < 100000) return tw(Math.floor(n/1000)) + 'Thousand ' + tw(n%1000);
    if (n < 10000000) return tw(Math.floor(n/100000)) + 'Lakh ' + tw(n%100000);
    return tw(Math.floor(n/10000000)) + 'Crore ' + tw(n%10000000);
  }
  const rupees = Math.floor(amount);
  const paise  = Math.round((amount - rupees) * 100);
  const unit   = currCode === 'INR' ? 'Rupees' : (currCode || 'Rupees');
  let res = tw(rupees).trim() + ' ' + unit;
  if (paise > 0) res += ` and ${tw(paise).trim()} Paise`;
  return res + ' Only';
}

/** Parse complaints from JSON or plain text */
function parseComplaints(raw) {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) return parsed;
  } catch(_) {}
  return typeof raw === 'string' ? [{ type: 'General', tasks: [{ text: raw, fixed: false }] }] : [];
}

/** Build the full HTML invoice template */
function buildHtml(repair, bill, curr, invNo) {
  const sym          = currSymbol(curr);
  const billItems    = Array.isArray(bill?.items) ? bill.items : [];
  const serviceCharge= Number(bill?.service_charge || 0);
  const partsSubtotal= billItems.reduce((a,i) => a + Number(i.cost||0)*Number(i.qty||1), 0);
  const taxTotal     = Number(bill?.tax_total || 0);
  const grandTotal   = Number(bill?.total_amount || 0);
  const paymentStatus= bill?.payment_status || repair.payment_status || 'Unpaid';
  const isPaid       = paymentStatus?.toLowerCase() === 'paid';
  const complaints   = parseComplaints(repair.complaints);
  const amtWords     = numberToWords(grandTotal, curr);
  const printedAt    = new Date().toLocaleString('en-IN');

  // ── Build item rows ──────────────────────────────
  const itemRowsHtml = billItems.map((item, i) => {
    const qty = Number(item.qty || 0);
    const rate = Number(item.cost || 0);
    const total = qty * rate;
    return `
      <tr class="${i%2===1?'alt-row':''}">
        <td class="center">${i+1}</td>
        <td class="desc-name">${item.name || '—'}<br><span class="hsn-code">${item.hsn || ''}</span></td>
        <td class="center">${qty}</td>
        <td class="right">${fmt(sym, rate)}</td>
        <td class="right amount-col">${fmt(sym, total)}</td>
      </tr>`;
  }).join('');

  const serviceRow = serviceCharge > 0 ? `
    <tr class="service-row">
      <td class="center">${billItems.length + 1}</td>
      <td class="desc-name">Labour / Service Charge<br><span class="hsn-code">HSN: 998714</span></td>
      <td class="center">1</td>
      <td class="right">${fmt(sym, serviceCharge)}</td>
      <td class="right amount-col">${fmt(sym, serviceCharge)}</td>
    </tr>` : '';

  const emptyRow = (!billItems.length && !serviceCharge) ? `
    <tr><td colspan="5" class="empty-row">No items recorded for this repair.</td></tr>` : '';

  // ── Build tax rows ───────────────────────────────
  const taxRowsHtml = Array.isArray(bill?.tax_snapshot) ? bill.tax_snapshot.map(t => `
    <div class="summary-line tax-line">
      <span><span class="tax-badge">TAX</span> ${t.name} @ ${t.rate}%${t.is_inclusive ? ' [Incl.]' : ''}</span>
      <span>${fmt(sym, t.amount)}</span>
    </div>`).join('') : '';

  // ── Build complaint blocks ───────────────────────
  const complaintsHtml = complaints.map(block => {
    if (typeof block === 'object' && Array.isArray(block.tasks)) {
      const taskItems = block.tasks.map(t => `
        <div class="task-item ${t.fixed ? 'done' : ''}">
          <span class="task-bullet">${t.fixed ? '✓' : '○'}</span>
          <span class="task-text ${t.fixed ? 'task-done-text' : ''}">${t.text || '—'}</span>
        </div>`).join('');
      return `
        <div class="complaint-block">
          <div class="complaint-type">${(block.type || 'Job').toUpperCase()}</div>
          <div class="task-list">${taskItems || '<p class="no-tasks">No tasks listed.</p>'}</div>
        </div>`;
    }
    const txt = typeof block === 'string' ? block : (block.text || '—');
    const done = typeof block === 'object' ? !!block.fixed : false;
    return `<div class="task-item ${done?'done':''}"><span class="task-bullet">${done?'✓':'○'}</span><span class="task-text">${txt}</span></div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Invoice ${invNo}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --teal:        #3d7a78;
    --teal-dark:   #2d5c5a;
    --teal-deeper: #1e3f3d;
    --teal-light:  #e8f4f3;
    --teal-mid:    #c5e0de;
    --accent:      #5bb0ae;
    --green:       #059669;
    --green-light: #d1fae5;
    --amber:       #d97706;
    --amber-light: #fef3c7;
    --red:         #dc2626;
    --border:      #d1d5db;
    --text:        #111827;
    --muted:       #6b7280;
    --bg:          #f9fafb;
    --white:       #ffffff;
    --card:        #ffffff;
    --radius:      8px;
  }

  html, body {
    width: 210mm;
    min-height: 297mm;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: var(--white);
    color: var(--text);
    font-size: 12px;
    line-height: 1.55;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    background: var(--white);
    display: flex;
    flex-direction: column;
  }

  /* ── HEADER ── */
  .header {
    background: linear-gradient(135deg, var(--teal-deeper) 0%, var(--teal-dark) 55%, var(--teal) 100%);
    padding: 32px 40px 24px;
    position: relative;
    overflow: visible;
    flex-shrink: 0;
  }
  .header::before {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 200px; height: 200px;
    border-radius: 50%;
    background: rgba(255,255,255,0.05);
  }
  .header::after {
    content: '';
    position: absolute;
    bottom: -40px; left: 30%;
    width: 300px; height: 140px;
    border-radius: 50%;
    background: rgba(255,255,255,0.04);
  }
  .header-inner {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    position: relative;
    z-index: 1;
  }
  .brand-name {
    font-size: 22px;
    font-weight: 900;
    color: #ffffff;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    line-height: 1.1;
  }
  .brand-sub {
    font-size: 9.5px;
    font-weight: 600;
    color: rgba(255,255,255,0.55);
    text-transform: uppercase;
    letter-spacing: 0.22em;
    margin-top: 4px;
  }
  .brand-details {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .brand-detail-item {
    font-size: 10px;
    color: rgba(255,255,255,0.7);
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .invoice-meta-right {
    text-align: right;
  }
  .invoice-label {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.5);
  }
  .invoice-no {
    font-size: 20px;
    font-weight: 900;
    color: #ffffff;
    letter-spacing: 0.04em;
    margin-top: 2px;
  }
  .invoice-date-text {
    font-size: 10px;
    color: rgba(255,255,255,0.65);
    margin-top: 4px;
  }
  .header-badges {
    display: flex;
    gap: 8px;
    margin-top: 16px;
    flex-wrap: wrap;
    position: relative;
    z-index: 1;
  }
  .hbadge {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    padding: 4px 12px;
    border-radius: 100px;
    border: 1px solid rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.9);
  }
  .hbadge.paid   { background: rgba(5,150,105,0.3); border-color: rgba(5,150,105,0.5); color: #6ee7b7; }
  .hbadge.unpaid { background: rgba(217,119,6,0.3); border-color: rgba(217,119,6,0.5); color: #fcd34d; }
  .hbadge.completed { background: rgba(5,150,105,0.3); border-color: rgba(5,150,105,0.5); color: #6ee7b7; }
  .hbadge.pending   { background: rgba(217,119,6,0.3); border-color: rgba(217,119,6,0.5); color: #fcd34d; }
  .hbadge.inprogress { background: rgba(59,130,246,0.3); border-color: rgba(59,130,246,0.5); color: #93c5fd; }

  /* ── ACCENT STRIPE ── */
  .accent-stripe {
    height: 4px;
    background: linear-gradient(90deg, var(--accent) 0%, var(--teal) 50%, var(--teal-deeper) 100%);
  }

  /* ── META BAR ── */
  .meta-bar {
    background: var(--teal-light);
    border-bottom: 1px solid var(--teal-mid);
    padding: 10px 40px;
    display: flex;
    gap: 0;
  }
  .meta-cell {
    flex: 1;
    border-right: 1px solid var(--teal-mid);
    padding: 0 16px 0 0;
    margin-right: 16px;
  }
  .meta-cell:last-child { border-right: none; margin-right: 0; padding-right: 0; }
  .meta-label { font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.18em; color: var(--teal-dark); }
  .meta-value { font-size: 11px; font-weight: 800; color: var(--teal-deeper); margin-top: 2px; }

  /* ── BODY ── */
  .body { padding: 24px 40px 24px; flex: 1; }

  /* ── SECTION HEADING ── */
  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: var(--teal-dark);
    padding-bottom: 6px;
    border-bottom: 2px solid var(--teal-mid);
    margin-bottom: 12px;
    margin-top: 20px;
  }
  .section-title::before {
    content: '';
    display: block;
    width: 3px;
    height: 14px;
    background: var(--teal);
    border-radius: 2px;
    flex-shrink: 0;
  }

  /* ── INFO GRID ── */
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    margin-bottom: 4px;
  }
  .info-block {
    padding: 14px 16px;
    background: var(--card);
    border-right: 1px solid var(--border);
  }
  .info-block:last-child { border-right: none; }
  .info-block:nth-child(n+3) { border-top: 1px solid var(--border); }
  .info-block-label {
    font-size: 8.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--teal);
    margin-bottom: 4px;
  }
  .info-block-value {
    font-size: 13px;
    font-weight: 800;
    color: var(--text);
    line-height: 1.3;
  }
  .info-block-sub {
    font-size: 10px;
    color: var(--muted);
    margin-top: 2px;
    font-weight: 500;
  }

  /* ── VEHICLE/STATUS BLOCK ── */
  .three-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }
  .vehicle-number-big {
    font-size: 18px;
    font-weight: 900;
    color: var(--teal-dark);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  /* ── COMPLAINTS ── */
  .complaint-block {
    background: var(--bg);
    border: 1px solid var(--border);
    border-left: 3px solid var(--teal);
    border-radius: 0 var(--radius) var(--radius) 0;
    padding: 10px 14px;
    margin-bottom: 8px;
  }
  .complaint-type {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.22em;
    color: var(--teal-dark);
    margin-bottom: 8px;
    text-transform: uppercase;
  }
  .task-list { display: flex; flex-direction: column; gap: 5px; }
  .task-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 4px 8px;
    border-radius: 4px;
    background: var(--white);
    border: 1px solid var(--border);
  }
  .task-item.done { background: #f0fdf4; border-color: #bbf7d0; }
  .task-bullet {
    font-size: 11px;
    font-weight: 700;
    flex-shrink: 0;
    color: var(--teal);
  }
  .task-item.done .task-bullet { color: var(--green); }
  .task-text { font-size: 11px; color: var(--text); line-height: 1.4; }
  .task-done-text { text-decoration: line-through; color: var(--muted); }
  .no-tasks { font-size: 10px; color: var(--muted); font-style: italic; }

  /* ── ITEMS TABLE ── */
  table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    margin-bottom: 0;
  }
  thead tr {
    background: linear-gradient(90deg, var(--teal-dark) 0%, var(--teal) 100%);
  }
  thead th {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.9);
    padding: 11px 12px;
    text-align: left;
    white-space: nowrap;
  }
  .right { text-align: right; }
  .center { text-align: center; }
  tbody tr { border-bottom: 1px solid #f3f4f6; }
  tbody tr:last-child { border-bottom: none; }
  tbody td { padding: 10px 12px; font-size: 11.5px; color: var(--text); }
  tbody tr.alt-row { background: var(--bg); }
  tbody tr.service-row { background: var(--teal-light); }
  tbody tr.service-row td { color: var(--teal-dark); font-weight: 600; }
  .desc-name { font-weight: 600; }
  .hsn-code { font-size: 9px; color: var(--muted); font-weight: 400; }
  .amount-col { font-weight: 700; }
  .empty-row { text-align: center; color: var(--muted); font-style: italic; padding: 24px; }
  .table-footnote {
    font-size: 9px;
    color: var(--muted);
    padding: 6px 12px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-top: none;
    border-radius: 0 0 var(--radius) var(--radius);
    font-style: italic;
  }

  /* ── TOTALS ── */
  .totals-layout {
    display: flex;
    gap: 20px;
    align-items: flex-start;
    margin-top: 16px;
  }
  .amount-words-box {
    flex: 1;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 14px 16px;
    background: var(--teal-light);
  }
  .amount-words-label {
    font-size: 8.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--teal-dark);
    margin-bottom: 4px;
  }
  .amount-words-text {
    font-size: 11px;
    font-weight: 700;
    color: var(--teal-deeper);
    line-height: 1.5;
  }
  .totals-box {
    width: 280px;
    flex-shrink: 0;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
  }
  .summary-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 14px;
    font-size: 11.5px;
    border-bottom: 1px solid #f3f4f6;
    color: var(--muted);
    font-weight: 500;
  }
  .summary-line:last-child { border-bottom: none; }
  .summary-line span:last-child { font-weight: 700; color: var(--text); }
  .tax-line { background: #f0fdf4; }
  .tax-line span:first-child { color: var(--green); font-weight: 600; }
  .tax-badge {
    display: inline-block;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.1em;
    background: #d1fae5;
    color: var(--green);
    padding: 1px 5px;
    border-radius: 3px;
    margin-right: 4px;
  }
  .grand-total-row {
    background: linear-gradient(90deg, var(--teal-dark) 0%, var(--teal) 100%);
    padding: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .grand-label {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.8);
  }
  .grand-amount {
    font-size: 20px;
    font-weight: 900;
    color: #ffffff;
    letter-spacing: -0.02em;
  }

  /* ── PAYMENT STATUS BANNER ── */
  .payment-banner {
    border-radius: var(--radius);
    padding: 14px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 16px;
  }
  .payment-banner.paid {
    background: var(--green-light);
    border: 1.5px solid #6ee7b7;
  }
  .payment-banner.unpaid {
    background: var(--amber-light);
    border: 1.5px solid #fcd34d;
  }
  .payment-label {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }
  .payment-banner.paid   .payment-label  { color: var(--green); }
  .payment-banner.unpaid .payment-label  { color: var(--amber); }
  .payment-note { font-size: 9.5px; margin-top: 2px; opacity: 0.7; }
  .payment-amount {
    font-size: 18px;
    font-weight: 900;
  }
  .payment-banner.paid   .payment-amount { color: var(--green); }
  .payment-banner.unpaid .payment-amount { color: var(--amber); }

  /* ── TERMS ── */
  .terms-box {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 12px 16px;
    margin-top: 16px;
  }
  .terms-header {
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: var(--teal-dark);
    margin-bottom: 6px;
  }
  .terms-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .terms-list li {
    font-size: 9.5px;
    color: var(--muted);
    padding-left: 10px;
    position: relative;
  }
  .terms-list li::before {
    content: '•';
    position: absolute;
    left: 0;
    color: var(--teal);
    font-weight: 700;
  }

  /* ── FOOTER ── */
  .footer {
    background: linear-gradient(90deg, var(--teal-deeper) 0%, var(--teal-dark) 100%);
    padding: 14px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    flex-shrink: 0;
  }
  .footer-brand {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.9);
  }
  .footer-note {
    text-align: right;
    font-size: 9px;
    color: rgba(255,255,255,0.55);
    line-height: 1.6;
  }
  .footer-note span {
    display: block;
    color: rgba(255,255,255,0.8);
    font-weight: 600;
    font-size: 10px;
  }

  /* ── PRINT ── */
  @media print {
    html, body { background: white; }
    .page { width: 100%; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div class="header-inner">
      <div>
        <div class="brand-name">${repair.shop_name || 'Workshop'}</div>
        <div class="brand-sub">Automotive Service Center</div>
        <div class="brand-details">
          ${repair.location ? `<div class="brand-detail-item">📍 ${repair.location}</div>` : ''}
          ${repair.shop_phone ? `<div class="brand-detail-item">📞 ${repair.shop_phone}</div>` : ''}
        </div>
      </div>
      <div class="invoice-meta-right">
        <div class="invoice-label">Tax Invoice</div>
        <div class="invoice-no">${invNo}</div>
        <div class="invoice-date-text">Date: ${fmtDate(repair.repair_date)}</div>
        <div class="invoice-date-text">Printed: ${printedAt}</div>
      </div>
    </div>
    <div class="header-badges">
      <span class="hbadge ${(repair.status||'').toLowerCase().replace(/\s+/g,'')}">${repair.status || 'Pending'}</span>
      <span class="hbadge ${isPaid ? 'paid' : 'unpaid'}">${paymentStatus}</span>
      ${repair.service_type ? `<span class="hbadge">${repair.service_type}</span>` : ''}
    </div>
  </div>

  <!-- ACCENT STRIPE -->
  <div class="accent-stripe"></div>

  <!-- META BAR: Invoice No | Date | Status | Service -->
  <div class="meta-bar">
    <div class="meta-cell">
      <div class="meta-label">Invoice No.</div>
      <div class="meta-value">${invNo}</div>
    </div>
    <div class="meta-cell">
      <div class="meta-label">Service Date</div>
      <div class="meta-value">${fmtDate(repair.repair_date)}</div>
    </div>
    <div class="meta-cell">
      <div class="meta-label">Job Status</div>
      <div class="meta-value">${repair.status || 'Pending'}</div>
    </div>
    <div class="meta-cell">
      <div class="meta-label">Service Type</div>
      <div class="meta-value">${repair.service_type || 'General'}</div>
    </div>
    <div class="meta-cell">
      <div class="meta-label">Technician</div>
      <div class="meta-value">${repair.worker_name || 'Unassigned'}</div>
    </div>
  </div>

  <!-- BODY -->
  <div class="body">

    <!-- CUSTOMER & VEHICLE INFO -->
    <div class="section-title">Billing &amp; Vehicle Information</div>
    <div class="info-grid three-grid">
      <div class="info-block">
        <div class="info-block-label">Billed To</div>
        <div class="info-block-value">${repair.owner_name || '—'}</div>
        <div class="info-block-sub">${repair.phone_number || '—'}</div>
      </div>
      <div class="info-block">
        <div class="info-block-label">Vehicle</div>
        <div class="vehicle-number-big">${repair.vehicle_number || '—'}</div>
        <div class="info-block-sub">${[repair.model_name, repair.vehicle_type].filter(Boolean).join(' · ') || '—'}</div>
      </div>
      <div class="info-block" style="background:#f0f9f8;">
        <div class="info-block-label">Payment Status</div>
        <div class="info-block-value" style="color:${isPaid ? '#059669' : '#d97706'}">
          ${isPaid ? '✓ Paid' : '⚠ Unpaid'}
        </div>
        <div class="info-block-sub">Job #${repair.id}</div>
      </div>
    </div>

    ${complaints.length > 0 ? `
    <!-- JOB CARD / TASKS -->
    <div class="section-title">Job Card — Tasks &amp; Instructions</div>
    ${complaintsHtml}
    ` : ''}

    <!-- ITEMS TABLE -->
    <div class="section-title">Services, Parts &amp; Labour</div>
    <table>
      <thead>
        <tr>
          <th class="center" style="width:40px">#</th>
          <th style="width:50%">Description of Goods / Services</th>
          <th class="center" style="width:50px">Qty</th>
          <th class="right" style="width:100px">Unit Rate</th>
          <th class="right" style="width:110px">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRowsHtml}
        ${serviceRow}
        ${emptyRow}
      </tbody>
    </table>
    <div class="table-footnote">All amounts in ${curr || 'INR'}. Prices are exclusive of applicable taxes unless stated as inclusive.</div>

    <!-- TOTALS + AMOUNT IN WORDS -->
    <div class="totals-layout">
      <div class="amount-words-box">
        <div class="amount-words-label">Amount in Words</div>
        <div class="amount-words-text">${amtWords}</div>
      </div>
      <div class="totals-box">
        <div class="summary-line">
          <span>Parts Subtotal</span>
          <span>${fmt(sym, partsSubtotal)}</span>
        </div>
        ${serviceCharge > 0 ? `
        <div class="summary-line">
          <span>Service / Labour</span>
          <span>${fmt(sym, serviceCharge)}</span>
        </div>` : ''}
        ${taxRowsHtml}
        ${taxTotal > 0 ? `
        <div class="summary-line" style="color:#059669;font-weight:700;background:#f0fdf4;">
          <span>Total Tax</span>
          <span>${fmt(sym, taxTotal)}</span>
        </div>` : ''}
        <div class="grand-total-row">
          <div class="grand-label">Grand Total</div>
          <div class="grand-amount">${fmt(sym, grandTotal)}</div>
        </div>
      </div>
    </div>

    <!-- PAYMENT STATUS BANNER -->
    <div class="payment-banner ${isPaid ? 'paid' : 'unpaid'}">
      <div>
        <div class="payment-label">${isPaid ? '✓ Payment Received' : '⚠ Payment Pending'}</div>
        <div class="payment-note">${isPaid ? 'This invoice has been fully settled.' : 'Please present this document at the time of payment.'}</div>
      </div>
      <div class="payment-amount">${fmt(sym, grandTotal)}</div>
    </div>

    <!-- TERMS & CONDITIONS -->
    <div class="terms-box">
      <div class="terms-header">Terms &amp; Conditions</div>
      <ul class="terms-list">
        <li>This invoice is computer-generated and valid without a physical signature unless otherwise stated.</li>
        <li>Payment is due within 7 days from the date of invoice.</li>
        <li>Goods once sold / services rendered will not be reversed without prior written approval.</li>
        <li>The workshop is not responsible for any loss, theft, or damage to the vehicle after delivery.</li>
        <li>All disputes are subject to local jurisdiction only.</li>
      </ul>
    </div>


  </div><!-- /.body -->

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-brand">${repair.shop_name || 'Workshop'}</div>
    <div class="footer-note">
      <span>Thank you for your business!</span>
      ${invNo} &nbsp;·&nbsp; Job #${repair.id}
    </div>
  </div>

</div><!-- /.page -->
</body>
</html>`;
}

// ─────────────────────────────────────────────
//  MAIN CONTROLLER
// ─────────────────────────────────────────────
exports.generatePDF = async (req, res) => {
  const { id }     = req.params;
  const action     = req.query.action || 'download';
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';

  let browser;
  try {
    // ── 1. FETCH DATA ─────────────────────────────────────────────────────────
    const repairRes = await db.query(`
      SELECT r.*,
             s.name     AS shop_name,
             s.location,
             s.currency,
             s.phone    AS shop_phone,
             aw.name    AS worker_name
      FROM   repairs r
      JOIN   shops   s  ON s.id = r.shop_id
      LEFT JOIN users aw ON aw.id = r.attending_worker_id
      WHERE  r.id = $1
    `, [id]);

    if (repairRes.rows.length === 0)
      return res.status(404).json({ error: 'Repair not found' });

    const repair = repairRes.rows[0];
    if (!isSuperAdmin && repair.shop_id !== shopId)
      return res.status(403).json({ error: 'Access denied' });

    const billRes = await db.query(
      'SELECT * FROM repair_bills WHERE repair_id = $1 AND deleted_at IS NULL ORDER BY id DESC LIMIT 1',
      [id]
    );
    const bill  = billRes.rows[0] || null;
    const curr  = repair.currency || 'INR';
    const invNo = `INV-${String(bill?.id || id).padStart(6, '0')}`;

    // ── 2. BUILD HTML ─────────────────────────────────────────────────────────
    const html = buildHtml(repair, bill, curr, invNo);

    // ── 3. RENDER WITH PUPPETEER ──────────────────────────────────────────────
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=none',
      ],
    });

    const page = await browser.newPage();

    // Set content and wait for fonts (Google Fonts) to load
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    // Generate PDF — A4, full background, 10mm margins
    const pdfBuffer = await page.pdf({
      format        : 'A4',
      printBackground: true,
      margin        : { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
      preferCSSPageSize: true,
    });

    await browser.close();
    browser = null;

    // ── 4. RESPOND ────────────────────────────────────────────────────────────
    if (action === 'store') {
      const safeVehicle = (repair.vehicle_number || 'UNKNOWN').replace(/\s+/g, '_');
      const filename    = `invoice_${safeVehicle}_${Date.now()}.pdf`;
      try {
        const url = await uploadToR2(pdfBuffer, filename, 'application/pdf', `attachment; filename="${filename}"`);
        return res.status(200).json({ success: true, url });
      } catch (e) {
        console.error('R2 upload error:', e);
        return res.status(500).json({ error: 'Failed to upload generated PDF' });
      }
    }

    const safeVehicle = (repair.vehicle_number || 'invoice').replace(/\s+/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${safeVehicle}_${id}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.end(pdfBuffer);

  } catch (err) {
    if (browser) { try { await browser.close(); } catch(_) {} }
    console.error('generatePDF Error:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to generate PDF' });
  }
};