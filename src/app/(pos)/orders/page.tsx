import { useState, useEffect } from 'react';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default async function OrdersPage() {
  // Fetch data for the order interface
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  
  const [orderState, setOrderState] = useState({
    tableId: null,
    items: [] as Array<{ menuItemId: number; quantity: number; specialInstructions: string }>,
    customerName: '',
    customerPhone: ''
  });

  useEffect(() => {
    // Fetch initial data
    const loadData = async () => {
      const [tablesData, menuItemsData, ordersData] = await Promise.all([
        prisma.table.findMany({ orderBy: { number: 'asc' } }),
        prisma.menuItem.findMany({ where: { isAvailable: true }, orderBy: { category: 'asc', name: 'asc' } }),
        prisma.order.findMany({
          where: { status: { in: ['pending', 'preparing', 'ready'] } },
          include: { table: true, items: { include: { menuItem: true } } },
          orderBy: { createdAt: 'desc' }
        })
      ]);
      
      setTables(tablesData);
      setMenuItems(menuItemsData);
      setActiveOrders(ordersData);
    };
    
    loadData();
  }, []);

  const handleTableSelect = (tableId: number) => {
    setOrderState(prev => ({...prev, tableId}));
  };

  const handleAddItem = (menuItemId: number) => {
    setOrderState(prev => {
      const existingItemIndex = prev.items.findIndex(item => item.menuItemId === menuItemId);
      if (existingItemIndex >= 0) {
        // Item already in cart, increase quantity
        const newItems = [...prev.items];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + 1
        };
        return {...prev, items: newItems};
      } else {
        // New item to cart
        return {...prev, items: [...prev.items, { menuItemId, quantity: 1, specialInstructions: '' }]};
      }
    });
  };

  const handleUpdateQuantity = (menuItemId: number, quantity: number) => {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      setOrderState(prev => ({
        ...prev,
        items: prev.items.filter(item => item.menuItemId !== menuItemId)
      }));
    } else {
      // Update quantity
      setOrderState(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.menuItemId === menuItemId 
            ? {...item, quantity} 
            : item
        )
      }));
    }
  };

  const handleUpdateSpecialInstructions = (menuItemId: number, instructions: string) => {
    setOrderState(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.menuItemId === menuItemId 
          ? {...item, specialInstructions: instructions} 
          : item
      )
    }));
  };

  const handleRemoveItem = (menuItemId: number) => {
    setOrderState(prev => ({
      ...prev,
      items: prev.items.filter(item => item.menuItemId !== menuItemId)
    }));
  };

  const handleSubmitOrder = async () => {
    if (!orderState.tableId || orderState.items.length === 0) {
      alert('Please select a table and add items to the order');
      return;
    }

    // Calculate total amount
    let totalAmount = 0;
    const orderItemsWithDetails = await Promise.all(
      orderState.items.map(async (item) => {
        const menuItem = await prisma.menuItem.findUnique({
          where: { id: item.menuItemId }
        });
        totalAmount += menuItem.price * item.quantity;
        return {
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: menuItem.price,
          totalPrice: menuItem.price * item.quantity,
          specialInstructions: item.specialInstructions
        };
      })
    );

    // Create the order
    await prisma.order.create({
      data: {
        tableId: orderState.tableId,
        customerName: orderState.customerName,
        customerPhone: orderState.customerPhone,
        totalAmount,
        items: {
          create: orderItemsWithDetails
        }
      }
    });

    // Reset order state
    setOrderState({
      tableId: null,
      items: [],
      customerName: '',
      customerPhone: ''
    });
    
    // Refresh to show new order
    window.location.reload();
  };

  const handleCompleteOrder = async (orderId: number) => {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'completed' }
    });
    window.location.reload();
  };

  if (tables.length === 0 || menuItems.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-yellow-800">
            Loading data... Please make sure you have tables and menu items set up.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pb-4">
        <h1 className="text-2xl font-bold">Take Order</h1>
        <p className="text-sm text-gray-500">
          Create new orders for your tables
        </p>
      </div>
      
      {/* Order Interface */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Table Selection */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Select Table</h2>
            <div className="space-y-3">
              {tables.map((table) => (
                <Button
                  key={table.id}
                  onClick={() => handleTableSelect(table.id)}
                  className={ orderState.tableId === table.id
                    ? 'w-full text-left bg-primary text-white'
                    : table.status === 'available'
                      ? 'w-full text-left bg-green-50 text-green-800 hover:bg-green-100'
                      : 'w-full text-left bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className={table.status === 'available'
                        ? 'h-8 w-8 flex items-center justify-center bg-green-200 text-green-800 rounded-full'
                        : table.status === 'occupied'
                          ? 'h-8 w-8 flex items-center justify-center bg-red-200 text-red-800 rounded-full'
                          : table.status === 'reserved'
                            ? 'h-8 w-8 flex items-center justify-center bg-blue-200 text-blue-800 rounded-full'
                            : 'h-8 w-8 flex items-center justify-center bg-gray-200 text-gray-800 rounded-full'
                      }>
                        #{table.number}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Table {table.number}</div>
                      <div className="text-xs text-gray-500">
                        {table.capacity} seats • {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
          
          {/* Menu Items */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Menu Items</h2>
            <div className="space-y-3">
              {menuItems.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-500">{item.category}</p>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <div className="text-lg font-medium">₹{item.price}</div>
                      <Button variant="outline" size="sm" onClick={() => handleAddItem(item.id)} className="bg-primary text-white">
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Current Order Summary */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Current Order</h2>
            
            {/* Customer Info */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium mb-2">Customer Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    placeholder="Enter customer name"
                    value={orderState.customerName}
                    onChange={(e) => setOrderState(prev => ({...prev, customerName: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    value={orderState.customerPhone}
                    onChange={(e) => setOrderState(prev => ({...prev, customerPhone: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            {/* Order Items */}
            {orderState.items.length === 0 ? (
              <p className="text-center py-6 text-gray-500">
                No items added yet. Select menu items to begin.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="border-t border-gray-200 pt-4">
                  {orderState.items.map((cartItem, index) => (
                    <div key={index} className="flex justify-between items-start py-2 border-t border-gray-200">
                      <div className="flex-1">
                        <div className="font-medium">Item {index + 1}</div>
                      </div>
                      <div className="text-right space-x-3">
                        <div className="flex items-center space-x-2 text-sm">
                          <Button 
                            variant="outline"
                            size="xs"
                            onClick={() => handleUpdateQuantity(cartItem.menuItemId, Math.max(0, cartItem.quantity - 1))}
                            className="text-gray-500 hover:bg-gray-100"
                          >
                            −
                          </Button>
                          <span className="w-8 text-center">{cartItem.quantity}</span>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleUpdateQuantity(cartItem.menuItemId, cartItem.quantity + 1)}
                            className="text-gray-500 hover:bg-gray-100"
                          >
                            +
                          </Button>
                          <Button 
                            variant="outline"
                            size="xs"
                            onClick={() => handleRemoveItem(cartItem.menuItemId)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-6">
              <Button 
                onClick={handleSubmitOrder}
                className="w-full bg-primary text-white py-3"
              >
                Place Order
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Active Orders Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Active Orders</h2>
        
        {activeOrders.length === 0 ? (
          <p className="text-center py-8 text-gray-500">
            No active orders.
          </p>
        ) : (
          <div className="space-y-4">
            {activeOrders.map((order) => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">Order #{order.id}</h3>
                    <p className="text-sm text-gray-500">
                      Table #{order.table.number} • 
                      {order.customerName || 'Walk-in'} • 
                      {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={order.status === 'pending'
                        ? 'px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800'
                        : order.status === 'preparing'
                          ? 'px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800'
                          : 'px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800'
                      }>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCompleteOrder(order.id)}
                      className="text-green-600 hover:bg-green-50"
                    >
                      Complete
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        }
      </div>
    </div>
  );
}
