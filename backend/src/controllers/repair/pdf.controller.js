const PDFDocument = require('pdfkit');
const db = require('../../config/db');
const { uploadToR2 } = require('../../middleware/upload');

const C = {
  tealDark: '#234e52',
  teal: '#3d7a78',
  tealLight: '#e8f4f3',
  accent: '#5bb0ae',
  border: '#d1d5db',
  text: '#111827',
  muted: '#6b7280',
  surface: '#f8fafc',
  successBg: '#d1fae5',
  successText: '#047857',
  warnBg: '#fef3c7',
  warnText: '#b45309',
  white: '#ffffff',
  whiteMuted: '#d5e4e3',
};

function fmtDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getFullYear()),
  ].join('.');
}

function currSymbol(code) {
  const map = { INR: 'Rs. ', USD: '$', EUR: 'EUR ', GBP: 'GBP ', AED: 'AED ' };
  return map[code] || `${code || 'INR'} `;
}

function fmt(sym, value) {
  const amount = Number(value || 0);
  return `${sym}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function numberToWords(amount, currCode = 'INR') {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function toWords(value) {
    if (!value) return '';
    if (value < 20) return `${ones[value]} `;
    if (value < 100) return `${tens[Math.floor(value / 10)]}${value % 10 ? ` ${ones[value % 10]}` : ''} `;
    if (value < 1000) return `${ones[Math.floor(value / 100)]} Hundred ${toWords(value % 100)}`;
    if (value < 100000) return `${toWords(Math.floor(value / 1000))}Thousand ${toWords(value % 1000)}`;
    if (value < 10000000) return `${toWords(Math.floor(value / 100000))}Lakh ${toWords(value % 100000)}`;
    return `${toWords(Math.floor(value / 10000000))}Crore ${toWords(value % 10000000)}`;
  }
  const whole = Math.floor(Number(amount || 0));
  const fraction = Math.round((Number(amount || 0) - whole) * 100);
  const unit = currCode === 'INR' ? 'Rupees' : (currCode || 'Rupees');
  let words = `${toWords(whole).trim()} ${unit}`;
  if (fraction > 0) words += ` and ${toWords(fraction).trim()} Paise`;
  return `${words} Only`;
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === 'string') {
    try { const p = JSON.parse(value); return Array.isArray(p) ? p : []; } catch (_) { return []; }
  }
  return [];
}

function parseComplaints(raw) {
  if (!raw) return [];
  try {
    const p = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(p) ? p : [];
  } catch (_) {
    return typeof raw === 'string'
      ? [{ type: 'General', tasks: [{ text: raw, fixed: false }] }]
      : [];
  }
}

function normalizeComplaintGroups(raw) {
  return parseComplaints(raw).map((entry) => {
    if (entry && typeof entry === 'object' && Array.isArray(entry.tasks)) {
      return {
        title: String(entry.type || 'Job').trim() || 'Job',
        tasks: entry.tasks.map((t) => ({ text: String(t?.text || '').trim(), fixed: Boolean(t?.fixed) })).filter((t) => t.text),
      };
    }
    if (typeof entry === 'string' && entry.trim()) return { title: 'Notes', tasks: [{ text: entry.trim(), fixed: false }] };
    if (entry && typeof entry === 'object' && String(entry.text || '').trim()) return { title: 'Notes', tasks: [{ text: String(entry.text).trim(), fixed: Boolean(entry.fixed) }] };
    return null;
  }).filter((g) => g && g.tasks.length > 0);
}

function textOrDash(value) { const t = String(value ?? '').trim(); return t || '-'; }

function sanitizeFilePart(value, fallback = 'invoice') {
  const c = String(value || '').trim().replace(/[^\w-]+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
  return c || fallback;
}

function collectPdfBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

function drawBadge(doc, text, x, y, tone, size = 8) {
  const badgeText = textOrDash(text).toUpperCase();
  const px = 10, py = 4;
  doc.font('Helvetica-Bold').fontSize(size);
  const w = doc.widthOfString(badgeText) + px * 2;
  const h = size + 10;
  doc.save();
  doc.roundedRect(x, y, w, h, 8).fillAndStroke(tone.fill, tone.stroke);
  doc.fillColor(tone.text).fontSize(size).text(badgeText, x + px, y + py + 1, { width: w - px * 2, align: 'center' });
  doc.restore();
  return w;
}

function measureText(doc, text, width, font = 'Helvetica', size = 10) {
  doc.font(font).fontSize(size);
  return doc.heightOfString(textOrDash(text), { width, lineGap: 2 });
}

async function buildInvoicePdf(repair, bill, currency, invoiceNumber) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    bufferPages: true,
    info: {
      Title: `Invoice ${invoiceNumber}`,
      Author: textOrDash(repair.shop_name),
      Subject: `Repair invoice for job ${repair.id}`,
      Creator: 'Workshop Backend',
      Producer: 'PDFKit',
    },
  });

  const pdfPromise = collectPdfBuffer(doc);
  const ml = doc.page.margins.left;
  const mr = doc.page.margins.right;
  const cw = doc.page.width - ml - mr;
  const bottomLimit = () => doc.page.height - doc.page.margins.bottom - 16;
  const symbol = currSymbol(currency);
  const billItems = parseJsonArray(bill?.items);
  const taxSnapshot = parseJsonArray(bill?.tax_snapshot);
  const serviceCharge = Number(bill?.service_charge || 0);
  const partsSubtotal = billItems.reduce((s, i) => s + (Number(i?.cost || 0) * Number(i?.qty || 0)), 0);
  const subtotalBeforeTax = Number(bill?.subtotal_before_tax || (partsSubtotal + serviceCharge));
  const exclusiveTaxTotal = taxSnapshot.reduce((s, i) => s + (i?.is_inclusive ? 0 : Number(i?.amount || 0)), 0);
  const totalTax = taxSnapshot.reduce((s, i) => s + Number(i?.amount || 0), 0);
  const grandTotal = Number(bill?.total_amount || (subtotalBeforeTax + exclusiveTaxTotal));
  const paymentStatus = textOrDash(bill?.payment_status || repair.payment_status || 'Unpaid');
  const isPaid = paymentStatus.toLowerCase() === 'paid';
  const amountInWords = numberToWords(grandTotal, currency);
  const complaintGroups = normalizeComplaintGroups(repair.complaints);
  const printedAt = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  const pageTone = isPaid
    ? { fill: C.successBg, stroke: '#6ee7b7', text: C.successText }
    : { fill: C.warnBg, stroke: '#fcd34d', text: C.warnText };

  const tableRows = billItems.map((item, i) => ({
    index: i + 1,
    description: textOrDash(item?.name),
    qty: Number(item?.qty || 0),
    rate: Number(item?.cost || 0),
    amount: Number(item?.cost || 0) * Number(item?.qty || 0),
  }));
  if (serviceCharge > 0) {
    tableRows.push({
      index: tableRows.length + 1,
      description: 'Labour / Service Charge',
      qty: 1,
      rate: serviceCharge,
      amount: serviceCharge,
      isService: true,
    });
  }

  // ── Address lines ──────────────────────────────────────────────
  const shopAddrParts = [
    repair.shop_address,
    [repair.shop_city, repair.shop_state].filter(Boolean).join(', '),
    repair.shop_country,
  ].filter(Boolean);
  const shopAddr = shopAddrParts.length ? shopAddrParts.join('\n') : textOrDash(repair.location);

  // ── Pagination helpers ─────────────────────────────────────────
  function addContinuationHeader() {
    doc.save();
    doc.rect(0, 0, doc.page.width, 48).fill(C.tealDark);
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(12)
      .text(textOrDash(repair.shop_name), ml, 16, { width: 260 });
    doc.font('Helvetica').fontSize(8).fillColor(C.whiteMuted)
      .text(`Invoice ${invoiceNumber}`, 0, 18, { align: 'right', width: doc.page.width - mr });
    doc.restore();
    doc.y = 64;
  }

  function newPage() { doc.addPage(); addContinuationHeader(); }

  function ensureSpace(height) { if (doc.y + height > bottomLimit()) newPage(); }

  function drawSectionTitle(title, extraTop = 6) {
    ensureSpace(26 + extraTop);
    const y = doc.y + extraTop;
    doc.save();
    doc.rect(ml, y + 4, 4, 14).fill(C.accent);
    doc.fillColor(C.tealDark).font('Helvetica-Bold').fontSize(10)
      .text(title, ml + 12, y + 1, { characterSpacing: 0.8 });
    doc.restore();
    doc.y = y + 24;
  }

  // ── HEADER ─────────────────────────────────────────────────────
  function drawHeader() {
    const x = ml;
    const headerH = 135;
    const metaTop = headerH;
    const metaH = 44;
    const metaCellW = cw / 5;

    // Dark teal banner
    doc.save();
    doc.rect(0, 0, doc.page.width, headerH).fill(C.tealDark);
    doc.rect(0, headerH, doc.page.width, 4).fill(C.accent);
    doc.restore();

    // Left — Shop name & address
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(20).text(textOrDash(repair.shop_name), x, 26, { width: 280 });
    doc.font('Helvetica').fontSize(9).fillColor(C.whiteMuted);
    const addrLines = shopAddr.split('\n');
    let ay = 52;
    addrLines.forEach((l) => { if (l.trim()) { doc.text(l.trim(), x, ay, { width: 260 }); ay += 13; } });
    doc.text(textOrDash(repair.shop_phone), x, ay, { width: 260 });

    // Right — TAX INVOICE title
    const rw = 190;
    const rx = doc.page.width - mr - rw;
    doc.font('Helvetica-Bold').fontSize(10).fillColor(C.whiteMuted)
      .text('TAX INVOICE', rx, 26, { width: rw, align: 'right', characterSpacing: 1.2 });
    doc.font('Helvetica-Bold').fontSize(18).fillColor(C.white)
      .text(invoiceNumber, rx, 40, { width: rw, align: 'right' });
    doc.font('Helvetica').fontSize(9).fillColor(C.whiteMuted)
      .text(`Date: ${fmtDate(repair.repair_date)}`, rx, 66, { width: rw, align: 'right' })
      .text(`Printed: ${printedAt}`, rx, 80, { width: rw, align: 'right' });

    // Badges
    let bx = x;
    const by = 100;
    bx += drawBadge(doc, repair.status || 'Pending', bx, by, { fill: '#335f63', stroke: '#4f8487', text: C.white }) + 8;
    bx += drawBadge(doc, paymentStatus, bx, by, pageTone) + 8;
    if (repair.service_type) {
      drawBadge(doc, repair.service_type, bx, by, { fill: '#335f63', stroke: '#4f8487', text: C.white });
    }

    // Meta bar
    const metaItems = [
      { label: 'Invoice No.', value: invoiceNumber },
      { label: 'Service Date', value: fmtDate(repair.repair_date) },
      { label: 'Job Status', value: textOrDash(repair.status || 'Pending') },
      { label: 'Service Type', value: textOrDash(repair.service_type || 'General') },
      { label: 'Technician', value: textOrDash(repair.worker_name || 'Unassigned') },
    ];

    doc.save();
    doc.rect(0, metaTop, doc.page.width, metaH).fill(C.tealLight);
    doc.restore();
    metaItems.forEach((item, i) => {
      const cx = x + i * metaCellW;
      if (i > 0) {
        doc.save();
        doc.moveTo(cx, metaTop + 6).lineTo(cx, metaTop + metaH - 6).lineWidth(1).strokeColor('#b6d8d5').stroke();
        doc.restore();
      }
      doc.font('Helvetica-Bold').fontSize(7).fillColor(C.tealDark)
        .text(item.label.toUpperCase(), cx + 8, metaTop + 6, { width: metaCellW - 16, characterSpacing: 0.8 });
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C.text)
        .text(item.value, cx + 8, metaTop + 20, { width: metaCellW - 16 });
    });
    doc.y = metaTop + metaH + 18;
  }

  // ── BILLING & VEHICLE INFO (2-col grid) ────────────────────────
  function drawBillingVehicleInfo() {
    drawSectionTitle('BILL TO & VEHICLE INFORMATION');

    const leftCol = [
      { label: 'Customer Name', value: textOrDash(repair.owner_name) },
      { label: 'Phone Number', value: textOrDash(repair.phone_number) },
      { label: 'WhatsApp No.', value: textOrDash(repair.whatsapp_number || repair.phone_number) },
    ];
    const rightCol = [
      { label: 'Vehicle Number', value: textOrDash(repair.vehicle_number) },
      { label: 'Brand / Model', value: [repair.brand, repair.model_name].filter(Boolean).join(' / ') || '-' },
      { label: 'Vehicle Type', value: textOrDash(repair.vehicle_type || 'Car') },
      { label: 'KM Reading', value: repair.km_reading ? `${repair.km_reading} km` : '-' },
    ];

    const halfW = cw / 2;
    const innerW = halfW - 24;
    const allRows = Math.max(leftCol.length, rightCol.length);
    let maxH = 0;
    const rowHeights = [];
    for (let i = 0; i < allRows; i++) {
      const lh = leftCol[i] ? measureText(doc, leftCol[i].value, innerW, 'Helvetica-Bold', 10) + 24 : 0;
      const rh = rightCol[i] ? measureText(doc, rightCol[i].value, innerW, 'Helvetica-Bold', 10) + 24 : 0;
      const rh2 = Math.max(38, lh, rh);
      rowHeights.push(rh2);
      maxH += rh2;
    }

    ensureSpace(maxH + 2);
    const startY = doc.y;

    // Left column header
    doc.save();
    doc.rect(ml, startY, halfW, 24).fill(C.teal);
    doc.restore();
    doc.font('Helvetica-Bold').fontSize(8).fillColor(C.white)
      .text('BILLING DETAILS', ml + 12, startY + 8, { characterSpacing: 0.8 });

    // Right column header
    doc.save();
    doc.rect(ml + halfW, startY, halfW, 24).fill(C.teal);
    doc.restore();
    doc.font('Helvetica-Bold').fontSize(8).fillColor(C.white)
      .text('VEHICLE DETAILS', ml + halfW + 12, startY + 8, { characterSpacing: 0.8 });

    let yy = startY + 24;
    for (let i = 0; i < allRows; i++) {
      const rh = rowHeights[i];
      const lData = leftCol[i];
      const rData = rightCol[i];
      const bgC = i % 2 ? C.surface : C.white;

      if (lData) {
        doc.save();
        doc.rect(ml, yy, halfW, rh).fillAndStroke(bgC, C.border);
        doc.moveTo(ml + halfW, yy).lineTo(ml + halfW, yy + rh).lineWidth(1).strokeColor(C.border).stroke();
        doc.restore();
        doc.font('Helvetica-Bold').fontSize(7).fillColor(C.teal)
          .text(lData.label.toUpperCase(), ml + 12, yy + 6, { width: innerW, characterSpacing: 0.6 });
        doc.font('Helvetica-Bold').fontSize(10).fillColor(C.text)
          .text(lData.value, ml + 12, yy + 18, { width: innerW, lineGap: 2 });
      }
      if (rData) {
        doc.save();
        doc.rect(ml + halfW, yy, halfW, rh).fillAndStroke(bgC, C.border);
        doc.restore();
        doc.font('Helvetica-Bold').fontSize(7).fillColor(C.teal)
          .text(rData.label.toUpperCase(), ml + halfW + 12, yy + 6, { width: innerW, characterSpacing: 0.6 });
        doc.font('Helvetica-Bold').fontSize(10).fillColor(C.text)
          .text(rData.value, ml + halfW + 12, yy + 18, { width: innerW, lineGap: 2 });
      }
      yy += rh;
    }

    doc.y = yy + 8;
  }

  // ── REPAIR INFO (compact row) ──────────────────────────────────
  function drawRepairInfo() {
    drawSectionTitle('REPAIR & SERVICE DETAILS');

    const infoItems = [
      { label: 'Repair Date', value: fmtDate(repair.repair_date) },
      { label: 'Service Type', value: textOrDash(repair.service_type || 'General') },
      { label: 'Priority', value: textOrDash(repair.priority || 'Medium') },
      { label: 'Technician', value: textOrDash(repair.worker_name || 'Unassigned') },
      { label: 'Expected Completion', value: repair.expected_completion ? fmtDate(repair.expected_completion) : '-' },
    ];

    const cols = infoItems.length;
    const cellW = cw / cols;
    const cellH = 38;

    ensureSpace(cellH + 2);
    const y = doc.y;

    doc.save();
    doc.rect(ml, y, cw, cellH).fillAndStroke(C.surface, C.border);
    doc.restore();

    infoItems.forEach((item, i) => {
      const cx = ml + i * cellW;
      if (i > 0) {
        doc.save();
        doc.moveTo(cx, y + 4).lineTo(cx, y + cellH - 4).lineWidth(1).strokeColor(C.border).stroke();
        doc.restore();
      }
      doc.font('Helvetica-Bold').fontSize(6.5).fillColor(C.teal)
        .text(item.label.toUpperCase(), cx + 8, y + 5, { width: cellW - 16, characterSpacing: 0.8 });
      doc.font('Helvetica-Bold').fontSize(9).fillColor(C.text)
        .text(item.value, cx + 8, y + 17, { width: cellW - 16 });
    });

    doc.y = y + cellH + 10;
  }

  // ── JOB CARD ───────────────────────────────────────────────────
  function drawComplaints() {
    if (!complaintGroups.length) return;
    drawSectionTitle('JOB CARD & COMPLETED WORK');

    complaintGroups.forEach((group) => {
      ensureSpace(20);
      doc.font('Helvetica-Bold').fontSize(9).fillColor(C.tealDark)
        .text(String(group.title).toUpperCase(), ml, doc.y, { characterSpacing: 1 });
      doc.moveDown(0.3);

      group.tasks.forEach((task) => {
        const marker = task.fixed ? '[x]' : '[ ]';
        const text = `${marker} ${task.text}`;
        const rh = Math.max(22, measureText(doc, text, cw - 28, 'Helvetica', 9.5) + 8);

        ensureSpace(rh + 4);
        const ty = doc.y;

        doc.save();
        doc.roundedRect(ml, ty, cw, rh, 4)
          .fillAndStroke(task.fixed ? '#f0fdf4' : C.surface, C.border);
        doc.restore();

        doc.font('Helvetica').fontSize(9.5)
          .fillColor(task.fixed ? C.successText : C.text)
          .text(text, ml + 10, ty + 6, { width: cw - 20, lineGap: 2 });

        doc.y = ty + rh + 4;
      });
      doc.moveDown(0.2);
    });
  }

  // ── ITEMS TABLE ────────────────────────────────────────────────
  function drawItemsTable() {
    drawSectionTitle('SERVICES, PARTS & LABOUR');

    const startX = ml;
    const colW = [32, 268, 42, 82, cw - 32 - 268 - 42 - 82];
    const colX = [startX];
    for (let i = 1; i < colW.length; i++) colX[i] = colX[i - 1] + colW[i - 1];

    function drawTableHeader() {
      const y = doc.y;
      doc.save();
      doc.rect(startX, y, cw, 22).fill(C.tealDark);
      doc.restore();
      const headers = ['#', 'Description', 'Qty', 'Rate', 'Amount'];
      headers.forEach((h, i) => {
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.white)
          .text(h.toUpperCase(), colX[i] + 7, y + 7, { width: colW[i] - 14, align: i === 1 ? 'left' : 'center', characterSpacing: 0.8 });
      });
      doc.y = y + 22;
    }

    drawTableHeader();

    if (!tableRows.length) {
      ensureSpace(30);
      const y = doc.y;
      doc.save();
      doc.rect(startX, y, cw, 30).fillAndStroke(C.white, C.border);
      doc.restore();
      doc.font('Helvetica-Oblique').fontSize(10).fillColor(C.muted)
        .text('No items recorded.', startX, y + 9, { width: cw, align: 'center' });
      doc.y = y + 30;
    } else {
      tableRows.forEach((row, i) => {
        const descH = measureText(doc, row.description, colW[1] - 12, 'Helvetica', 10);
        const rh = Math.max(22, descH + 8);
        if (doc.y + rh > bottomLimit()) { newPage(); drawSectionTitle('SERVICES, PARTS & LABOUR'); drawTableHeader(); }

        const y = doc.y;
        doc.save();
        doc.rect(startX, y, cw, rh)
          .fillAndStroke(row.isService ? C.tealLight : (i % 2 ? C.surface : C.white), C.border);
        for (let ci = 1; ci < colX.length; ci++) {
          doc.moveTo(colX[ci], y).lineTo(colX[ci], y + rh).lineWidth(1).strokeColor(C.border).stroke();
        }
        doc.restore();

        const vals = [String(row.index), row.description, String(row.qty), fmt(symbol, row.rate), fmt(symbol, row.amount)];
        vals.forEach((v, vi) => {
          doc.font(vi === 1 || vi === 4 ? 'Helvetica-Bold' : 'Helvetica').fontSize(9.5)
            .fillColor(row.isService ? C.tealDark : C.text)
            .text(v, colX[vi] + 7, y + 6, { width: colW[vi] - 14, align: vi === 1 ? 'left' : 'center', lineGap: 2 });
        });
        doc.y = y + rh;
      });
    }

    ensureSpace(22);
    const ny = doc.y;
    doc.save();
    doc.rect(startX, ny, cw, 22).fillAndStroke(C.surface, C.border);
    doc.restore();
    doc.font('Helvetica-Oblique').fontSize(8).fillColor(C.muted)
      .text(`All amounts in ${currency || 'INR'}. Inclusive taxes absorbed in line pricing.`, startX + 10, ny + 6, { width: cw - 20 });
    doc.y = ny + 26;
  }

  // ── SUMMARY ────────────────────────────────────────────────────
  function drawSummary() {
    drawSectionTitle('INVOICE SUMMARY');

    const gap = 14;
    const leftW = 280;
    const rightW = cw - leftW - gap;

    const summaryLines = [];
    summaryLines.push({ label: 'Parts Subtotal', value: fmt(symbol, partsSubtotal) });
    if (serviceCharge > 0) summaryLines.push({ label: 'Service / Labour', value: fmt(symbol, serviceCharge) });
    taxSnapshot.forEach((tax) => {
      summaryLines.push({
        label: `${textOrDash(tax?.name)} @ ${Number(tax?.rate || 0)}%${tax?.is_inclusive ? ' (Incl.)' : ''}`,
        value: `${tax?.is_inclusive ? '' : '+'}${fmt(symbol, Number(tax?.amount || 0))}`,
      });
    });
    if (totalTax > 0) summaryLines.push({ label: 'Total Tax', value: fmt(symbol, totalTax) });

    const wordsH = measureText(doc, amountInWords, leftW - 24, 'Helvetica-Bold', 10) + 32;
    const linesH = summaryLines.length * 20 + 34;
    const boxH = Math.max(64, wordsH, linesH);

    ensureSpace(boxH + 6);

    const sy = doc.y;
    // Left box — Amount in Words
    doc.save();
    doc.roundedRect(ml, sy, leftW, boxH, 6).fillAndStroke(C.tealLight, C.border);
    doc.restore();
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.tealDark)
      .text('AMOUNT IN WORDS', ml + 12, sy + 8, { characterSpacing: 0.8 });
    doc.font('Helvetica-Bold').fontSize(10).fillColor(C.text)
      .text(amountInWords, ml + 12, sy + 22, { width: leftW - 24, lineGap: 2 });

    // Right box — Summary lines
    const rx = ml + leftW + gap;
    doc.save();
    doc.roundedRect(rx, sy, rightW, boxH, 6).fillAndStroke(C.white, C.border);
    doc.restore();

    let ly = sy + 6;
    summaryLines.forEach((line) => {
      doc.font('Helvetica').fontSize(9).fillColor(C.muted)
        .text(line.label, rx + 10, ly + 2, { width: rightW - 88 });
      doc.font('Helvetica-Bold').fontSize(9).fillColor(C.text)
        .text(line.value, rx + rightW - 78, ly + 2, { width: 68, align: 'right' });
      ly += 20;
    });

    // Grand total box in the right box
    const gtBoxH = 30;
    const gtY = sy + boxH - gtBoxH - 4;
    doc.save();
    doc.roundedRect(rx + 2, gtY, rightW - 4, gtBoxH, 5).fill(C.tealDark);
    doc.restore();
    doc.font('Helvetica-Bold').fontSize(8).fillColor(C.whiteMuted)
      .text('GRAND TOTAL', rx + 12, gtY + 3, { characterSpacing: 0.8 });
    doc.font('Helvetica-Bold').fontSize(13).fillColor(C.white)
      .text(fmt(symbol, grandTotal), rx + rightW - 104, gtY + 4, { width: 92, align: 'right' });

    doc.y = sy + boxH + 10;
  }

  // ── PAYMENT BANNER ─────────────────────────────────────────────
  function drawPaymentBanner() {
    ensureSpace(54);

    const y = doc.y;
    const tone = isPaid
      ? { fill: C.successBg, text: C.successText, border: '#6ee7b7' }
      : { fill: C.warnBg, text: C.warnText, border: '#fcd34d' };

    doc.save();
    doc.roundedRect(ml, y, cw, 52, 8).fillAndStroke(tone.fill, tone.border);
    doc.restore();

    const payMethod = bill?.payment_method ? ` via ${bill.payment_method}` : '';
    doc.font('Helvetica-Bold').fontSize(9).fillColor(tone.text)
      .text(isPaid ? 'PAYMENT RECEIVED' : 'PAYMENT PENDING', ml + 14, y + 8, { characterSpacing: 1 });
    doc.font('Helvetica').fontSize(9).fillColor(tone.text)
      .text(
        isPaid
          ? `This invoice has been fully settled.${payMethod}`
          : 'Please present this document at the time of payment.',
        ml + 14, y + 24,
        { width: cw - 170 }
      );
    doc.font('Helvetica-Bold').fontSize(14).fillColor(tone.text)
      .text(fmt(symbol, grandTotal), doc.page.width - mr - 150, y + 16, { width: 136, align: 'right' });

    doc.y = y + 62;
  }

  // ── TERMS ──────────────────────────────────────────────────────
  function drawTerms() {
    const terms = [
      'This invoice is computer-generated and valid without a physical signature.',
      'Payment is due within 7 days from the date of invoice.',
      'Goods once sold or services rendered will not be reversed without prior written approval.',
      'The workshop is not responsible for any loss, theft, or damage to the vehicle after delivery.',
      'All disputes are subject to local jurisdiction only.',
    ];

    const titleH = 14;
    const listH = terms.reduce((s, t) => s + measureText(doc, `- ${t}`, cw - 24, 'Helvetica', 8.5) + 4, 0);
    const boxH = titleH + listH + 16;

    ensureSpace(boxH);

    const y = doc.y;
    doc.save();
    doc.roundedRect(ml, y, cw, boxH, 6).fillAndStroke(C.surface, C.border);
    doc.restore();

    doc.font('Helvetica-Bold').fontSize(8).fillColor(C.tealDark)
      .text('TERMS & CONDITIONS', ml + 14, y + 8, { characterSpacing: 0.8 });

    let ly = y + 24;
    terms.forEach((term) => {
      const h = measureText(doc, `- ${term}`, cw - 28, 'Helvetica', 8.5);
      doc.font('Helvetica').fontSize(8.5).fillColor(C.muted)
        .text(`- ${term}`, ml + 14, ly, { width: cw - 28, lineGap: 2 });
      ly += h + 4;
    });

    doc.y = y + boxH + 6;
  }

  // ── FOOTERS ────────────────────────────────────────────────────
  function drawFooters() {
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      const fy = doc.page.height - 24;

      doc.save();
      doc.moveTo(ml, fy - 8).lineTo(doc.page.width - mr, fy - 8).lineWidth(1).strokeColor(C.border).stroke();
      doc.restore();

      doc.font('Helvetica').fontSize(7.5).fillColor(C.muted)
        .text(textOrDash(repair.shop_name), ml, fy + 2, { width: 150 });
      doc.text(textOrDash(repair.shop_phone), ml + 155, fy + 2, { width: 120, align: 'center' });
      doc.text(`Invoice ${invoiceNumber}`, ml + 280, fy + 2, { width: 120, align: 'center' });
      doc.text(`Page ${i + 1} of ${range.count}`, doc.page.width - mr - 110, fy + 2, { width: 110, align: 'right' });
    }
  }

  // ── Assemble ───────────────────────────────────────────────────
  drawHeader();
  drawBillingVehicleInfo();
  drawRepairInfo();
  drawComplaints();
  drawItemsTable();
  drawSummary();
  drawPaymentBanner();
  drawTerms();
  drawFooters();

  doc.end();
  return pdfPromise;
}

exports.generatePDF = async (req, res) => {
  const { id } = req.params;
  const action = req.query.action || 'download';
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';

  try {
    const repairRes = await db.query(`
      SELECT r.*,
             s.name AS shop_name,
             s.location,
             s.address AS shop_address,
             s.city AS shop_city,
             s.state AS shop_state,
             s.country AS shop_country,
             s.currency,
             s.phone AS shop_phone,
             s.owner_name AS shop_owner_name,
             s.owner_phone AS shop_owner_phone,
             aw.name AS worker_name
      FROM repairs r
      JOIN shops s ON s.id = r.shop_id
      LEFT JOIN users aw ON aw.id = r.attending_worker_id
      WHERE r.id = $1
    `, [id]);

    if (repairRes.rows.length === 0) {
      return res.status(404).json({ error: 'Repair not found' });
    }

    const repair = repairRes.rows[0];
    if (!isSuperAdmin && repair.shop_id !== shopId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const billRes = await db.query(
      'SELECT * FROM repair_bills WHERE repair_id = $1 AND deleted_at IS NULL ORDER BY id DESC LIMIT 1',
      [id]
    );

    const bill = billRes.rows[0] || null;
    const currency = repair.currency || 'INR';
    const invoiceNumber = `INV-${String(bill?.id || id).padStart(6, '0')}`;
    const pdfBuffer = await buildInvoicePdf(repair, bill, currency, invoiceNumber);

    if (action === 'store') {
      const safeVehicle = sanitizeFilePart(repair.vehicle_number, 'UNKNOWN');
      const filename = `invoice_${safeVehicle}_${Date.now()}.pdf`;

      try {
        const url = await uploadToR2(pdfBuffer, filename, 'application/pdf', `attachment; filename="${filename}"`);
        return res.status(200).json({ success: true, url });
      } catch (error) {
        console.error('R2 upload error:', error);
        return res.status(500).json({ error: 'Failed to upload generated PDF' });
      }
    }

    const safeVehicle = sanitizeFilePart(repair.vehicle_number, 'invoice');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${safeVehicle}_${id}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.end(pdfBuffer);
  } catch (error) {
    console.error('generatePDF Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  }
};
