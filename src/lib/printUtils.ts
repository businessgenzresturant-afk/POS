/**
 * printReceipt — Professional thermal POS receipt printer
 * 
 * Matches reference restaurant receipt exactly:
 * - Professional thermal printer format (58mm/80mm)
 * - Dark, readable text
 * - Perfect alignment
 * - No double printing
 * - No huge margins
 * - Compact layout like real restaurant bills
 */

export const printReceipt = (bill: any, type: 'receipt' | 'kot' = 'receipt') => {
  const printWindow = window.open('', '_blank', 'width=320,height=600');
  
  if (!printWindow) {
    alert('Please allow popups for this site to enable printing.');
    return;
  }

  /* ─── helpers ────────────────────────────────────────────────────── */

  const mergeItems = (items: any[]) => {
    const merged: any[] = [];
    items.forEach((item: any) => {
      const cleanInstr = (item.specialInstructions || '').replace('[URGENT ADDITION]', '').trim();
      const existing = merged.find(
        i => i.menuItem?.id === item.menuItem?.id && i.cleanInstr === cleanInstr
      );
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        merged.push({ ...item, cleanInstr });
      }
    });
    return merged;
  };

  const fmt = (n: number) => `${n.toFixed(2)}`;
  const fmtDate = (d: Date) =>
    `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${String(d.getFullYear()).slice(-2)}`;
  const fmtTime = (d: Date) =>
    `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;

  const isKOT    = type === 'kot';
  const items    = bill.order?.items ?? bill.items ?? [];
  const merged   = mergeItems(items);
  const oTime    = new Date(bill.order?.createdAt ?? bill.createdAt ?? Date.now());
  const origin   = window.location.origin;

  /* ═══════════════════════════════════════════════════════════════════
     KOT RECEIPT - KITCHEN ORDER TICKET
  ═══════════════════════════════════════════════════════════════════ */
  if (isKOT) {
    const kotHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>KOT</title>
<style>
  @page { margin: 0; size: 80mm auto; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', monospace;
    font-size: 15px;
    line-height: 1.3;
    color: #000;
    background: #fff;
    width: 100%;
    max-width: 80mm;
    padding: 4mm 3mm;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .hr { border: none; border-top: 2px solid #000; margin: 3px 0; }
  .dash { border: none; border-top: 1px dashed #000; margin: 3px 0; }
  .row { display: flex; justify-content: space-between; margin: 2px 0; font-size: 14px; }
  .item { margin: 3px 0; font-size: 15px; }
  .note { font-size: 13px; font-style: italic; padding-left: 6px; color: #333; }
</style>
</head>
<body onload="window.print(); window.onfocus = function() { setTimeout(function() { window.close(); }, 100); }">
<div class="center bold" style="font-size:20px; letter-spacing:1px;">KOT</div>
<div class="center" style="font-size:12px;">Kitchen Order Ticket</div>
<div class="hr"></div>
<div class="row"><span>Table:</span><span class="bold">T-${bill.order?.table?.number ?? bill.table?.number ?? '?'}</span></div>
<div class="row"><span>Order:</span><span>${(bill.order?.id ?? bill.id ?? '').slice(-6).toUpperCase()}</span></div>
<div class="row"><span>Time:</span><span>${fmtTime(oTime)}</span></div>
${(bill.order?.customerName || bill.customerName) ? `<div class="row"><span>Customer:</span><span>${bill.order?.customerName ?? bill.customerName}</span></div>` : ''}
<div class="hr"></div>
<div class="row bold"><span>ITEM</span><span>QTY</span></div>
<div class="dash"></div>
${merged.map(item => `<div class="item">
  <div class="row bold">
    <span>${item.menuItem?.name ?? 'Item'}</span>
    <span>x${item.quantity}</span>
  </div>
  ${(item.cleanInstr || item.specialInstructions) ? `<div class="note">⚠ ${item.cleanInstr || item.specialInstructions}</div>` : ''}
