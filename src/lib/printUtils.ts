/**
 * printReceipt — Professional thermal POS receipt printer
 */

import { RESTAURANT_INFO, PRINTER } from './constants';
import { mergeOrderItems } from './orderUtils';
import { formatCurrency } from './billUtils';

export const printReceipt = (bill: any, type: 'receipt' | 'kot' = 'receipt') => {
  const printWindow = window.open('', '_blank', 'width=300,height=500');
  
  if (!printWindow) {
    alert('Please allow popups for this site to enable printing.');
    return;
  }

  /* ─── helpers ────────────────────────────────────────────────────── */

  const fmt = (n: number) => `${n.toFixed(2)}`;
  const fmtDate = (d: Date) =>
    `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${String(d.getFullYear()).slice(-2)}`;
  const fmtTime = (d: Date) =>
    `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;

  const isKOT    = type === 'kot';
  const items    = bill.order?.items ?? bill.items ?? [];
  const merged   = mergeOrderItems(items);
  const oTime    = new Date(bill.order?.createdAt ?? bill.createdAt ?? Date.now());
  const origin   = window.location.origin;

  /* ═══════════════════════════════════════════════════════════════════
     KOT RECEIPT
  ═══════════════════════════════════════════════════════════════════ */
  if (isKOT) {
    const kotHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>KOT</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  html, body {
    width: 80mm;
    margin: 0;
    padding: 0;
    background: #fff;
    color: #000;
    font-family: Arial, Helvetica, sans-serif;
  }
  .receipt {
    width: 100%;
    max-width: none;
    min-width: 100%;
    margin: 0;
    padding: 2mm 4mm 2mm 2mm; /* Ensure right content is not clipped by printer hardware margins */
    box-sizing: border-box;
    display: block;
  }
  
  .c { text-align: center; }
  .hr { border-top: 1.5px dashed #000; margin: 4px 0; }
  
  /* Using table layout for bulletproof print alignment instead of flex */
  .row-table { width: 100%; display: table; margin-bottom: 2px; }
  .row-cell-left { display: table-cell; text-align: left; vertical-align: top; }
  .row-cell-right { display: table-cell; text-align: right; vertical-align: top; }
  
  .item-name { font-size: 16px; padding-right: 2mm; }
  .item-qty { font-size: 18px; white-space: nowrap; }
</style>
</head>
<body onload="window.print(); setTimeout(function(){ window.close(); }, ${PRINTER.AUTO_PRINT_DELAY});">
<div class="receipt">
  <div class="c" style="font-size:22px; letter-spacing: 1px;">KOT</div>
  <div class="c" style="font-size:14px; margin-bottom: 4px;">Kitchen Order Ticket</div>
  
  <div class="hr"></div>
  <div class="row-table">
    <div class="row-cell-left" style="font-size:14px;">Table:</div>
    <div class="row-cell-right" style="font-size:18px;">T-${bill.order?.table?.number ?? bill.table?.number ?? '?'}</div>
  </div>
  <div class="row-table">
    <div class="row-cell-left" style="font-size:14px;">Time:</div>
    <div class="row-cell-right" style="font-size:14px;">${fmtTime(oTime)}</div>
  </div>
  <div class="hr"></div>
  
  <div class="row-table" style="font-size:14px; margin-bottom:4px;">
    <div class="row-cell-left">ITEM</div>
    <div class="row-cell-right">QTY</div>
  </div>
  <div class="hr"></div>
  
  ${merged.map(item => `
  <div class="row-table">
    <div class="row-cell-left item-name">${item.menuItem?.name ?? 'Item'}</div>
    <div class="row-cell-right item-qty">x${item.quantity}</div>
  </div>
  ${item.cleanInstr ? `<div style="font-size:13px; font-style:italic; padding-left:2mm; margin-top:-1px; margin-bottom:3px;">* ${item.cleanInstr}</div>` : ''}
  `).join('')}
  
  <div class="hr"></div>
  <div style="height:6mm;"></div>
</div>
</body>
</html>`;
    printWindow.document.write(kotHTML);
    printWindow.document.close();
    return;
  }

  /* ═══════════════════════════════════════════════════════════════════
     CUSTOMER BILL RECEIPT - Simple & Professional
  ═══════════════════════════════════════════════════════════════════ */

  const subtotal = bill.subtotal ?? 0;
  const tax = bill.tax ?? 0;
  const total = bill.total ?? 0;
  const discPct = bill.discountPercent ?? 0;
  const discAmt = discPct > 0 ? (subtotal * discPct) / 100 : 0;
  const svcCharge = (bill.serviceChargeApplied && bill.serviceChargeAmount) ? bill.serviceChargeAmount : 0;
  const showGST = bill.gstApplied !== false && tax > 0;
  const tableNum = bill.order?.table?.number ?? bill.table?.number ?? null;
  const customerName = bill.order?.customerName ?? bill.customerName ?? '';
  const billNo = (bill.id ?? '').slice(-6).toUpperCase();
  const tokenNo = bill.order?.id ? bill.order.id.slice(-3).toUpperCase() : null;
  const totalQty = merged.reduce((s: number, i: any) => s + i.quantity, 0);

  const receiptHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Bill ${billNo}</title>
