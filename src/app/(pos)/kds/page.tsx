'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Flame, UtensilsCrossed, ShoppingBag, Bike, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function KitchenDisplaySystem() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const previousOrdersRef = useRef<any[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/orders?status=PENDING,PREPARING');
      if (!response.ok) return;
      const data = await response.json();
      
      // Detect new urgent additions or new orders to play sound
      const prev = previousOrdersRef.current;
      if (prev.length > 0) {
        let playUrgentSound = false;
        let playNewSound = false;

        data.forEach((order: any) => {
          const oldOrder = prev.find(o => o.id === order.id);
          if (!oldOrder) {
            playNewSound = true;
          } else if (order.items.length > oldOrder.items.length) {
            // Check if any item was added significantly after order creation
            const orderTime = new Date(order.createdAt).getTime();
            const hasUrgent = order.items.some((i: any) => {
              return new Date(i.createdAt).getTime() - orderTime > 60000; // > 1 min diff
            });
            if (hasUrgent) playUrgentSound = true;
            else playNewSound = true;
          }
        });

        if (playUrgentSound) {
          toast.error('🔥 URGENT RUNNING TABLE ADDITION!', { duration: 5000 });
          playSound('/urgent.mp3');
          setTimeout(() => playSound('/urgent.mp3'), 200);
          setTimeout(() => playSound('/urgent.mp3'), 400);
        } else if (playNewSound) {
          toast.success('🔔 NEW ORDER RECEIVED', { duration: 3000 });
          playSound('/new-order.mp3');
        }
      }

      previousOrdersRef.current = data;
      setOrders(data);
    } catch (error) {
      console.error('Error fetching KDS:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const playSound = (src: string) => {
    try {
      const audio = new Audio(src);
      // We ignore play errors (e.g. browser autoplay policies or missing files)
      audio.play().catch(() => {});
    } catch (e) {}
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000); // 3 second aggressive polling for kitchen
    return () => clearInterval(interval);
  }, [fetchOrders]);

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse text-2xl font-black">LOADING KDS...</div>
      </div>
    );
  }

  // Extract Urgent Additions
  const urgentAdditions: any[] = [];
  const normalOrders = orders.map(order => {
    const normalItems: any[] = [];
    const urgentItems: any[] = [];
    const orderTime = new Date(order.createdAt).getTime();
    
    order.items.forEach((item: any) => {
      const isUrgent = new Date(item.createdAt).getTime() - orderTime > 60000;
      if (isUrgent) {
        urgentItems.push(item);
      } else {
        normalItems.push(item);
      }
    });

    if (urgentItems.length > 0) {
      urgentAdditions.push({
        ...order,
        items: urgentItems
      });
    }

    return {
      ...order,
      items: normalItems
    };
  }).filter(o => o.items.length > 0);

  const dineIn = normalOrders.filter(o => o.orderType === 'DINE_IN');
  const takeaway = normalOrders.filter(o => o.orderType === 'TAKEAWAY');
  const parcel = normalOrders.filter(o => o.orderType === 'PARCEL');
  const delivery = normalOrders.filter(o => o.orderType === 'DELIVERY');

  const OrderCard = ({ order, type, icon: Icon, isUrgent = false }: any) => {
    const diffSecs = Math.floor((now.getTime() - new Date(order.createdAt).getTime()) / 1000);
    const mins = Math.floor(diffSecs / 60);
    const secs = diffSecs % 60;
    
    const timeColor = mins >= 10 ? 'text-red-500' : mins >= 5 ? 'text-amber-500' : 'text-green-500';

    return (
      <Card className={`p-4 border-2 ${isUrgent ? 'bg-red-950 border-red-500 shadow-lg shadow-red-500/20' : 'bg-zinc-900 border-zinc-800'}`}>
        <div className={`flex justify-between items-start pb-3 border-b ${isUrgent ? 'border-red-800' : 'border-zinc-800'} mb-3`}>
          <div className="flex items-center gap-2">
            {Icon && <Icon className={`w-6 h-6 ${isUrgent ? 'text-red-500' : 'text-zinc-400'}`} />}
            <span className={`text-xl font-black ${isUrgent ? 'text-red-500' : 'text-white'}`}>
              {order.table ? `Table ${order.table.number}` : type}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-zinc-500 text-xs font-bold">
              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className={`text-sm font-black ${timeColor}`}>
              {mins.toString().padStart(2, '0')}m {secs.toString().padStart(2, '0')}s
            </span>
          </div>
        </div>
      <div className="space-y-3">
        {order.items.map((item: any, i: number) => (
          <div key={i} className="flex justify-between items-start">
            <div className="flex-1">
              <p className={`font-bold text-lg ${isUrgent ? 'text-red-100' : 'text-zinc-100'}`}>
                <span className={`${isUrgent ? 'text-red-400' : 'text-primary'} mr-2`}>{item.quantity}×</span>
                {item.menuItem?.name || 'Unknown'}
              </p>
              {item.specialInstructions && (
                <p className={`text-sm mt-1 font-medium ${isUrgent ? 'text-red-300' : 'text-zinc-400'}`}>
                  📝 {item.specialInstructions}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
        {isUrgent && (
          <div className="mt-4 pt-3 border-t border-red-800 text-center animate-pulse">
            <span className="bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full tracking-widest">
              RUNNING TABLE
            </span>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-black p-6 overflow-x-hidden font-sans">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-zinc-800">
        <h1 className="text-4xl font-black text-white tracking-tight">KITCHEN DISPLAY</h1>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-full border border-zinc-800">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-zinc-300 font-bold text-sm tracking-wider">LIVE</span>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        
        {/* Urgent Additions Row */}
        {urgentAdditions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-red-500 flex items-center gap-2">
              <Flame className="w-8 h-8" /> 
              URGENT ADDITIONS (RUNNING TABLES)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {urgentAdditions.map(order => (
                <OrderCard key={`${order.id}-urgent`} order={order} type="Dine In" icon={UtensilsCrossed} isUrgent={true} />
              ))}
            </div>
          </div>
        )}

        {/* Regular Queues */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* Dine In */}
          <div className="space-y-4">
            <h2 className="text-xl font-black text-blue-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
              <UtensilsCrossed /> DINE IN ({dineIn.length})
            </h2>
            <div className="space-y-4">
              {dineIn.map(order => <OrderCard key={order.id} order={order} type="Dine In" icon={UtensilsCrossed} />)}
              {dineIn.length === 0 && <p className="text-zinc-600 font-bold italic">No active orders</p>}
            </div>
          </div>

          {/* Takeaway */}
          <div className="space-y-4">
            <h2 className="text-xl font-black text-amber-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
              <ShoppingBag /> TAKEAWAY ({takeaway.length})
            </h2>
            <div className="space-y-4">
              {takeaway.map(order => <OrderCard key={order.id} order={order} type="Takeaway" icon={ShoppingBag} />)}
              {takeaway.length === 0 && <p className="text-zinc-600 font-bold italic">No active orders</p>}
            </div>
          </div>

          {/* Parcel */}
          <div className="space-y-4">
            <h2 className="text-xl font-black text-emerald-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
              <Package /> PARCEL ({parcel.length})
            </h2>
            <div className="space-y-4">
              {parcel.map(order => <OrderCard key={order.id} order={order} type="Parcel" icon={Package} />)}
              {parcel.length === 0 && <p className="text-zinc-600 font-bold italic">No active orders</p>}
            </div>
          </div>

          {/* Delivery */}
          <div className="space-y-4">
            <h2 className="text-xl font-black text-rose-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
              <Bike /> DELIVERY ({delivery.length})
            </h2>
            <div className="space-y-4">
              {delivery.map(order => <OrderCard key={order.id} order={order} type="Delivery" icon={Bike} />)}
              {delivery.length === 0 && <p className="text-zinc-600 font-bold italic">No active orders</p>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
