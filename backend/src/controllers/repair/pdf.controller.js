const PDFDocument = require('pdfkit');
const db = require('../../config/db');
const { uploadToR2 } = require('../../middleware/upload');

// ─────────────────────────────────────────────
//  CONSTANTS & LAYOUT GRID
// ─────────────────────────────────────────────
const PAGE_W      = 595.28;   // A4 pt
const PAGE_H      = 841.89;
const MARGIN      = 50;
const CONTENT_W   = PAGE_W - MARGIN * 2;   // 495.28

// Colour palette – government/official style
const C = {
  headerBg   : '#0A2240',   // deep navy
  headerText : '#FFFFFF',
  accent     : '#0A2240',
  accentLight: '#E8EDF3',   // very light blue tint
  tableHead  : '#1A3A5C',
  tableHeadTx: '#FFFFFF',
  rowAlt     : '#F5F7FA',
  border     : '#B0BEC5',
  bodyText   : '#1C1C1C',
  mutedText  : '#4A5568',
  green      : '#1B7A3E',
  red        : '#B91C1C',
  black      : '#000000',
};

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

/** Thin horizontal rule */
function hRule(doc, y, { color = C.border, width = 0.5, x1 = MARGIN, x2 = PAGE_W - MARGIN } = {}) {
  doc.save()
     .moveTo(x1, y).lineTo(x2, y)
     .strokeColor(color).lineWidth(width).stroke()
     .restore();
}

/** Solid filled rectangle */
function fillRect(doc, x, y, w, h, color) {
  doc.rect(x, y, w, h).fill(color);
}

/** Bordered rectangle (no fill) */
function strokeRect(doc, x, y, w, h, color = C.border, lw = 0.5) {
  doc.rect(x, y, w, h).strokeColor(color).lineWidth(lw).stroke();
}

/** Label + value pair inside an info block */
function labelValue(doc, label, value, x, y, labelW = 110) {
  doc.font('Helvetica-Bold').fontSize(8).fillColor(C.mutedText)
     .text(label.toUpperCase(), x, y, { width: labelW });
  doc.font('Helvetica').fontSize(9).fillColor(C.bodyText)
     .text(value || '—', x + labelW, y, { width: CONTENT_W / 2 - labelW - 10 });
}

/** Safe date formatter */
function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt) ? '—' : dt.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Currency symbol resolver */
function currSymbol(code) {
  const map = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ' };
  return map[code] || (code || '₹');
}