</div>`).join('')}
<div class="hr"></div>
<div class="center" style="font-size:12px; margin-top:3px;">Printed: ${fmtTime(new Date())}</div>
<div style="height:10mm;"></div>
</body>
</html>`;

    printWindow.document.write(kotHTML);
    printWindow.document.close();
    return;
  }

  /* ═══════════════════════════════════════════════════════════════════
     CUSTOMER BILL RECEIPT - Matches reference image exactly
  ═══════════════════════════════════════════════════════════════════ */

  const subtotal       = bill.subtotal ?? 0;
  const tax            = bill.tax ?? 0;
  const total          = bill.total ?? 0;
  const discPct        = bill.discountPercent ?? 0;
  const discAmt        = discPct > 0 ? (subtotal * discPct) / 100 : 0;
  const pointsRed      = bill.pointsRedeemed ?? 0;
  const svcCharge      = (bill.serviceChargeApplied && bill.serviceChargeAmount) ? bill.serviceChargeAmount : 0;
  const showGST        = bill.gstApplied !== false && tax > 0;
  const tableNum       = bill.order?.table?.number ?? bill.table?.number ?? null;
  const customerName   = bill.order?.customerName ?? bill.customerName ?? '';
  const customerPhone  = bill.order?.customerPhone ?? bill.customerPhone ?? '';
  const billNo         = (bill.id ?? '').slice(-6).toUpperCase();
  const tokenNo        = bill.order?.id ? bill.order.id.slice(-3).toUpperCase() : null;
  const totalQty       = merged.reduce((s: number, i: any) => s + i.quantity, 0);
  const logoUrl        = `${origin}/images/Gen-z-logo.jpg`;

  const receiptHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Receipt ${billNo}</title>
