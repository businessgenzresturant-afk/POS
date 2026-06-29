'use client';

import Image from 'next/image';

interface ReceiptPrintTemplateProps {
  bill: any;
  onClose?: () => void;
}

export function ReceiptPrintTemplate({ bill, onClose }: ReceiptPrintTemplateProps) {
  const handlePrint = () => {
    import('@/lib/printUtils').then(({ printReceipt }) => {
      printReceipt(bill, 'receipt');
    });
  };

  // Merge items with same name and special instructions
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

  const mergedItems = bill.order?.items ? mergeItems(bill.order.items) : [];

  return (
    <div className="space-y-4">
      {/* Print Button */}
      <button
        onClick={handlePrint}
        className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
      >
        <span>🖨️</span>
        Print Receipt
      </button>

      {/* Hidden print content */}
      <div id="receipt-print-content" className="hidden">
        <div className="receipt-header">
          <div className="logo flex justify-center mb-4">
            <img src="/images/gen-z logo.png" alt="Gen-Z Logo" width="120" height="120" style={{ objectFit: 'contain' }} />
          </div>
          <div className="restaurant-name text-2xl font-black uppercase">Gen-Z Restaurant</div>
          <div className="restaurant-info text-sm font-semibold text-muted-foreground mt-2">
            <div>123 Main Street, New Delhi, India</div>
            <div>GST No: 07AABCG1234A1Z5</div>
            <div>Tel: +91 98765 43210</div>
          </div>
        </div>

        <div className="bill-info">
          <div className="info-row">
            <span className="info-label">Bill #:</span>
            <span>{bill.id.slice(-8).toUpperCase()}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Date:</span>
            <span>{new Date(bill.order?.createdAt || bill.createdAt).toLocaleString('en-IN')}</span>
          </div>
          {bill.order?.table && (
            <div className="info-row">
              <span className="info-label">Table:</span>
              <span>Table {bill.order.table.number}</span>
            </div>
          )}
          <div className="info-row">
            <span className="info-label">Customer:</span>
            <span>{bill.order?.customerName || 'Walk-in Customer'}</span>
          </div>
          {bill.order?.customerPhone && (
            <div className="info-row">
              <span className="info-label">Phone:</span>
              <span>{bill.order.customerPhone}</span>
            </div>
          )}
        </div>

        <div className="items-section">
          <div className="items-header">
            <span>Item</span>
            <span>Amount</span>
          </div>
          {mergedItems.map((item: any, idx: number) => (
            <div key={idx}>
              <div className="item-row">
                <span className="item-name">
                  {item.quantity}× {item.menuItem?.name || 'Unknown Item'}
                </span>
                <span className="item-price">
                  ₹{(item.quantity * (item.menuItem?.price || item.price || 0)).toFixed(2)}
                </span>
              </div>
              {item.cleanInstr && (
                <div className="item-special">Note: {item.cleanInstr}</div>
              )}
            </div>
          ))}
        </div>

        <div className="totals-section">
          <div className="total-row">
            <span>Subtotal:</span>
            <span>₹{bill.subtotal.toFixed(2)}</span>
          </div>
          {bill.gstApplied !== false && (
            <>
              <div className="total-row">
                <span>CGST (9%):</span>
                <span>₹{((bill.tax || 0) / 2).toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>SGST (9%):</span>
                <span>₹{((bill.tax || 0) / 2).toFixed(2)}</span>
              </div>
            </>
          )}
          {bill.discountPercent > 0 && (
            <div className="total-row">
              <span>Discount ({bill.discountPercent}%):</span>
              <span>-₹{((bill.subtotal * bill.discountPercent) / 100).toFixed(2)}</span>
            </div>
          )}
          {bill.pointsRedeemed > 0 && (
            <div className="total-row">
              <span>Points Redeemed:</span>
              <span>-₹{bill.pointsRedeemed.toFixed(2)}</span>
            </div>
          )}
          <div className="total-row total-final">
            <span>TOTAL:</span>
            <span>₹{bill.total.toFixed(2)}</span>
          </div>
        </div>

        {bill.status === 'PAID' && (
          <div className="payment-status">
            ✓ PAID - {bill.paymentMethod || 'CASH'}
          </div>
        )}

        {bill.paymentMethod === 'SPLIT' && (
          <div className="totals-section">
            <div className="total-row">
              <span>Cash:</span>
              <span>₹{(bill.cashAmount || 0).toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Online:</span>
              <span>₹{(bill.onlineAmount || 0).toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="footer">
          <div className="footer-message">Thank you for dining with us! 💚</div>
          <div>Visit us again soon!</div>
          <div>www.genzrestaurant.com</div>
        </div>
      </div>

      {/* Preview (visible on screen) */}
      <div className="bg-white border border-border shadow-md mx-auto max-w-sm rounded-none p-4 max-h-[500px] overflow-y-auto font-mono text-black">
        <div className="text-center mb-2">
          <div className="text-xs font-bold uppercase">RETAIL INVOICE</div>
          <div className="text-lg font-black uppercase mt-1">Gen-Z Restaurant</div>
          <div className="text-[10px] font-bold mt-1 leading-tight">
            <div>123 Main Street, New Delhi-110001</div>
            <div>GST: 07AABCG1234A1Z5</div>
            <div>Tel: +91 98765 43210</div>
          </div>
        </div>

        <div className="border-t-2 border-black my-2"></div>

        <div className="text-xs font-bold">
          Name: {bill.order?.customerName || bill.customerName || 'Walk-in'}
        </div>

        <div className="border-t-2 border-black my-2"></div>

        <div className="grid grid-cols-2 gap-1 text-[10px] font-bold">
          <div>Date: {new Date(bill.order?.createdAt || bill.createdAt).toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: '2-digit'})} {new Date(bill.order?.createdAt || bill.createdAt).toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'})}</div>
          <div>{bill.order?.table || bill.table ? `Dine In: ${bill.order?.table?.number || bill.table?.number}` : 'Takeaway'}</div>
          <div>Cashier: admin</div>
          <div>Bill No.: {bill.id.slice(-6).toUpperCase()}</div>
          {bill.order?.id && <div>Token No.: {bill.order.id.slice(-3).toUpperCase()}</div>}
        </div>

        <div className="border-t-2 border-black my-2"></div>

        <div className="w-full mt-1">
          <div className="grid grid-cols-[3fr_1fr_1.5fr_1.5fr] text-[10px] font-bold">
            <span>No.Item</span>
            <span className="text-center">Qty.</span>
            <span className="text-right">Price</span>
            <span className="text-right">Amou</span>
          </div>
          
          <div className="border-t border-black my-1"></div>

          <div className="space-y-1">
            {mergedItems.map((item: any, idx: number) => (
              <div key={idx} className="text-[10px] font-bold">
                <div className="grid grid-cols-[3fr_1fr_1.5fr_1.5fr]">
                  <span className="truncate pr-1">{idx + 1} {item.menuItem?.name || item.name || 'Item'}</span>
                  <span className="text-center">{item.quantity}</span>
                  <span className="text-right">{(item.menuItem?.price || item.price || 0).toFixed(2)}</span>
                  <span className="text-right">{(item.quantity * (item.menuItem?.price || item.price || 0)).toFixed(2)}</span>
                </div>
                {item.cleanInstr && (
                  <div className="text-[9px] italic ml-3 mt-0.5">Note: {item.cleanInstr}</div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-black my-2"></div>

        <div className="grid grid-cols-[3fr_1fr_1.5fr_1.5fr] text-[10px] font-bold">
          <span className="col-span-1"></span>
          <span className="col-span-3 flex justify-between">
            <span>Total Qty: {mergedItems.reduce((acc: number, item: any) => acc + item.quantity, 0)}</span>
            <span>Sub Total</span>
            <span>{bill.subtotal.toFixed(2)}</span>
          </span>
        </div>

        {bill.serviceChargeApplied && bill.serviceChargeAmount > 0 && (
          <div className="grid grid-cols-[3fr_1fr_1.5fr_1.5fr] text-[10px] font-bold mt-0.5">
            <span className="col-span-1"></span>
            <span className="col-span-3 flex justify-between">
              <span></span>
              <span>Service (10%)</span>
              <span>{bill.serviceChargeAmount.toFixed(2)}</span>
            </span>
          </div>
        )}

        {bill.gstApplied !== false && bill.tax > 0 && (
          <>
            <div className="grid grid-cols-[3fr_1fr_1.5fr_1.5fr] text-[10px] font-bold mt-0.5">
              <span className="col-span-1"></span>
              <span className="col-span-3 flex justify-between">
                <span></span>
                <span>CGST (9%)</span>
                <span>{(bill.tax / 2).toFixed(2)}</span>
              </span>
            </div>
            <div className="grid grid-cols-[3fr_1fr_1.5fr_1.5fr] text-[10px] font-bold mt-0.5">
              <span className="col-span-1"></span>
              <span className="col-span-3 flex justify-between">
                <span></span>
                <span>SGST (9%)</span>
                <span>{(bill.tax / 2).toFixed(2)}</span>
              </span>
            </div>
          </>
        )}

        {bill.discountPercent > 0 && (
          <div className="grid grid-cols-[3fr_1fr_1.5fr_1.5fr] text-[10px] font-bold mt-0.5">
            <span className="col-span-1"></span>
            <span className="col-span-3 flex justify-between">
              <span></span>
              <span>Discount</span>
              <span>-{((bill.subtotal * bill.discountPercent) / 100).toFixed(2)}</span>
            </span>
          </div>
        )}

        {bill.pointsRedeemed > 0 && (
          <div className="grid grid-cols-[3fr_1fr_1.5fr_1.5fr] text-[10px] font-bold mt-0.5">
            <span className="col-span-1"></span>
            <span className="col-span-3 flex justify-between">
              <span></span>
              <span>Points</span>
              <span>-{bill.pointsRedeemed.toFixed(2)}</span>
            </span>
          </div>
        )}

        <div className="border-t-2 border-black my-2"></div>

        <div className="flex justify-between text-sm font-black uppercase">
          <span>Grand Total</span>
          <span>₹ {bill.total.toFixed(2)}</span>
        </div>

        <div className="border-t-2 border-black my-2"></div>

        <div className="text-center font-bold text-xs mt-2">
          Thanks for ordering
        </div>

        {bill.status === 'PAID' && (
          <div className="text-center font-bold text-[10px] mt-2">
            ✓ PAID - {bill.paymentMethod || 'CASH'}
          </div>
        )}
      </div>
    </div>
  );
}
