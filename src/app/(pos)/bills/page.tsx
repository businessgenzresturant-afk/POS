import { useState } from 'react';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';

export default async function BillsPage() {
  const [bills, setBills] = useState([]);
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);

  useEffect(() => {
    // Fetch bills with their associated orders and tables
    const loadBills = async () => {
      const billsData = await prisma.bill.findMany({
        include: {
          order: {
            include: {
              table: true,
              items: {
                include: {
                  menuItem: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      setBills(billsData);
    };

    loadBills();
  }, []);

  const handleGenerateBill = async (orderId: number) => {
    // Check if bill already exists for this order
    const existingBill = await prisma.bill.findFirst({
      where: { orderId }
    });
    
    if (existingBill) {
      setSelectedBill(existingBill);
      setShowBillModal(true);
      return;
    }

    // Get the order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: true,
        items: {
          include: {
            menuItem: true
          }
        }
      }
    });

    if (!order) return;

    // Calculate bill amounts
    const subtotal = order.totalAmount;
    const taxRate = 0.18; // 18% GST (example)
    const taxAmount = subtotal * taxRate;
    const discountAmount = 0; // Could be made configurable
    const finalAmount = subtotal + taxAmount - discountAmount;

    // Create the bill
    const bill = await prisma.bill.create({
      data: {
        orderId: order.id,
        amount: subtotal,
        taxAmount,
        discountAmount,
        finalAmount,
        status: 'pending'
      }
    });

    setSelectedBill(bill);
    setShowBillModal(true);
  };

  const handleMarkPaid = async (billId: number, paymentMethod: string) => {
    await prisma.bill.update({
      where: { id: billId },
      data: {
        status: 'paid',
        paymentMethod
      }
    });
    
    // Also update the order payment status
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: { order: true }
    });
    
    if (bill?.order) {
      await prisma.order.update({
        where: { id: bill.order.id },
        data: { paymentStatus: 'paid' }
      });
    }
    
    setShowBillModal(false);
    window.location.reload();
  };

  const handlePrintBill = () => {
    // In a real implementation, this would trigger browser print
    // or connect to a thermal printer
    if (selectedBill) {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4">
        <h1 className="text-2xl font-bold flex items-center justify-between">
          Bills & Payments
          <Button 
            variant="outline"
            onClick={() => {
              // Find completed orders without bills to generate bill for
              const completedOrder = bills
                .map(b => b.order)
                .find(o => o && o.status === 'completed' && 
                  !bills.some(b => b.orderId === o.id));
              
              if (completedOrder) {
                handleGenerateBill(completedOrder.id);
              } else {
                alert('No completed orders available for billing');
              }
            }}
          >
            Generate Bill
          </Button>
        </h1>
        <p className="text-sm text-gray-500">
          Generate and manage bills for completed orders
        </p>
      </div>
      
      {/* Bill Modal */}
      {showBillModal && selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Bill #{selectedBill.id}</h2>
              <Button 
                variant="outline"
                onClick={() => setShowBillModal(false)}
                className="text-gray-500 hover:bg-gray-100"
              >
                Close
              </Button>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Order Information</h3>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Order #:</span> 
                  <span>#{selectedBill.order.id}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium">Table #:</span> 
                  <span>#{selectedBill.order.table.number}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium">Customer:</span> 
                  <span>{selectedBill.order.customerName || 'Walk-in'}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium">Date & Time:</span> 
                  <span>{new Date(selectedBill.order.createdAt).toLocaleString()}</span>
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Item Details</h3>
              <div className="space-y-3">
                {selectedBill.order.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm py-1">
                    <span>{item.quantity}x {item.menuItem.name}</span>
                    <span>₹{(item.quantity * item.unitPrice).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Billing Summary</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Subtotal:</p>
                    <p className="text-lg font-medium">₹{selectedBill.amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tax (18%):</p>
                    <p className="text-lg font-medium">₹{selectedBill.taxAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Discount:</p>
                    <p className="text-lg font-medium">-₹{selectedBill.discountAmount.toFixed(2)}</p>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-500 font-medium">Total Amount:</p>
                    <p className="text-xl font-bold text-right">₹{selectedBill.finalAmount.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Payment Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Status:</p>
                  <p className={`text-lg font-medium 
                    ${selectedBill.status === 'pending' ? 'text-yellow-600' : 'text-green-600'}`}>
                    {selectedBill.status.charAt(0).toUpperCase() + selectedBill.status.slice(1)}
                  </p>
                </div>
                {selectedBill.status === 'paid' && (
                  <div>
                    <p className="text-sm text-gray-500">Payment Method:</p>
                    <p className="text-lg font-medium">{selectedBill.paymentMethod || 'Not specified'}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              {selectedBill.status === 'pending' && (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // In a real app, this would integrate with payment gateway
                      const paymentMethod = prompt('Enter payment method (cash, card, UPI, etc.)') || 'cash';
                      handleMarkPaid(selectedBill.id, paymentMethod);
                    }}
                  >
                    Mark as Paid
                  </Button>
                  <Button 
                    onClick={handlePrintBill}
                    className="bg-primary text-white"
                  >
                    Print Bill
                  </Button>
                </>
              )}
              
              {selectedBill.status === 'paid' && (
                <Button 
                  onClick={handlePrintBill}
                  className="bg-primary text-white"
                >
                  Re-print Bill
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Bills List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Bill History</h2>
        
        {bills.length === 0 ? (
          <p className="text-center py-8 text-gray-500">
            No bills generated yet. Complete some orders to generate bills.
          </p>
        ) : (
          <div className="space-y-4">
            {bills.map((bill) => (
              <div key={bill.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">Bill #{bill.id}</h3>
                    <p className="text-sm text-gray-500">
                      Order #{bill.order.id} • Table #{bill.order.table.number} • 
                      {new Date(bill.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full 
                      ${bill.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'}`}>
                      {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                    </span>
                    {bill.status === 'paid' && (
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrintBill()}
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        Print
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-lg font-medium text-right">
                    Amount: ₹{bill.finalAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