<style>
  @page { margin: 0; size: 80mm auto; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body {
    font-family: 'Courier New', monospace;
    font-size: 14px;
    font-weight: bold;
    line-height: 1.4;
    color: #000;
    background: #fff;
    width: 100%;
    max-width: 80mm;
    padding: 3mm;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: 900; }
  .upper { text-transform: uppercase; }
  
  .hr { border: none; border-top: 2px solid #000; margin: 3px 0; }
  .dash { border: none; border-top: 1px dashed #000; margin: 2px 0; }
  
  .logo { width: 50px; height: 50px; object-fit: contain; margin: 0 auto 3px; display: block; }
  .rest-name { font-size: 20px; font-weight: 900; letter-spacing: 1px; }
  .rest-info { font-size: 12px; line-height: 1.3; }
  
  .row { display: flex; justify-content: space-between; margin: 1px 0; font-size: 13px; }
  .row-label { font-weight: bold; }
  
  table { width: 100%; border-collapse: collapse; margin: 2px 0; }
  th { font-size: 13px; font-weight: bold; text-align: left; border-bottom: 1px solid #000; padding: 2px 0; }
  th:nth-child(2) { text-align: center; width: 35px; }
  th:nth-child(3) { text-align: right; width: 55px; }
  th:nth-child(4) { text-align: right; width: 60px; }
  
  td { font-size: 14px; font-weight: bold; padding: 2px 0; vertical-align: top; }
  td:nth-child(1) { text-align: left; }
  td:nth-child(2) { text-align: center; width: 35px; }
  td:nth-child(3) { text-align: right; width: 55px; }
  td:nth-child(4) { text-align: right; width: 60px; }
  
  .item-note { font-size: 12px; padding-left: 4px; font-style: italic; color: #333; }
  
  .total-row { display: flex; justify-content: space-between; font-size: 14px; margin: 1px 0; }
  .total-label { flex: 1; }
  .total-val { text-align: right; white-space: nowrap; min-width: 70px; }
  
  .grand { font-size: 18px; font-weight: 900; margin: 3px 0; }
  
  .footer { font-size: 13px; line-height: 1.5; margin-top: 4px; }
  
  @media print {
    body { padding: 2mm; }
  }
</style>
</head>
<body onload="window.print(); window.onfocus = function() { setTimeout(function() { window.close(); }, 100); }">

<!-- HEADER -->
<div class="center">
  <img class="logo" src="${logoUrl}" alt="Logo" onerror="this.style.display='none'">
  <div class="rest-name upper">Gen-Z Restaurant</div>
  <div class="rest-info">
    29 Main Street, New Delhi-110001<br>
    GST: 07AABCG1234A1Z5<br>
    Contact: +91 98765-43210
  </div>
  <div style="font-size:13px; font-weight:bold; margin:2px 0; letter-spacing:1px;" class="upper">
    Retail Invoice
  </div>
</div>

<div class="hr"></div>

<!-- CUSTOMER INFO -->
<div style="font-size:13px; margin:2px 0;">
  <span class="bold">Name: </span>${customerName || 'Walk-in Customer'}
</div>
${customerPhone ? `<div style="font-size:13px;"><span class="bold">Phone: </span>${customerPhone}</div>` : ''}

<!-- BILL META -->
<div class="row">
  <span><span class="row-label">Date:</span> ${fmtDate(oTime)}</span>
  <span><span class="row-label">Time:</span> ${fmtTime(oTime)}</span>
</div>
<div class="row">
  <span><span class="row-label">Bill No:</span> ${billNo}</span>
  <span><span class="row-label">Table:</span> ${tableNum ?? '-'}</span>
</div>
<div class="row">
  <span><span class="row-label">Cashier:</span> admin</span>
  ${tokenNo ? `<span><span class="row-label">Token:</span> ${tokenNo}</span>` : '<span></span>'}
</div>

<div class="hr"></div>

<!-- ITEMS TABLE -->
<table>
  <thead>
    <tr>
      <th>Item</th>
      <th>Qty</th>
      <th>Rate</th>
      <th>Amt</th>
    </tr>
  </thead>
  <tbody>
${merged.map((item: any) => {
  const unitPrice = item.menuItem?.price ?? item.price ?? 0;
  const lineTotal = item.quantity * unitPrice;
  return `    <tr>
      <td>${item.menuItem?.name ?? 'Item'}</td>
      <td>${item.quantity}</td>
      <td>${fmt(unitPrice)}</td>
      <td>${fmt(lineTotal)}</td>
    </tr>
${item.cleanInstr ? `    <tr><td colspan="4" class="item-note">  ↳ ${item.cleanInstr}</td></tr>` : ''}`;
}).join('\n')}
  </tbody>
</table>

<div class="hr"></div>

<!-- TOTALS -->
<div class="total-row">
  <span class="total-label">Qty: ${totalQty}</span>
  <span class="total-label" style="text-align:right;">Subtotal</span>
  <span class="total-val">₹${fmt(subtotal)}</span>
</div>

${svcCharge > 0 ? `<div class="total-row">
  <span class="total-label"></span>
  <span class="total-label" style="text-align:right;">Service Charge</span>
  <span class="total-val">₹${fmt(svcCharge)}</span>
</div>` : ''}

${showGST ? `<div class="total-row">
  <span class="total-label"></span>
  <span class="total-label" style="text-align:right;">CGST (9%)</span>
  <span class="total-val">₹${fmt(tax / 2)}</span>
</div>
<div class="total-row">
  <span class="total-label"></span>
  <span class="total-label" style="text-align:right;">SGST (9%)</span>
  <span class="total-val">₹${fmt(tax / 2)}</span>
</div>` : ''}

${discAmt > 0 ? `<div class="total-row">
  <span class="total-label"></span>
  <span class="total-label" style="text-align:right;">Discount (${discPct}%)</span>
  <span class="total-val">-₹${fmt(discAmt)}</span>
</div>` : ''}

${pointsRed > 0 ? `<div class="total-row">
  <span class="total-label"></span>
  <span class="total-label" style="text-align:right;">Points Redeemed</span>
  <span class="total-val">-₹${fmt(pointsRed)}</span>
</div>` : ''}

<div class="hr"></div>

<!-- GRAND TOTAL -->
<div class="total-row grand">
  <span class="bold">Grand Total</span>
  <span class="bold">₹${fmt(total)}</span>
</div>

<div class="hr"></div>

<!-- PAYMENT -->
${bill.status === 'PAID' ? `<div class="total-row" style="font-weight:900;">
  <span>Payment: ${bill.paymentMethod ?? 'CASH'}</span>
  <span>PAID ✓</span>
</div>` : ''}

${bill.paymentMethod === 'SPLIT' ? `<div class="total-row">
  <span>Cash</span><span>₹${fmt(bill.cashAmount ?? 0)}</span>
</div>
<div class="total-row">
  <span>Online</span><span>₹${fmt(bill.onlineAmount ?? 0)}</span>
</div>` : ''}

<!-- FOOTER -->
<div class="dash" style="margin-top:4px;"></div>
<div class="footer center">
  <div class="bold">Thank you for ordering</div>
  <div>Please visit us again 🙏</div>
  <div style="font-size:11px; margin-top:2px;">www.gen-z.online</div>
</div>

<!-- Cutter clearance -->
<div style="height:10mm;"></div>

</body>
</html>`;

  printWindow.document.write(receiptHTML);
  printWindow.document.close();
};