<style>
@page { size: 80mm auto; margin: 0; }
html, body {
  width: 80mm;
  margin: 0;
  padding: 0;
  background: #fff;
  color: #000;
  font-family: Arial, Helvetica, sans-serif;
}
.receipt {
  width: 100%;
  max-width: none;
  min-width: 100%;
  margin: 0;
  padding: 2mm 4mm 2mm 2mm; /* Ensure right content is not clipped by printer hardware margins */
  box-sizing: border-box;
  display: block;
}

.c { text-align: center; }
.hr { border-top: 1px dashed #000; margin: 4px 0; }

/* Bulletproof layout using table */
.row-table { width: 100%; display: table; font-size: 13px; line-height: 1.4; margin-bottom: 2px; }
.row-cell-left { display: table-cell; text-align: left; vertical-align: top; }
.row-cell-right { display: table-cell; text-align: right; vertical-align: top; }

/* Main item table */
table.items { width: 100%; border-collapse: collapse; margin: 4px 0; }
table.items th { border-bottom: 1px dashed #000; padding: 4px 0; font-size: 13px; font-weight: normal; }
table.items td { padding: 4px 0; font-size: 14px; vertical-align: top; }
table.items th:nth-child(1), table.items td:nth-child(1) { text-align: left; width: 45%; }
table.items th:nth-child(2), table.items td:nth-child(2) { text-align: center; width: 15%; }
table.items th:nth-child(3), table.items td:nth-child(3) { text-align: right; width: 20%; }
table.items th:nth-child(4), table.items td:nth-child(4) { text-align: right; width: 20%; }
</style>
</head>
<body onload="window.print(); setTimeout(function(){ window.close(); }, ${PRINTER.AUTO_PRINT_DELAY});">
<div class="receipt">
  
  <div class="c">
    <div style="font-size:18px; margin-bottom:2px; text-transform: uppercase;">${RESTAURANT_INFO.NAME}</div>
    <div style="font-size:13px; line-height:1.4;">
      ${RESTAURANT_INFO.ADDRESS}<br>
      GST: ${RESTAURANT_INFO.GST_NUMBER}<br>
      Contact: ${RESTAURANT_INFO.PHONE}
    </div>
    <div style="font-size:14px; margin:4px 0;">RETAIL INVOICE</div>
  </div>

  <div class="hr"></div>

  <div style="font-size:13px; margin-bottom:2px;">Name: ${customerName || 'Walk-in Customer'}</div>
  <div class="row-table">
    <div class="row-cell-left">Date: ${fmtDate(oTime)}</div>
    <div class="row-cell-right">Time: ${fmtTime(oTime)}</div>
  </div>
  <div class="row-table">
    <div class="row-cell-left">Bill No: ${billNo}</div>
    <div class="row-cell-right">Table: ${tableNum ?? '-'}</div>
  </div>
  <div class="row-table">
    <div class="row-cell-left">Cashier: admin</div>
    <div class="row-cell-right">${tokenNo ? `Token: ${tokenNo}` : ''}</div>
  </div>

  <div class="hr"></div>

  <table class="items">
    <thead>
      <tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amt</th></tr>
    </thead>
    <tbody>
      ${merged.map((item: any) => {
        const price = item.menuItem?.price ?? item.price ?? 0;
        const amt = item.quantity * price;
        return `<tr>
          <td>${item.menuItem?.name ?? 'Item'}</td>
          <td>${item.quantity}</td>
          <td>${fmt(price)}</td>
          <td>${fmt(amt)}</td>
        </tr>`;
      }).join('\n')}
    </tbody>
  </table>

  <div class="hr"></div>

  <div class="row-table">
    <div class="row-cell-left">Qty: ${totalQty}</div>
    <div class="row-cell-right">Subtotal: &nbsp; ₹${fmt(subtotal)}</div>
  </div>
  ${svcCharge > 0 ? `<div class="row-table"><div class="row-cell-left"></div><div class="row-cell-right">Service: &nbsp; ₹${fmt(svcCharge)}</div></div>` : ''}
  ${showGST ? `<div class="row-table"><div class="row-cell-left"></div><div class="row-cell-right">CGST (9%): &nbsp; ₹${fmt(tax/2)}</div></div><div class="row-table"><div class="row-cell-left"></div><div class="row-cell-right">SGST (9%): &nbsp; ₹${fmt(tax/2)}</div></div>` : ''}
  ${discAmt > 0 ? `<div class="row-table"><div class="row-cell-left"></div><div class="row-cell-right">Discount (${discPct}%): &nbsp; -₹${fmt(discAmt)}</div></div>` : ''}

  <div class="hr"></div>

  <div class="row-table" style="font-size:16px;">
    <div class="row-cell-left">Grand Total</div>
    <div class="row-cell-right">₹${fmt(total)}</div>
  </div>

  <div class="hr"></div>

  ${bill.status === 'PAID' ? `
  <div class="row-table" style="font-size:15px;">
    <div class="row-cell-left">Paid via: ${bill.paymentMethod ?? 'CASH'}</div>
    <div class="row-cell-right">PAID ✓</div>
  </div>
  ` : ''}

  <div class="hr"></div>
  <div class="c" style="font-size:13px; line-height:1.4; margin-top:4px;">
    <div>Thank you for ordering</div>
    <div>Please visit again 🙏</div>
    <div style="font-size:11px; margin-top:2px;">${RESTAURANT_INFO.WEBSITE}</div>
  </div>

  <div style="height:6mm;"></div>
</div>
</body>
</html>`;

  printWindow.document.write(receiptHTML);
  printWindow.document.close();
};

