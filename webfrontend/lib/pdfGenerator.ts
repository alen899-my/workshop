import jsPDF from "jspdf";
import "jspdf-autotable";

// We need to augment jsPDF type to include autoTable if it's not detected properly
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { y: number };
  }
}

export interface PdfDataProps {
  repair: any;
  bill: any;
  shopData?: any;
  symbol: string;
}

export function generateInvoicePDF({
  repair,
  bill,
  shopData,
  symbol,
}: PdfDataProps): jsPDF {
  const doc = new jsPDF();

  const shopName = shopData?.shop_name || "Workshop";
  const shopPhone = shopData?.shop_phone || "";
  const shopAddress = shopData?.shop_address || "";

  let y = 20; // current Y position

  // --- HEADER SECTION ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(61, 122, 120); // Workshop Teal

  // Shop Name & Title
  doc.text(shopName.toUpperCase(), 14, y);
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text("TAX INVOICE", 150, y, { align: "right" });

  y += 8;

  // Shop Details
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  if (shopAddress) {
    doc.text(shopAddress, 14, y);
    y += 5;
  }
  if (shopPhone) {
    doc.text(`Phone: ${shopPhone}`, 14, y);
    y += 5;
  }

  y += 5;

  // Divider Line
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y, 196, y);
  y += 10;

  // --- REPAIR & CUSTOMER INFORMATION ---
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 40);

  // Left Column - Customer Details
  doc.text("Billed To:", 14, y);
  doc.setFont("helvetica", "normal");
  const ownerName = repair.owner_name || "N/A";
  const ownerPhone = repair.phone_number || "N/A";
  doc.text(`Name: ${ownerName}`, 14, y + 5);
  doc.text(`Phone: ${ownerPhone}`, 14, y + 10);

  // Right Column - Vehicle Details
  doc.setFont("helvetica", "bold");
  doc.text("Vehicle & Repair Details:", 110, y);
  doc.setFont("helvetica", "normal");
  doc.text(`Vehicle No: ${repair.vehicle_number || "N/A"}`, 110, y + 5);
  doc.text(
    `Type: ${repair.vehicle_type || ""} ${
      repair.model_name ? "- " + repair.model_name : ""
    }`,
    110,
    y + 10
  );
  doc.text(
    `Invoice Date: ${
      repair.repair_date
        ? new Date(repair.repair_date).toLocaleDateString()
        : new Date().toLocaleDateString()
    }`,
    110,
    y + 15
  );

  y += 25;

  // --- BILL ITEMS TABLE ---
  if (bill && bill.items && bill.items.length > 0) {
    const tableColumn = ["Description", "Qty", `Rate (${symbol})`, `Amount (${symbol})`];
    const tableRows: any[] = [];

    bill.items.forEach((item: any) => {
      const rate = Number(item.cost || 0).toFixed(2);
      const amount = (Number(item.qty || 0) * Number(item.cost || 0)).toFixed(2);
      tableRows.push([item.name || "-", item.qty || 0, rate, amount]);
    });

    if (Number(bill.service_charge || 0) > 0) {
      tableRows.push([
        "Service/Labour Charge",
        "-",
        "-",
        Number(bill.service_charge).toFixed(2),
      ]);
    }

    doc.autoTable({
      startY: y,
      head: [tableColumn],
      body: tableRows,
      theme: "striped",
      headStyles: { fillColor: [61, 122, 120] },
      margin: { top: 10, left: 14, right: 14 },
    });

    y = doc.lastAutoTable.y + 10;
  } else if (bill && Number(bill.service_charge || 0) > 0) {
    // Only service charge
    const tableColumn = ["Description", "Amount"];
    const tableRows = [
      ["Service/Labour Charge", `${symbol}${Number(bill.service_charge).toFixed(2)}`],
    ];
    doc.autoTable({
      startY: y,
      head: [tableColumn],
      body: tableRows,
      theme: "striped",
      headStyles: { fillColor: [20, 40, 70] },
      margin: { top: 10, left: 14, right: 14 },
    });
    y = doc.lastAutoTable.y + 10;
  }

  // --- TOTALS & TAX SECTION ---
  if (bill) {
    // Tax Breakdowns
    if (bill.tax_snapshot && Array.isArray(bill.tax_snapshot)) {
      bill.tax_snapshot.forEach((t: any) => {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);
        doc.text(
          `${t.name} (${t.rate}%)${t.is_inclusive ? " [Incl.]" : ""}:`,
          140,
          y,
          { align: "right" }
        );
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40, 40, 40);
        doc.text(`${symbol}${Number(t.amount).toFixed(2)}`, 185, y, {
          align: "right",
        });
        y += 5;
      });
      y += 2;
    }

    // Grand Total
    doc.setDrawColor(200, 200, 200);
    doc.line(120, y, 196, y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(61, 122, 120); // Workshop Teal
    doc.text("Grand Total:", 140, y, { align: "right" });
    doc.text(`${symbol}${Number(bill.total_amount || 0).toFixed(2)}`, 185, y, {
      align: "right",
    });

    y += 15;
  } else {
    // Just display status if no bill
    doc.setFont("helvetica", "italic");
    doc.text("No bill has been generated yet.", 14, y);
    y += 10;
  }

  // --- FOOTER SECTION ---
  const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
  if (y > pageHeight - 40) {
    doc.addPage();
    y = 20;
  } else {
    y = pageHeight - 30;
  }

  doc.setDrawColor(200, 200, 200);
  doc.line(14, y, 196, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Terms & Conditions:", 14, y);
  doc.text("1. Thank you for your business.", 14, y + 4);
  doc.text("2. Payment is due upon receipt.", 14, y + 8);

  doc.text("Authorized Signatory", 196, y + 8, { align: "right" });

  return doc;
}

export const downloadInvoicePDF = (data: PdfDataProps, filename: string) => {
  const doc = generateInvoicePDF(data);
  doc.save(filename);
};

export const getInvoicePDFBlob = (data: PdfDataProps): Blob => {
  const doc = generateInvoicePDF(data);
  return doc.output("blob");
};
