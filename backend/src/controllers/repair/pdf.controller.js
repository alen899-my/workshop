const PDFDocument = require('pdfkit');
const db = require('../../config/db');
const { uploadToR2 } = require('../../middleware/upload');

const COLORS = {
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
  whiteMuted: '#d5e4e3'
};

function fmtDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getFullYear())
  ].join('.');
}

function currSymbol(code) {
  const map = {
    INR: 'Rs. ',
    USD: '$',
    EUR: 'EUR ',
    GBP: 'GBP ',
    AED: 'AED '
  };

  return map[code] || `${code || 'INR'} `;
}

function fmt(sym, value) {
  const amount = Number(value || 0);
  return `${sym}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function numberToWords(amount, currCode = 'INR') {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
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
  if (fraction > 0) {
    words += ` and ${toWords(fraction).trim()} Paise`;
  }

  return `${words} Only`;
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  return [];
}

function parseComplaints(raw) {
  if (!raw) return [];

  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return typeof raw === 'string'
      ? [{ type: 'General', tasks: [{ text: raw, fixed: false }] }]
      : [];
  }
}

function normalizeComplaintGroups(raw) {
  return parseComplaints(raw)
    .map((entry) => {
      if (entry && typeof entry === 'object' && Array.isArray(entry.tasks)) {
        return {
          title: String(entry.type || 'Job').trim() || 'Job',
          tasks: entry.tasks
            .map((task) => ({
              text: String(task?.text || '').trim(),
              fixed: Boolean(task?.fixed)
            }))
            .filter((task) => task.text)
        };
      }

      if (typeof entry === 'string' && entry.trim()) {
        return {
          title: 'Notes',
          tasks: [{ text: entry.trim(), fixed: false }]
        };
      }

      if (entry && typeof entry === 'object' && String(entry.text || '').trim()) {
        return {
          title: 'Notes',
          tasks: [{
            text: String(entry.text).trim(),
            fixed: Boolean(entry.fixed)
          }]
        };
      }

      return null;
    })
    .filter((group) => group && group.tasks.length > 0);
}

function textOrDash(value) {
  const text = String(value ?? '').trim();
  return text || '-';
}

function joinText(parts, separator = ' / ') {
  const values = parts
    .map((part) => String(part || '').trim())
    .filter(Boolean);

  return values.length ? values.join(separator) : '-';
}

function sanitizeFilePart(value, fallback = 'invoice') {
  const cleaned = String(value || '')
    .trim()
    .replace(/[^\w-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  return cleaned || fallback;
}

function collectPdfBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

function drawBadge(doc, text, x, y, tone) {
  const badgeText = textOrDash(text).toUpperCase();
  const paddingX = 8;
  const paddingY = 4;

  doc.font('Helvetica-Bold').fontSize(8);
  const width = doc.widthOfString(badgeText) + paddingX * 2;
  const height = 18;

  doc.save();
  doc.roundedRect(x, y, width, height, 9)
    .fillAndStroke(tone.fill, tone.stroke);
  doc.fillColor(tone.text)
    .text(badgeText, x, y + paddingY + 1, {
      width,
      align: 'center'
    });
  doc.restore();

  return width;
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
      Producer: 'PDFKit'
    }
  });

  const pdfPromise = collectPdfBuffer(doc);
  const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const bottomLimit = () => doc.page.height - doc.page.margins.bottom - 12;
  const symbol = currSymbol(currency);
  const billItems = parseJsonArray(bill?.items);
  const taxSnapshot = parseJsonArray(bill?.tax_snapshot);
  const serviceCharge = Number(bill?.service_charge || 0);
  const partsSubtotal = billItems.reduce(
    (sum, item) => sum + (Number(item?.cost || 0) * Number(item?.qty || 0)),
    0
  );
  const subtotalBeforeTax = Number(bill?.subtotal_before_tax || (partsSubtotal + serviceCharge));
  const taxTotal = Number(
    bill?.tax_total
      || taxSnapshot.reduce((sum, item) => sum + Number(item?.amount || 0), 0)
  );
  const exclusiveTaxTotal = taxSnapshot.reduce((sum, item) => {
    return sum + (item?.is_inclusive ? 0 : Number(item?.amount || 0));
  }, 0);
  const grandTotal = Number(bill?.total_amount || (subtotalBeforeTax + exclusiveTaxTotal));
  const paymentStatus = textOrDash(bill?.payment_status || repair.payment_status || 'Unpaid');
  const isPaid = paymentStatus.toLowerCase() === 'paid';
  const amountInWords = numberToWords(grandTotal, currency);
  const complaintGroups = normalizeComplaintGroups(repair.complaints);
  const printedAt = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const pageTitleWidth = 180;
  const pageTone = isPaid
    ? { fill: COLORS.successBg, stroke: '#6ee7b7', text: COLORS.successText }
    : { fill: COLORS.warnBg, stroke: '#fcd34d', text: COLORS.warnText };

  const metaItems = [
    { label: 'Invoice No.', value: invoiceNumber },
    { label: 'Service Date', value: fmtDate(repair.repair_date) },
    { label: 'Job Status', value: textOrDash(repair.status || 'Pending') },
    { label: 'Service Type', value: textOrDash(repair.service_type || 'General') },
    { label: 'Technician', value: textOrDash(repair.worker_name || 'Unassigned') }
  ];

  const detailRows = [
    {
      left: { label: 'Billed To', value: textOrDash(repair.owner_name) },
      right: { label: 'Invoice No', value: invoiceNumber }
    },
    {
      left: { label: 'Phone', value: textOrDash(repair.phone_number) },
      right: { label: 'Service Date', value: fmtDate(repair.repair_date) }
    },
    {
      left: { label: 'Vehicle', value: textOrDash(repair.vehicle_number) },
      right: { label: 'Technician', value: textOrDash(repair.worker_name || 'Unassigned') }
    },
    {
      left: { label: 'Model / Type', value: joinText([repair.model_name, repair.vehicle_type]) },
      right: { label: 'Payment', value: `${paymentStatus} (Job #${repair.id})` }
    }
  ];

  const summaryLines = [
    { label: 'Parts Subtotal', value: fmt(symbol, partsSubtotal) }
  ];

  if (serviceCharge > 0) {
    summaryLines.push({ label: 'Service / Labour', value: fmt(symbol, serviceCharge) });
  }

  taxSnapshot.forEach((tax) => {
    summaryLines.push({
      label: `${textOrDash(tax?.name)} @ ${Number(tax?.rate || 0)}%${tax?.is_inclusive ? ' (Incl.)' : ''}`,
      value: fmt(symbol, Number(tax?.amount || 0))
    });
  });

  if (taxTotal > 0) {
    summaryLines.push({ label: 'Total Tax', value: fmt(symbol, taxTotal) });
  }

  const tableRows = billItems.map((item, index) => ({
    index: index + 1,
    description: textOrDash(item?.name),
    qty: Number(item?.qty || 0),
    rate: Number(item?.cost || 0),
    amount: Number(item?.cost || 0) * Number(item?.qty || 0)
  }));

  if (serviceCharge > 0) {
    tableRows.push({
      index: tableRows.length + 1,
      description: 'Labour / Service Charge',
      qty: 1,
      rate: serviceCharge,
      amount: serviceCharge,
      isService: true
    });
  }

  function measureText(text, width, font = 'Helvetica', size = 10) {
    doc.font(font).fontSize(size);
    return doc.heightOfString(textOrDash(text), {
      width,
      lineGap: 2
    });
  }

  function addContinuationHeader() {
    doc.save();
    doc.rect(0, 0, doc.page.width, 54).fill(COLORS.tealDark);
    doc.fillColor(COLORS.white)
      .font('Helvetica-Bold')
      .fontSize(14)
      .text(textOrDash(repair.shop_name), doc.page.margins.left, 18, {
        width: 260
      });
    doc.font('Helvetica')
      .fontSize(9)
      .fillColor(COLORS.whiteMuted)
      .text(`Invoice ${invoiceNumber}`, 0, 20, {
        align: 'right',
        width: doc.page.width - doc.page.margins.right
      });
    doc.restore();
    doc.y = 72;
  }

  function newPage() {
    doc.addPage();
    addContinuationHeader();
  }

  function ensureSpace(height) {
    if (doc.y + height > bottomLimit()) {
      newPage();
    }
  }

  function drawSectionTitle(title) {
    ensureSpace(26);
    const y = doc.y;

    doc.save();
    doc.rect(doc.page.margins.left, y + 4, 4, 14).fill(COLORS.accent);
    doc.fillColor(COLORS.tealDark)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(title, doc.page.margins.left + 12, y + 1, {
        characterSpacing: 0.8
      });
    doc.restore();

    doc.y = y + 24;
  }

  function drawHeader() {
    const x = doc.page.margins.left;
    const metaTop = 122;
    const metaHeight = 46;
    const metaCellWidth = contentWidth / metaItems.length;

    doc.save();
    doc.rect(0, 0, doc.page.width, 118).fill(COLORS.tealDark);
    doc.rect(0, 118, doc.page.width, 4).fill(COLORS.accent);
    doc.restore();

    doc.fillColor(COLORS.white)
      .font('Helvetica-Bold')
      .fontSize(22)
      .text(textOrDash(repair.shop_name), x, 30, {
        width: 290
      });

    doc.font('Helvetica')
      .fontSize(10)
      .fillColor(COLORS.whiteMuted)
      .text('Automotive Service Center', x, 58);

    const detailLines = [repair.location, repair.shop_phone].filter(Boolean);
    detailLines.forEach((line, index) => {
      doc.text(String(line).trim(), x, 76 + (index * 14), {
        width: 300
      });
    });

    doc.font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(COLORS.whiteMuted)
      .text('TAX INVOICE', doc.page.width - doc.page.margins.right - pageTitleWidth, 30, {
        width: pageTitleWidth,
        align: 'right',
        characterSpacing: 1.1
      });

    doc.font('Helvetica-Bold')
      .fontSize(20)
      .fillColor(COLORS.white)
      .text(invoiceNumber, doc.page.width - doc.page.margins.right - pageTitleWidth, 44, {
        width: pageTitleWidth,
        align: 'right'
      });

    doc.font('Helvetica')
      .fontSize(9)
      .fillColor(COLORS.whiteMuted)
      .text(`Date: ${fmtDate(repair.repair_date)}`, doc.page.width - doc.page.margins.right - pageTitleWidth, 70, {
        width: pageTitleWidth,
        align: 'right'
      })
      .text(`Printed: ${printedAt}`, doc.page.width - doc.page.margins.right - pageTitleWidth, 84, {
        width: pageTitleWidth,
        align: 'right'
      });

    let badgeX = x;
    const badgeY = 96;
    badgeX += drawBadge(doc, repair.status || 'Pending', badgeX, badgeY, {
      fill: '#335f63',
      stroke: '#4f8487',
      text: COLORS.white
    }) + 8;
    badgeX += drawBadge(doc, paymentStatus, badgeX, badgeY, pageTone) + 8;

    if (repair.service_type) {
      drawBadge(doc, repair.service_type, badgeX, badgeY, {
        fill: '#335f63',
        stroke: '#4f8487',
        text: COLORS.white
      });
    }

    doc.save();
    doc.rect(0, metaTop, doc.page.width, metaHeight).fill(COLORS.tealLight);
    doc.restore();

    metaItems.forEach((item, index) => {
      const cellX = x + (index * metaCellWidth);
      if (index > 0) {
        doc.save();
        doc.moveTo(cellX, metaTop + 8)
          .lineTo(cellX, metaTop + metaHeight - 8)
          .lineWidth(1)
          .strokeColor('#b6d8d5')
          .stroke();
        doc.restore();
      }

      doc.font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor(COLORS.tealDark)
        .text(item.label.toUpperCase(), cellX + 10, metaTop + 8, {
          width: metaCellWidth - 20,
          characterSpacing: 0.8
        });

      doc.font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(COLORS.text)
        .text(item.value, cellX + 10, metaTop + 22, {
          width: metaCellWidth - 20
        });
    });

    doc.y = metaTop + metaHeight + 20;
  }

  function drawDetailRows() {
    drawSectionTitle('BILLING AND VEHICLE INFORMATION');

    const boxWidth = contentWidth;
    const halfWidth = boxWidth / 2;
    const innerWidth = halfWidth - 24;

    detailRows.forEach((row, index) => {
      const leftHeight = measureText(row.left.value, innerWidth, 'Helvetica-Bold', 11) + 22;
      const rightHeight = measureText(row.right.value, innerWidth, 'Helvetica-Bold', 11) + 22;
      const rowHeight = Math.max(44, leftHeight, rightHeight);

      ensureSpace(rowHeight + 2);

      const y = doc.y;
      doc.save();
      doc.rect(doc.page.margins.left, y, boxWidth, rowHeight)
        .fillAndStroke(index % 2 ? COLORS.surface : COLORS.white, COLORS.border);
      doc.moveTo(doc.page.margins.left + halfWidth, y)
        .lineTo(doc.page.margins.left + halfWidth, y + rowHeight)
        .lineWidth(1)
        .strokeColor(COLORS.border)
        .stroke();
      doc.restore();

      [
        { ...row.left, x: doc.page.margins.left + 12 },
        { ...row.right, x: doc.page.margins.left + halfWidth + 12 }
      ].forEach((cell) => {
        doc.font('Helvetica-Bold')
          .fontSize(7.5)
          .fillColor(COLORS.teal)
          .text(cell.label.toUpperCase(), cell.x, y + 8, {
            width: innerWidth,
            characterSpacing: 0.6
          });

        doc.font('Helvetica-Bold')
          .fontSize(11)
          .fillColor(COLORS.text)
          .text(cell.value, cell.x, y + 20, {
            width: innerWidth,
            lineGap: 2
          });
      });

      doc.y = y + rowHeight;
    });

    doc.moveDown(0.8);
  }

  function drawComplaints() {
    if (!complaintGroups.length) return;

    drawSectionTitle('JOB CARD AND INSTRUCTIONS');

    complaintGroups.forEach((group) => {
      ensureSpace(22);
      doc.font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(COLORS.tealDark)
        .text(String(group.title).toUpperCase(), doc.page.margins.left, doc.y, {
          characterSpacing: 1
        });
      doc.moveDown(0.35);

      group.tasks.forEach((task) => {
        const marker = task.fixed ? '[x]' : '[ ]';
        const text = `${marker} ${task.text}`;
        const rowHeight = Math.max(24, measureText(text, contentWidth - 28, 'Helvetica', 10) + 10);

        ensureSpace(rowHeight + 4);
        const y = doc.y;

        doc.save();
        doc.roundedRect(doc.page.margins.left, y, contentWidth, rowHeight, 5)
          .fillAndStroke(task.fixed ? '#f0fdf4' : COLORS.surface, COLORS.border);
        doc.restore();

        doc.font('Helvetica')
          .fontSize(10)
          .fillColor(task.fixed ? COLORS.successText : COLORS.text)
          .text(text, doc.page.margins.left + 10, y + 7, {
            width: contentWidth - 20,
            lineGap: 2
          });

        doc.y = y + rowHeight + 4;
      });

      doc.moveDown(0.25);
    });
  }

  function drawItemsTable() {
    drawSectionTitle('SERVICES, PARTS AND LABOUR');

    const startX = doc.page.margins.left;
    const colWidths = [36, 253, 46, 90, contentWidth - 36 - 253 - 46 - 90];
    const colXs = [
      startX,
      startX + colWidths[0],
      startX + colWidths[0] + colWidths[1],
      startX + colWidths[0] + colWidths[1] + colWidths[2],
      startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3]
    ];

    function drawTableHeader() {
      const y = doc.y;

      doc.save();
      doc.rect(startX, y, contentWidth, 24).fill(COLORS.tealDark);
      doc.restore();

      const headers = ['#', 'Description', 'Qty', 'Unit Rate', 'Amount'];

      headers.forEach((header, index) => {
        doc.font('Helvetica-Bold')
          .fontSize(8)
          .fillColor(COLORS.white)
          .text(
            header.toUpperCase(),
            colXs[index] + 8,
            y + 8,
            {
              width: colWidths[index] - 12,
              align: index === 1 ? 'left' : 'center',
              characterSpacing: 0.8
            }
          );
      });

      doc.y = y + 24;
    }

    drawTableHeader();

    if (!tableRows.length) {
      ensureSpace(32);
      const y = doc.y;
      doc.save();
      doc.rect(startX, y, contentWidth, 32).fillAndStroke(COLORS.white, COLORS.border);
      doc.restore();
      doc.font('Helvetica-Oblique')
        .fontSize(10)
        .fillColor(COLORS.muted)
        .text('No items recorded for this repair.', startX, y + 10, {
          width: contentWidth,
          align: 'center'
        });
      doc.y = y + 32;
    } else {
      tableRows.forEach((row, index) => {
        const descHeight = measureText(row.description, colWidths[1] - 12, 'Helvetica', 10);
        const rowHeight = Math.max(24, descHeight + 10);

        if (doc.y + rowHeight > bottomLimit()) {
          newPage();
          drawSectionTitle('SERVICES, PARTS AND LABOUR');
          drawTableHeader();
        }

        const y = doc.y;
        doc.save();
        doc.rect(startX, y, contentWidth, rowHeight)
          .fillAndStroke(
            row.isService ? COLORS.tealLight : (index % 2 ? COLORS.surface : COLORS.white),
            COLORS.border
          );
        colXs.slice(1).forEach((lineX) => {
          doc.moveTo(lineX, y)
            .lineTo(lineX, y + rowHeight)
            .lineWidth(1)
            .strokeColor(COLORS.border)
            .stroke();
        });
        doc.restore();

        const values = [
          String(row.index),
          row.description,
          String(row.qty),
          fmt(symbol, row.rate),
          fmt(symbol, row.amount)
        ];

        values.forEach((value, valueIndex) => {
          doc.font(valueIndex === 1 || valueIndex === 4 ? 'Helvetica-Bold' : 'Helvetica')
            .fontSize(10)
            .fillColor(row.isService ? COLORS.tealDark : COLORS.text)
            .text(
              value,
              colXs[valueIndex] + 8,
              y + 7,
              {
                width: colWidths[valueIndex] - 12,
                align: valueIndex === 1 ? 'left' : 'center',
                lineGap: 2
              }
            );
        });

        doc.y = y + rowHeight;
      });
    }

    ensureSpace(26);
    const noteY = doc.y;
    doc.save();
    doc.rect(startX, noteY, contentWidth, 24).fillAndStroke(COLORS.surface, COLORS.border);
    doc.restore();
    doc.font('Helvetica-Oblique')
      .fontSize(8.5)
      .fillColor(COLORS.muted)
      .text(
        `All amounts are shown in ${currency || 'INR'}. Taxes marked as inclusive are already absorbed in line pricing.`,
        startX + 10,
        noteY + 7,
        {
          width: contentWidth - 20
        }
      );
    doc.y = noteY + 32;
  }

  function drawSummary() {
    drawSectionTitle('INVOICE SUMMARY');

    const gap = 14;
    const wordsWidth = 300;
    const totalsWidth = contentWidth - wordsWidth - gap;
    const wordsTextHeight = measureText(amountInWords, wordsWidth - 24, 'Helvetica-Bold', 11);
    const wordsHeight = Math.max(68, wordsTextHeight + 32);
    const totalsHeight = (summaryLines.length * 22) + 40;
    const boxHeight = Math.max(wordsHeight, totalsHeight);

    ensureSpace(boxHeight + 12);

    const x = doc.page.margins.left;
    const y = doc.y;

    doc.save();
    doc.roundedRect(x, y, wordsWidth, boxHeight, 6)
      .fillAndStroke(COLORS.tealLight, COLORS.border);
    doc.restore();

    doc.font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(COLORS.tealDark)
      .text('AMOUNT IN WORDS', x + 12, y + 10, {
        characterSpacing: 0.8
      });
    doc.font('Helvetica-Bold')
      .fontSize(11)
      .fillColor(COLORS.text)
      .text(amountInWords, x + 12, y + 26, {
        width: wordsWidth - 24,
        lineGap: 2
      });

    const totalsX = x + wordsWidth + gap;
    doc.save();
    doc.roundedRect(totalsX, y, totalsWidth, boxHeight, 6)
      .fillAndStroke(COLORS.white, COLORS.border);
    doc.restore();

    let currentY = y + 8;
    summaryLines.forEach((line) => {
      doc.save();
      doc.moveTo(totalsX, currentY + 18)
        .lineTo(totalsX + totalsWidth, currentY + 18)
        .lineWidth(1)
        .strokeColor(COLORS.border)
        .stroke();
      doc.restore();

      doc.font('Helvetica')
        .fontSize(9.5)
        .fillColor(COLORS.muted)
        .text(line.label, totalsX + 12, currentY + 4, {
          width: totalsWidth - 92
        });

      doc.font('Helvetica-Bold')
        .fontSize(9.5)
        .fillColor(COLORS.text)
        .text(line.value, totalsX + totalsWidth - 84, currentY + 4, {
          width: 72,
          align: 'right'
        });

      currentY += 22;
    });

    doc.save();
    doc.roundedRect(totalsX + 1, y + boxHeight - 34, totalsWidth - 2, 33, 5)
      .fill(COLORS.tealDark);
    doc.restore();

    doc.font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(COLORS.whiteMuted)
      .text('GRAND TOTAL', totalsX + 12, y + boxHeight - 23, {
        characterSpacing: 0.8
      });

    doc.font('Helvetica-Bold')
      .fontSize(14)
      .fillColor(COLORS.white)
      .text(fmt(symbol, grandTotal), totalsX + totalsWidth - 110, y + boxHeight - 26, {
        width: 98,
        align: 'right'
      });

    doc.y = y + boxHeight + 14;
  }

  function drawPaymentBanner() {
    ensureSpace(60);

    const y = doc.y;
    const amountWidth = 150;
    const tone = isPaid
      ? { fill: COLORS.successBg, text: COLORS.successText, border: '#6ee7b7' }
      : { fill: COLORS.warnBg, text: COLORS.warnText, border: '#fcd34d' };

    doc.save();
    doc.roundedRect(doc.page.margins.left, y, contentWidth, 56, 8)
      .fillAndStroke(tone.fill, tone.border);
    doc.restore();

    doc.font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(tone.text)
      .text(isPaid ? 'PAYMENT RECEIVED' : 'PAYMENT PENDING', doc.page.margins.left + 14, y + 12, {
        characterSpacing: 1
      });

    doc.font('Helvetica')
      .fontSize(9)
      .fillColor(tone.text)
      .text(
        isPaid
          ? 'This invoice has been fully settled.'
          : 'Please present this document at the time of payment.',
        doc.page.margins.left + 14,
        y + 28,
        {
          width: contentWidth - amountWidth - 40
        }
      );

    doc.font('Helvetica-Bold')
      .fontSize(15)
      .fillColor(tone.text)
      .text(fmt(symbol, grandTotal), doc.page.width - doc.page.margins.right - amountWidth, y + 18, {
        width: amountWidth,
        align: 'right'
      });

    doc.y = y + 68;
  }

  function drawTerms() {
    const terms = [
      'This invoice is computer-generated and valid without a physical signature unless otherwise stated.',
      'Payment is due within 7 days from the date of invoice.',
      'Goods once sold or services rendered will not be reversed without prior written approval.',
      'The workshop is not responsible for any loss, theft, or damage to the vehicle after delivery.',
      'All disputes are subject to local jurisdiction only.'
    ];

    const titleHeight = 14;
    const listHeight = terms.reduce(
      (sum, term) => sum + measureText(`- ${term}`, contentWidth - 24, 'Helvetica', 9) + 5,
      0
    );
    const boxHeight = titleHeight + listHeight + 20;

    ensureSpace(boxHeight);

    const y = doc.y;
    doc.save();
    doc.roundedRect(doc.page.margins.left, y, contentWidth, boxHeight, 6)
      .fillAndStroke(COLORS.surface, COLORS.border);
    doc.restore();

    doc.font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(COLORS.tealDark)
      .text('TERMS AND CONDITIONS', doc.page.margins.left + 12, y + 12, {
        characterSpacing: 0.8
      });

    let currentY = y + 30;
    terms.forEach((term) => {
      const height = measureText(`- ${term}`, contentWidth - 24, 'Helvetica', 9);
      doc.font('Helvetica')
        .fontSize(9)
        .fillColor(COLORS.muted)
        .text(`- ${term}`, doc.page.margins.left + 12, currentY, {
          width: contentWidth - 24,
          lineGap: 2
        });
      currentY += height + 5;
    });

    doc.y = y + boxHeight + 8;
  }

  function drawFooters() {
    const range = doc.bufferedPageRange();

    for (let index = 0; index < range.count; index += 1) {
      doc.switchToPage(index);
      const footerY = doc.page.height - 26;

      doc.save();
      doc.moveTo(doc.page.margins.left, footerY - 8)
        .lineTo(doc.page.width - doc.page.margins.right, footerY - 8)
        .lineWidth(1)
        .strokeColor(COLORS.border)
        .stroke();
      doc.restore();

      doc.font('Helvetica')
        .fontSize(8)
        .fillColor(COLORS.muted)
        .text(textOrDash(repair.shop_name), doc.page.margins.left, footerY, {
          width: 160
        });

      doc.text(`Invoice ${invoiceNumber}`, doc.page.margins.left + 170, footerY, {
        width: 150,
        align: 'center'
      });

      doc.text(`Page ${index + 1} of ${range.count}`, doc.page.width - doc.page.margins.right - 120, footerY, {
        width: 120,
        align: 'right'
      });
    }
  }

  drawHeader();
  drawDetailRows();
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
             s.currency,
             s.phone AS shop_phone,
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
        const url = await uploadToR2(
          pdfBuffer,
          filename,
          'application/pdf',
          `attachment; filename="${filename}"`
        );
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