exports.generatePDF = async (req, res) => {
  const { id }    = req.params;
  const action    = req.query.action || 'download';
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';

  try {
    // ── 1. FETCH DATA ────────────────────────────────────────────────────────
    const repairRes = await db.query(`
      SELECT r.*, s.name as shop_name, s.location, s.currency,
             s.phone as shop_phone,
             aw.name as worker_name
      FROM repairs r
      JOIN shops s ON r.shop_id = s.id
      LEFT JOIN users aw ON r.attending_worker_id = aw.id
      WHERE r.id = $1
    `, [id]);


    if (repairRes.rows.length === 0)
      return res.status(404).json({ error: 'Repair not found' });

    const repair = repairRes.rows[0];
    if (!isSuperAdmin && repair.shop_id !== shopId)
      return res.status(403).json({ error: 'Access denied' });

    const billRes = await db.query('SELECT * FROM repair_bills WHERE repair_id = $1', [id]);
    const bill    = billRes.rows[0] || null;

    const curr    = currSymbol(repair.currency);
    const invNo   = `INV-${String(bill?.id || id).padStart(6, '0')}`;

    // ── 2. INIT DOCUMENT ─────────────────────────────────────────────────────
    const doc = new PDFDocument({
      margin : 0,           // we control all margins manually
      size   : 'A4',
      info   : {
        Title   : `Tax Invoice ${invNo}`,
        Author  : repair.shop_name,
        Subject : `Vehicle Repair Invoice – ${repair.vehicle_number}`,
      },
    });

    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));

    // ─────────────────────────────────────────────────────────────────────────
    //  PAGE LAYOUT
    // ─────────────────────────────────────────────────────────────────────────
    //
    //  [HEADER BAND]
    //    Shop name (left)           "TAX INVOICE" (right)
    //  [THIN ACCENT STRIPE]
    //  [DOCUMENT META ROW]  Invoice No | Date | Status
    //  [PARTIES ROW]        Billed To (left)  |  Vehicle Details (right)
    //  [REPAIR SUMMARY BOX]
    //  [ITEMS TABLE]
    //  [TOTALS BLOCK]
    //  [NOTES / T&C]
    //  [FOOTER]
    //
    // ─────────────────────────────────────────────────────────────────────────

    // ── HEADER BAND ──────────────────────────────────────────────────────────
    const HEADER_H = 80;
    fillRect(doc, 0, 0, PAGE_W, HEADER_H, C.headerBg);

    // Shop name + address block (left)
    doc.font('Helvetica-Bold').fontSize(16).fillColor(C.headerText)
       .text(repair.shop_name.toUpperCase(), MARGIN, 18, { width: 280 });
    doc.font('Helvetica').fontSize(8).fillColor('#A8C0D6');
    let hdrSubY = 38;
    if (repair.location) {
      doc.text(repair.location, MARGIN, hdrSubY, { width: 280 });
      hdrSubY += 12;
    }
    if (repair.shop_phone) {
      doc.text(`Tel: ${repair.shop_phone}`, MARGIN, hdrSubY, { width: 180 });
    }


    // "TAX INVOICE" label (right)
    doc.font('Helvetica-Bold').fontSize(22).fillColor(C.headerText)
       .text('TAX INVOICE', PAGE_W - MARGIN - 200, 22, { width: 200, align: 'right' });


    // ── ACCENT STRIPE ────────────────────────────────────────────────────────
    fillRect(doc, 0, HEADER_H, PAGE_W, 4, '#1565C0');

    // ── META ROW (Invoice No / Date / Status) ────────────────────────────────
    const META_Y  = HEADER_H + 4;
    const META_H  = 32;
    fillRect(doc, 0, META_Y, PAGE_W, META_H, C.accentLight);

    const metaCols = [
      { label: 'Invoice No.',  value: invNo },
      { label: 'Invoice Date', value: fmtDate(repair.repair_date) },
      { label: 'Job Status',   value: (repair.status || 'PENDING').toUpperCase() },
      { label: 'Service Type', value: repair.service_type || 'General Repair' },
    ];
    const colW = CONTENT_W / metaCols.length;
    metaCols.forEach((col, i) => {
      const cx = MARGIN + i * colW;
      doc.font('Helvetica-Bold').fontSize(7).fillColor(C.mutedText)
         .text(col.label.toUpperCase(), cx, META_Y + 6, { width: colW - 4 });
      doc.font('Helvetica-Bold').fontSize(9).fillColor(C.accent)
         .text(col.value, cx, META_Y + 16, { width: colW - 4 });
    });

    // ── PARTIES SECTION ───────────────────────────────────────────────────────
    let curY = META_Y + META_H + 14;

    // Section heading
    fillRect(doc, MARGIN, curY, CONTENT_W, 16, C.tableHead);
    doc.font('Helvetica-Bold').fontSize(8).fillColor(C.tableHeadTx)
       .text('BILLING & VEHICLE INFORMATION', MARGIN + 8, curY + 4, { width: CONTENT_W });
    curY += 16;

    // Two-column box
    const PARTY_H   = 80;
    const COL_L_W   = CONTENT_W * 0.5;
    const COL_R_W   = CONTENT_W - COL_L_W;
    const COL_L_X   = MARGIN;
    const COL_R_X   = MARGIN + COL_L_W;

    // Outer border
    strokeRect(doc, MARGIN, curY, CONTENT_W, PARTY_H);
    // Vertical divider
    doc.moveTo(COL_R_X, curY).lineTo(COL_R_X, curY + PARTY_H)
       .strokeColor(C.border).lineWidth(0.5).stroke();

    // Left – Bill To
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.mutedText)
       .text('BILLED TO', COL_L_X + 8, curY + 8);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(C.bodyText)
       .text(repair.owner_name || '—', COL_L_X + 8, curY + 20, { width: COL_L_W - 16 });
    doc.font('Helvetica').fontSize(8.5).fillColor(C.mutedText);
    if (repair.phone_number)
      doc.text(`Phone: ${repair.phone_number}`, COL_L_X + 8, curY + 34, { width: COL_L_W - 16 });
    if (repair.owner_address)
      doc.text(repair.owner_address, COL_L_X + 8, curY + 46, { width: COL_L_W - 16 });

    // Right – Vehicle
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.mutedText)
       .text('VEHICLE DETAILS', COL_R_X + 8, curY + 8);
    doc.font('Helvetica-Bold').fontSize(12).fillColor(C.accent)
       .text(repair.vehicle_number || '—', COL_R_X + 8, curY + 18);

    const vDetails = [
      ['Model',    repair.model_name  || '—'],
      ['Type',     repair.vehicle_type || '—'],
      ['Mechanic', repair.worker_name  || 'Unassigned'],
    ];
    let vY = curY + 34;
    vDetails.forEach(([k, v]) => {
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.mutedText)
         .text(k + ':', COL_R_X + 8, vY, { continued: false, width: 48 });
      doc.font('Helvetica').fontSize(8).fillColor(C.bodyText)
         .text(v, COL_R_X + 58, vY, { width: COL_R_W - 66 });
      vY += 13;
    });

    curY += PARTY_H + 14;

    // ── COMPLAINTS / JOB TASKS SECTION ───────────────────────────────────────
    let parsedComplaints = [];
    try {
      parsedComplaints = typeof repair.complaints === 'string'
        ? JSON.parse(repair.complaints)
        : (repair.complaints || []);
    } catch (_) { parsedComplaints = []; }

    if (Array.isArray(parsedComplaints) && parsedComplaints.length > 0) {
      fillRect(doc, MARGIN, curY, CONTENT_W, 16, C.tableHead);
      doc.font('Helvetica-Bold').fontSize(8).fillColor(C.tableHeadTx)
         .text('JOB CARD — TASKS & INSTRUCTIONS', MARGIN + 8, curY + 4);
      curY += 16;

      strokeRect(doc, MARGIN, curY, CONTENT_W, 1); // top border

      // Render complaints
      const TASK_PADDING = 8;
      let taskY = curY + TASK_PADDING;
      const taskBoxStart = curY;

      parsedComplaints.forEach((block) => {
        if (typeof block === 'object' && Array.isArray(block.tasks)) {
          // Grouped format
          doc.font('Helvetica-Bold').fontSize(8).fillColor(C.accent)
             .text((block.type || 'Job').toUpperCase(), MARGIN + 10, taskY);
          taskY += 12;
          block.tasks.forEach((task) => {
            const done   = !!task.fixed;
            const bullet = done ? '✓' : '○';
            const color  = done ? C.green : C.mutedText;
            doc.font('Helvetica').fontSize(8).fillColor(color)
               .text(`  ${bullet}  ${task.text || '—'}`, MARGIN + 10, taskY, {
                 width: CONTENT_W - 20,
               });
            taskY += 12;
            if (taskY > PAGE_H - 150) { doc.addPage(); taskY = MARGIN; }
          });
          taskY += 4;
        } else {
          // Simple flat entry
          const txt   = typeof block === 'string' ? block : (block.text || '—');
          const done  = typeof block === 'object' ? !!block.fixed : false;
          const bullet = done ? '✓' : '○';
          const color  = done ? C.green : C.mutedText;
          doc.font('Helvetica').fontSize(8).fillColor(color)
             .text(`  ${bullet}  ${txt}`, MARGIN + 10, taskY, { width: CONTENT_W - 20 });
          taskY += 12;
          if (taskY > PAGE_H - 150) { doc.addPage(); taskY = MARGIN; }
        }
      });

      taskY += TASK_PADDING;
      // Draw surrounding box
      strokeRect(doc, MARGIN, taskBoxStart, CONTENT_W, taskY - taskBoxStart);
      curY = taskY + 14;
    }

    if (curY > PAGE_H - 220) { doc.addPage(); curY = MARGIN; }

    // ── ITEMS TABLE ──────────────────────────────────────────────────────────

    // Column widths (total = CONTENT_W = 495.28)
    const COL = {
      sno  : { x: MARGIN,       w: 28,   align: 'center' },
      desc : { x: MARGIN + 28,  w: 210,  align: 'left'   },
      hsn  : { x: MARGIN + 238, w: 60,   align: 'center' },
      qty  : { x: MARGIN + 298, w: 40,   align: 'center' },
      rate : { x: MARGIN + 338, w: 72,   align: 'right'  },
      amt  : { x: MARGIN + 410, w: 85.28,align: 'right'  },
    };

    const ROW_H  = 22;
    const TH_H   = 24;

    // Table header
    fillRect(doc, MARGIN, curY, CONTENT_W, TH_H, C.tableHead);
    doc.font('Helvetica-Bold').fontSize(8).fillColor(C.tableHeadTx);
    const headers = [
      ['sno',  'S.No.'],
      ['desc', 'Description of Goods / Services'],
      ['hsn',  'HSN/SAC'],
      ['qty',  'Qty'],
      ['rate', `Rate (${curr})`],
      ['amt',  `Amount (${curr})`],
    ];
    headers.forEach(([key, label]) => {
      doc.text(label, COL[key].x + 4, curY + 8, {
        width : COL[key].w - 8,
        align : COL[key].align,
      });
    });
    curY += TH_H;

    // Helper: draw one item row
    const drawRow = (rowData, rowIdx) => {
      if (rowIdx % 2 === 1) fillRect(doc, MARGIN, curY, CONTENT_W, ROW_H, C.rowAlt);
      doc.font('Helvetica').fontSize(8.5).fillColor(C.bodyText);
      Object.entries(rowData).forEach(([key, val]) => {
        doc.text(String(val ?? '—'), COL[key].x + 4, curY + 6, {
          width : COL[key].w - 8,
          align : COL[key].align,
        });
      });
      // bottom border
      hRule(doc, curY + ROW_H, { color: C.border, width: 0.3 });
      curY += ROW_H;
      if (curY > PAGE_H - 160) {
        doc.addPage();
        curY = MARGIN;
        // Re-draw table header on new page
        fillRect(doc, MARGIN, curY, CONTENT_W, TH_H, C.tableHead);
        doc.font('Helvetica-Bold').fontSize(8).fillColor(C.tableHeadTx);
        headers.forEach(([key, label]) => {
          doc.text(label, COL[key].x + 4, curY + 8, {
            width : COL[key].w - 8,
            align : COL[key].align,
          });
        });
        curY += TH_H;
      }
    };

    let rowIdx = 0;

    if (bill && Array.isArray(bill.items)) {
      bill.items.forEach((item) => {
        const qty  = Number(item.qty  || 0);
        const rate = Number(item.cost || 0);
        const amt  = qty * rate;
        drawRow({
          sno  : rowIdx + 1,
          desc : item.name || '—',
          hsn  : item.hsn  || '—',
          qty  : qty,
          rate : rate.toFixed(2),
          amt  : amt.toFixed(2),
        }, rowIdx);
        rowIdx++;
      });
    }

    // Labour / service charge row
    if (bill && Number(bill.service_charge) > 0) {
      drawRow({
        sno  : rowIdx + 1,
        desc : 'Labour / Service Charge',
        hsn  : '998714',
        qty  : 1,
        rate : Number(bill.service_charge).toFixed(2),
        amt  : Number(bill.service_charge).toFixed(2),
      }, rowIdx);
      rowIdx++;
    }

    // Outer left + right border of table body
    strokeRect(doc, MARGIN, curY - (rowIdx * ROW_H) - TH_H, CONTENT_W,
                    rowIdx * ROW_H + TH_H + 0.3);

    curY += 10;

    // ── TOTALS BLOCK ─────────────────────────────────────────────────────────
    const TOT_X     = MARGIN + CONTENT_W * 0.55;
    const TOT_W     = CONTENT_W * 0.45;
    const TOT_ROW_H = 18;

    const totalRows = [];
    totalRows.push({ label: 'Subtotal (before tax)', value: Number(bill?.subtotal_before_tax || 0).toFixed(2) });

    if (Array.isArray(bill?.tax_snapshot)) {
      bill.tax_snapshot.forEach((t) => {
        totalRows.push({ label: `${t.name} @ ${t.rate}%`, value: Number(t.amount || 0).toFixed(2) });
      });
    }

    const totalBlockH = totalRows.length * TOT_ROW_H + 30 + 8; // 30 for grand total row + 8 padding
    strokeRect(doc, TOT_X, curY, TOT_W, totalBlockH);

    totalRows.forEach((row, i) => {
      if (i % 2 === 1) fillRect(doc, TOT_X, curY, TOT_W, TOT_ROW_H, C.rowAlt);
      doc.font('Helvetica').fontSize(8.5).fillColor(C.mutedText)
         .text(row.label, TOT_X + 8, curY + 5, { width: TOT_W * 0.6 });
      doc.font('Helvetica').fontSize(8.5).fillColor(C.bodyText)
         .text(`${curr} ${row.value}`, TOT_X + TOT_W * 0.6, curY + 5, {
           width: TOT_W * 0.38, align: 'right',
         });
      hRule(doc, curY + TOT_ROW_H, { x1: TOT_X, x2: TOT_X + TOT_W, color: C.border, width: 0.3 });
      curY += TOT_ROW_H;
    });

    // Grand total row
    fillRect(doc, TOT_X, curY, TOT_W, 30, C.accent);
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C.headerText)
       .text('GRAND TOTAL', TOT_X + 8, curY + 8, { width: TOT_W * 0.55 });
    doc.font('Helvetica-Bold').fontSize(11).fillColor(C.headerText)
       .text(`${curr} ${Number(bill?.total_amount || 0).toFixed(2)}`,
             TOT_X + TOT_W * 0.55, curY + 7, { width: TOT_W * 0.43, align: 'right' });

    curY += 30 + 8; // padding below total block

    // Amount in words (left of totals block)
    const amtWords = numberToWords(Number(bill?.total_amount || 0), repair.currency);
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.mutedText)
       .text('Amount in Words:', MARGIN, curY - 30 + 8);
    doc.font('Helvetica').fontSize(8).fillColor(C.bodyText)
       .text(amtWords, MARGIN, curY - 30 + 20, { width: CONTENT_W * 0.52 });

    curY += 14;

    // ── TERMS & CONDITIONS ───────────────────────────────────────────────────
    if (curY > PAGE_H - 110) { doc.addPage(); curY = MARGIN; }

    fillRect(doc, MARGIN, curY, CONTENT_W, 14, C.accentLight);
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.accent)
       .text('TERMS & CONDITIONS', MARGIN + 6, curY + 3);
    curY += 14;

    const terms = [
      '1. This invoice is computer-generated and valid without signature unless specified.',
      '2. Payment is due within 7 days from the date of invoice.',
      '3. Goods once sold / services rendered will not be reversed without prior approval.',
      '4. The workshop is not responsible for any loss, theft or damage to the vehicle after delivery.',
      '5. All disputes are subject to local jurisdiction only.',
    ];
    strokeRect(doc, MARGIN, curY, CONTENT_W, terms.length * 12 + 8);
    let termY = curY + 6;
    terms.forEach((t) => {
      doc.font('Helvetica').fontSize(7.5).fillColor(C.mutedText)
         .text(t, MARGIN + 8, termY, { width: CONTENT_W - 16 });
      termY += 12;
    });
    curY = termY + 8;

    // ── SIGNATURE BLOCKS ─────────────────────────────────────────────────────
    if (curY > PAGE_H - 80) { doc.addPage(); curY = MARGIN; }
    curY += 10;

    const SIG_W = (CONTENT_W - 20) / 3;
    const sigs  = ['Prepared By', "Customer's Signature", 'Authorised Signatory'];
    sigs.forEach((label, i) => {
      const sx = MARGIN + i * (SIG_W + 10);
      strokeRect(doc, sx, curY, SIG_W, 50, C.border);
      doc.font('Helvetica').fontSize(7.5).fillColor(C.mutedText)
         .text(label, sx, curY + 52, { width: SIG_W, align: 'center' });
    });
    curY += 70;

    // ── FOOTER BAND ──────────────────────────────────────────────────────────
    // Pin footer near page bottom
    const FOOTER_Y = PAGE_H - 32;
    fillRect(doc, 0, FOOTER_Y, PAGE_W, 32, C.headerBg);
    doc.font('Helvetica').fontSize(7.5).fillColor('#A8C0D6')
       .text(
         `${repair.shop_name}  ·  ${repair.location || ''}  ·  ${repair.shop_phone || ''}`,
         MARGIN, FOOTER_Y + 8, { width: PAGE_W * 0.65 }
       );
    doc.font('Helvetica-Bold').fontSize(8).fillColor(C.headerText)
       .text('THANK YOU FOR YOUR BUSINESS', PAGE_W - MARGIN - 170, FOOTER_Y + 8,
             { width: 170, align: 'right' });
    doc.font('Helvetica').fontSize(7).fillColor('#6B8CAE')
       .text(`Generated on ${new Date().toLocaleString('en-IN')}`,
             PAGE_W - MARGIN - 170, FOOTER_Y + 20, { width: 170, align: 'right' });

    // ─────────────────────────────────────────────────────────────────────────
    //  3. STREAM END → RESPOND
    // ─────────────────────────────────────────────────────────────────────────
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(buffers);

      if (action === 'store') {
        try {
          const safeVehicle = (repair.vehicle_number || 'UNKNOWN').replace(/\s+/g, '_');
          const filename    = `receipt_${safeVehicle}_${Date.now()}.pdf`;
          const url = await uploadToR2(pdfBuffer, filename, 'application/pdf', `attachment; filename="${filename}"`);
          return res.status(200).json({ success: true, url });
        } catch (e) {
          console.error('R2 upload error:', e);
          return res.status(500).json({ error: 'Failed to upload generated PDF' });
        }
      } else {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice_${repair.vehicle_number}.pdf`);
        res.setHeader('Content-Length', pdfBuffer.length);
        return res.send(pdfBuffer);
      }
    });

    doc.end();

  } catch (error) {
    console.error('generatePDF Error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────
//  UTILITY: Number → Indian English words
// ─────────────────────────────────────────────
function numberToWords(amount, currCode = 'INR') {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
                'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
                'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function toWords(n) {
    if (n === 0)  return '';
    if (n < 20)   return ones[n] + ' ';
    if (n < 100)  return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '') + ' ';
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred ' + toWords(n % 100);
    if (n < 100000)   return toWords(Math.floor(n / 1000)) + 'Thousand ' + toWords(n % 1000);
    if (n < 10000000) return toWords(Math.floor(n / 100000)) + 'Lakh ' + toWords(n % 100000);
    return toWords(Math.floor(n / 10000000)) + 'Crore ' + toWords(n % 10000000);
  }

  const rupees  = Math.floor(amount);
  const paise   = Math.round((amount - rupees) * 100);
  const currWord = currCode === 'INR' ? 'Rupees' : (currCode || 'Rupees');

  let result = toWords(rupees).trim() + ` ${currWord}`;
  if (paise > 0) result += ` and ${toWords(paise).trim()} Paise`;
  return result + ' Only';
}