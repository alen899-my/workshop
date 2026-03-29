const PDFDocument = require('pdfkit');
const db = require('../../config/db');
const { uploadToR2 } = require('../../middleware/upload');

exports.generatePDF = async (req, res) => {
  const { id } = req.params;
  const action = req.query.action || 'download'; // 'download' or 'store'
  const { role, shopId } = req.user;
  const isSuperAdmin = role === 'super-admin';

  try {
    // 1. Fetch Master Data
    const repairRes = await db.query(`
      SELECT r.*, s.name as shop_name, s.location, aw.name as worker_name
      FROM repairs r
      JOIN shops s ON r.shop_id = s.id
      LEFT JOIN users aw ON r.attending_worker_id = aw.id
      WHERE r.id = $1
    `, [id]);
    
    if (repairRes.rows.length === 0) return res.status(404).json({ error: 'Repair not found' });
    const repair = repairRes.rows[0];

    // Authorization
    if (!isSuperAdmin && repair.shop_id !== shopId) return res.status(403).json({ error: 'Access denied' });

    const billRes = await db.query('SELECT * FROM repair_bills WHERE repair_id = $1', [id]);
    const bill = billRes.rows.length > 0 ? billRes.rows[0] : null;

    // 2. Generate PDF
    const doc = new PDFDocument({ margin: 50 });
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));

    // Headers
    doc.fontSize(20).font('Helvetica-Bold').text(repair.shop_name.toUpperCase(), { align: 'center' });
    if (repair.location) doc.fontSize(10).font('Helvetica').text(repair.location, { align: 'center' });
    if (repair.shop_phone) doc.fontSize(10).text(`Phone: ${repair.shop_phone}`, { align: 'center' });

    doc.moveDown(2);
    doc.fontSize(14).font('Helvetica-Bold').text('REPAIR RECEIPT / JOB CARD', { align: 'center', underline: true });
    doc.moveDown(1.5);

    // Metadata
    const startY = doc.y;
    doc.fontSize(11).font('Helvetica-Bold').text(`Vehicle No: `, 50, startY, { continued: true }).font('Helvetica').text(repair.vehicle_number);
    doc.font('Helvetica-Bold').text(`Owner: `, 50, doc.y, { continued: true }).font('Helvetica').text(repair.owner_name || 'N/A');
    doc.font('Helvetica-Bold').text(`Phone: `, 50, doc.y, { continued: true }).font('Helvetica').text(repair.phone_number || 'N/A');

    // Right side metadata
    doc.font('Helvetica-Bold').text(`Date: `, 300, startY, { continued: true }).font('Helvetica').text(new Date(repair.repair_date).toLocaleDateString());
    doc.font('Helvetica-Bold').text(`Status: `, 300, doc.y, { continued: true }).font('Helvetica').text(repair.status.toUpperCase());
    doc.font('Helvetica-Bold').text(`Worker: `, 300, doc.y, { continued: true }).font('Helvetica').text(repair.worker_name || 'Unassigned');
    
    doc.moveDown(2);
    doc.font('Helvetica-Bold').text('Complaints:', 50, doc.y).font('Helvetica').text(repair.complaints || 'None listed', { indent: 20 });
    
    // Bill Section
    doc.moveDown(2);
    if (bill && (bill.items.length > 0 || bill.service_charge > 0)) {
        doc.font('Helvetica-Bold').text('BILL SUMMARY', 50, doc.y, { underline: true });
        doc.moveDown();

        const tableTop = doc.y;
        doc.font('Helvetica-Bold');
        doc.text('Item Name', 50, tableTop);
        doc.text('Qty', 250, tableTop, { width: 50, align: 'center' });
        doc.text('Unit Cost', 320, tableTop, { width: 80, align: 'right' });
        doc.text('Line Total', 420, tableTop, { width: 80, align: 'right' });
        
        doc.moveTo(50, doc.y + 5).lineTo(500, doc.y + 5).stroke();
        doc.moveDown(1);

        let currentY = doc.y;
        doc.font('Helvetica');
        let subtotal = 0;

        bill.items.forEach(item => {
            const lineTotal = item.cost * item.qty;
            subtotal += lineTotal;
            doc.text(item.name || '-', 50, currentY);
            doc.text(item.qty.toString(), 250, currentY, { width: 50, align: 'center' });
            doc.text(`Rs. ${item.cost.toFixed(2)}`, 320, currentY, { width: 80, align: 'right' });
            doc.text(`Rs. ${lineTotal.toFixed(2)}`, 420, currentY, { width: 80, align: 'right' });
            currentY = doc.y + 5;
        });

        doc.moveTo(50, currentY + 5).lineTo(500, currentY + 5).stroke();
        
        currentY += 15;
        doc.text('Subtotal:', 320, currentY, { width: 80, align: 'right' });
        doc.text(`Rs. ${subtotal.toFixed(2)}`, 420, currentY, { width: 80, align: 'right' });

        currentY += 15;
        doc.text('Service Charge:', 320, currentY, { width: 80, align: 'right' });
        doc.text(`Rs. ${Number(bill.service_charge).toFixed(2)}`, 420, currentY, { width: 80, align: 'right' });

        currentY += 20;
        doc.font('Helvetica-Bold').fontSize(12);
        doc.text('TOTAL AMOUNT:', 250, currentY, { width: 150, align: 'right' });
        doc.text(`Rs. ${Number(bill.total_amount).toFixed(2)}`, 420, currentY, { width: 80, align: 'right' });
    }

    doc.end();

    // 3. Handle End Stream
    doc.on('end', async () => {
       const pdfBuffer = Buffer.concat(buffers);
       
       if (action === 'store') {
          try {
             // Sanitize vehicle number string for URLs
             const safeVehicle = (repair.vehicle_number || 'UNKNOWN').replace(/\s+/g, '_');
             const filename = `receipt_${safeVehicle}_${Date.now()}.pdf`;
             
             // Upload pushing explicit inline forcing or explicit download
             const url = await uploadToR2(pdfBuffer, filename, 'application/pdf', `attachment; filename="${filename}"`);
             return res.status(200).json({ success: true, url });
          } catch(e) {
             console.error('R2 upload err', e);
             return res.status(500).json({ error: 'Failed to upload generated PDF' });
          }
       } else {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename=receipt_${repair.vehicle_number}.pdf`);
          res.setHeader('Content-Length', pdfBuffer.length);
          return res.send(pdfBuffer);
       }
    });

  } catch (error) {
    console.error('generatePDF Error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Server validation error' });
  }
};
