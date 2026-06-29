export const printReceipt = (bill: any, type: 'receipt' | 'kot' = 'receipt') => {
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  if (!printWindow) {
    alert('Please allow popups to print');
    return;
  }

  // Merge items for receipt
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

  const isKOT = type === 'kot';
  const mergedItems = bill.order?.items ? mergeItems(bill.order.items) : (bill.items ? mergeItems(bill.items) : []);
  const orderTime = bill.order?.createdAt || bill.createdAt || new Date();

  let receiptHTML = '';

  if (isKOT) {
    receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>KOT - ${bill.id?.slice(-8).toUpperCase() || 'NEW'}</title>
        <base href="${window.location.origin}">
        <style>
          @page { margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            color: #000; 
            background: #fff; 
            width: 100%;
            margin: 0;
            padding: 2mm;
          }
          .kot-header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 5px; margin-bottom: 5px; }
          .kot-title { font-size: 24px; font-weight: bold; }
          .info-row { display: flex; justify-content: space-between; font-size: 16px; margin-bottom: 3px; font-weight: bold; }
          .items-header { border-bottom: 1px solid #000; padding-bottom: 3px; margin-bottom: 3px; font-size: 14px; font-weight: bold; display: flex; justify-content: space-between; }
          .item-row { font-size: 18px; font-weight: bold; display: flex; justify-content: space-between; margin-bottom: 5px; }
          .item-name { flex: 1; padding-right: 5px; }
          .item-qty { font-size: 20px; white-space: nowrap; }
          .item-special { font-size: 14px; color: #333; font-style: italic; margin-left: 10px; margin-bottom: 5px; }
          .footer { text-align: center; border-top: 2px dashed #000; margin-top: 10px; padding-top: 5px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="kot-header">
          <div class="kot-title">KOT</div>
        </div>
        <div class="info-row">
          <span>Table:</span>
          <span>T-${bill.order?.table?.number || bill.table?.number || '?'}</span>
        </div>
        <div class="info-row">
          <span>Time:</span>
          <span>${new Date(orderTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div class="info-row">
          <span>Order:</span>
          <span>${(bill.order?.id || bill.id || '').slice(-8).toUpperCase()}</span>
        </div>
        
        <div style="margin-top: 10px;">
          <div class="items-header">
            <span>Item</span>
            <span>Qty</span>
          </div>
          ${mergedItems.map((item: any) => `
            <div>
              <div class="item-row">
                <span class="item-name">${item.menuItem?.name || item.name || 'Unknown Item'}</span>
                <span class="item-qty">x${item.quantity}</span>
              </div>
              ${item.cleanInstr || item.specialInstructions ? `<div class="item-special">Note: ${item.cleanInstr || item.specialInstructions}</div>` : ''}
            </div>
          `).join('')}
        </div>
        <div class="footer">
          Printed: ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </body>
      </html>
    `;
  } else {
    // Normal Receipt
    receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${(bill.id || '').slice(-8).toUpperCase()}</title>
        <base href="${window.location.origin}">
        <style>
          @page { margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 14px; 
            line-height: 1.4; 
            color: #000; 
            background: #fff; 
            width: 100%;
            margin: 0;
            padding: 2mm;
            position: relative;
          }
          
          /* Watermark */
          body::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80%;
            height: 80%;
            background-image: url('/images/Gen-z-logo.jpg');
            background-position: center;
            background-repeat: no-repeat;
            background-size: contain;
            opacity: 0.08;
            z-index: 0;
            pointer-events: none;
          }
          
          .receipt-content { position: relative; z-index: 1; }
          
          .receipt-header { 
            text-align: center; 
            margin-bottom: 10px; 
            border-bottom: 1px dashed #000; 
            padding-bottom: 10px; 
          }
          .restaurant-name { 
            font-size: 22px; 
            font-weight: bold; 
            text-transform: uppercase; 
            margin-bottom: 4px; 
          }
          .restaurant-info { 
            font-size: 13px; 
            line-height: 1.4; 
          }
          
          .bill-info { 
            border-bottom: 1px dashed #000; 
            padding-bottom: 5px; 
            margin-bottom: 5px; 
            font-size: 13px; 
          }
          .info-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 2px; 
          }
          .info-label { font-weight: bold; }
          
          .items-section { 
            border-bottom: 1px dashed #000; 
            padding-bottom: 5px; 
            margin-bottom: 5px; 
          }
          .items-header { 
            display: flex; 
            justify-content: space-between; 
            font-weight: bold; 
            border-bottom: 1px solid #000; 
            padding-bottom: 3px; 
            margin-bottom: 4px; 
            font-size: 14px; 
            text-transform: uppercase; 
          }
          .item-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 3px; 
            font-size: 14px; 
            align-items: flex-start;
          }
          .item-name { 
            flex: 1; 
            font-weight: 600; 
            padding-right: 5px;
            word-wrap: break-word;
          }
          .item-price { 
            font-weight: bold; 
            white-space: nowrap;
            text-align: right; 
          }
          .item-special { 
            color: #444; 
            font-size: 12px; 
            margin-top: 1px;
            margin-bottom: 3px; 
            font-style: italic;
          }
          
          .totals-section { 
            padding-bottom: 5px; 
            margin-bottom: 5px; 
            font-size: 14px; 
          }
          .total-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 3px; 
          }
          .total-final { 
            font-size: 18px;
            font-weight: bold; 
            border-top: 1px solid #000; 
            border-bottom: 1px solid #000; 
            padding: 4px 0; 
            margin-top: 4px; 
          }
          
          .payment-status { 
            text-align: center; 
            font-weight: bold; 
            font-size: 16px; 
            padding: 6px; 
            border: 1px dashed #000; 
            margin: 8px 0; 
            text-transform: uppercase; 
          }
          
          .footer { 
            text-align: center; 
            border-top: 1px dashed #000; 
            padding-top: 8px; 
            margin-top: 8px; 
            font-size: 13px; 
          }
          .footer-message { 
            font-weight: bold; 
            margin-bottom: 3px; 
            font-size: 14px;
          }
          
          @media print { 
            body::before { 
              print-color-adjust: exact; 
              -webkit-print-color-adjust: exact; 
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-content">
          <div class="receipt-header">
            <div class="restaurant-name">Gen-Z Restaurant</div>
            <div class="restaurant-info">
              <div>123 Main Street, New Delhi</div>
              <div>GST: 07AABCG1234A1Z5</div>
              <div>Tel: +91 98765 43210</div>
            </div>
          </div>

          <div class="bill-info">
            <div class="info-row">
              <span class="info-label">Bill #:</span>
              <span>${(bill.id || '').slice(-8).toUpperCase()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date:</span>
              <span>${new Date(orderTime).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            ${bill.order?.table || bill.table ? `
            <div class="info-row">
              <span class="info-label">Table:</span>
              <span>T-${bill.order?.table?.number || bill.table?.number || '?'}</span>
            </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">Customer:</span>
              <span>${bill.order?.customerName || bill.customerName || 'Walk-in'}</span>
            </div>
            ${bill.order?.customerPhone || bill.customerPhone ? `
            <div class="info-row">
              <span class="info-label">Phone:</span>
              <span>${bill.order?.customerPhone || bill.customerPhone}</span>
            </div>
            ` : ''}
          </div>

          <div class="items-section">
            <div class="items-header">
              <span>Item</span>
              <span>Amount</span>
            </div>
            ${mergedItems.map((item: any) => `
              <div>
                <div class="item-row">
                  <span class="item-name">${item.quantity}x ${item.menuItem?.name || item.name || 'Unknown Item'}</span>
                  <span class="item-price">₹${(item.quantity * (item.menuItem?.price || item.price || 0)).toFixed(2)}</span>
                </div>
                ${item.cleanInstr ? `<div class="item-special">Note: ${item.cleanInstr}</div>` : ''}
              </div>
            `).join('')}
          </div>

          <div class="totals-section">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>₹${(bill.subtotal || 0).toFixed(2)}</span>
            </div>
            ${bill.serviceChargeApplied && bill.serviceChargeAmount ? `
            <div class="total-row">
              <span>Service (10%):</span>
              <span>₹${bill.serviceChargeAmount.toFixed(2)}</span>
            </div>
            ` : ''}
            ${bill.gstApplied !== false && bill.tax ? `
            <div class="total-row">
              <span>CGST (9%):</span>
              <span>₹${(bill.tax / 2).toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>SGST (9%):</span>
              <span>₹${(bill.tax / 2).toFixed(2)}</span>
            </div>
            ` : ''}
            ${bill.discountPercent > 0 ? `
            <div class="total-row">
              <span>Discount (${bill.discountPercent}%):</span>
              <span>-₹${((bill.subtotal * bill.discountPercent) / 100).toFixed(2)}</span>
            </div>
            ` : ''}
            ${bill.pointsRedeemed > 0 ? `
            <div class="total-row">
              <span>Points:</span>
              <span>-₹${bill.pointsRedeemed.toFixed(2)}</span>
            </div>
            ` : ''}
            <div class="total-row total-final">
              <span>TOTAL:</span>
              <span>₹${(bill.total || 0).toFixed(2)}</span>
            </div>
          </div>

          ${bill.status === 'PAID' ? `
          <div class="payment-status">
            ✓ PAID - ${bill.paymentMethod || 'CASH'}
          </div>
          ` : ''}

          ${bill.paymentMethod === 'SPLIT' ? `
          <div class="totals-section">
            <div class="total-row">
              <span>Cash:</span>
              <span>₹${(bill.cashAmount || 0).toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Online:</span>
              <span>₹${(bill.onlineAmount || 0).toFixed(2)}</span>
            </div>
          </div>
          ` : ''}

          <div class="footer">
            <div class="footer-message">Thank you for dining! 💚</div>
            <div>Visit again soon!</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  printWindow.document.write(receiptHTML);
  printWindow.document.close();
  
  // Wait a tiny bit for the logo to maybe load if cached, then print
  setTimeout(() => {
    printWindow.print();
  }, 300);
};
