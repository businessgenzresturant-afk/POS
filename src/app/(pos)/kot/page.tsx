import { useState, useEffect } from 'react';
import { prisma } from '@/lib/prisma';

export default async function KOTPage() {
  const [orders, setOrders] = useState([]);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Fetch orders that need kitchen attention
    const loadKOTOrders = async () => {
      const kotOrders = await prisma.order.findMany({
        where: { 
          status: { in: ['pending', 'preparing'] } 
        },
        include: {
          table: true,
          items: {
            include: {
              menuItem: true
            }
          }
        },
        orderBy: { 
          createdAt: 'asc' 
        }
      });
      
      setOrders(kotOrders);
    };

    // Load initial data
    loadKOTOrders();

    // Set up refresh interval (every 10 seconds for real-time updates)
    const interval = setInterval(loadKOTOrders, 10000);
    setRefreshInterval(interval);

    // Cleanup on unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  const handleMarkPreparing = async (orderId: number) => {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'preparing' }
    });
    // Refresh will happen automatically via interval
  };

  const handleMarkReady = async (orderId: number) => {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'ready' }
    });
    // Refresh will happen automatically via interval
  };

  const getTimeElapsed = (createdAt: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(createdAt).getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    if (diffMinutes >= 60) {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}h ${minutes}m`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ${diffSeconds}s`;
    } else {
      return `${diffSeconds}s`;
    }
  };

  if (orders.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="mb-6">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m2 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <p className="text-xl font-medium text-gray-600">
            No orders waiting for kitchen
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Orders will appear here when they're placed by the service staff
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pb-4">
        <h1 className="text-2xl font-bold flex items-center justify-between">
          Kitchen Order Ticket (KOT)
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
        </h1>
        <p className="text-sm text-gray-500">
          Orders requiring kitchen preparation
        </p>
      </div>
      
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="border-l-4 border-primary bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h2 className="text-xl font-medium">Order #{order.id}</h2>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium">Table:</span>
                    <span className="font-semibold">#{order.table.number}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium">Time:</span>
                    <span className="font-mono text-xs">
                      {getTimeElapsed(order.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium">Status:</span>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full 
                      ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-blue-100 text-blue-800'}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right space-x-3">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkPreparing(order.id)}
                  disabled={order.status !== 'pending'}
                  className="text-yellow-600 hover:bg-yellow-50"
                >
                  Start Prep
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkReady(order.id)}
                  disabled={order.status !== 'preparing'}
                  className="text-blue-600 hover:bg-blue-50"
                >
                  Mark Ready
                </Button>
              </div>
            </div>
            
            {/* Customer Info (if available) */}
            {order.customerName || order.customerPhone ? (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h3 className="text-font-medium">Customer Info:</h3>
                <p className="text-sm">
                  {order.customerName || 'Walk-in'} 
                  {order.customerPhone ? ` | ${order.customerPhone}` : ''}
                </p>
              </div>
            ) : null}
            
            {/* Order Items */}
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Order Items:</h3>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{item.quantity}x {item.menuItem.name}</div>
                      {item.specialInstructions && (
                        <div className="mt-1 text-sm text-gray-600 italic p-2 bg-gray-100 rounded">
                          "{item.specialInstructions}"
                        </div>
                      )}
                    </div>
                    <div className="text-right space-x-3">
                      <div className="text-lg font-medium">₹{(item.quantity * item.unitPrice).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="text-lg font-medium text-right">
                Total: ₹{order.totalAmount.toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
