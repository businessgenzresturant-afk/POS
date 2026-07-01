import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAuth } from '@/lib/api-auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const { id: orderId } = await params;
    const { name, amount } = await request.json();
    
    if (!name || !amount || isNaN(parseFloat(amount))) {
      return NextResponse.json({ error: 'Valid name and amount are required' }, { status: 400 });
    }
    
    const parsedAmount = parseFloat(amount);
    const restaurantId = (auth.session.user as any).restaurantId;

    // Check if order exists and belongs to restaurant
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        items: { some: { menuItem: { restaurantId } } }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Find or create 'Custom Charge' menuItem
    let menuItem = await prisma.menuItem.findFirst({
      where: { name: 'Custom Charge', restaurantId }
    });

    if (!menuItem) {
      menuItem = await prisma.menuItem.create({
        data: {
          name: 'Custom Charge',
          price: 0,
          category: 'Custom Charges',
          imageUrl: '',
          restaurantId,
          dietType: 'VEG',
          available: true
        }
      });
    }

    // Add item to order
    await prisma.orderItem.create({
      data: {
        orderId,
        menuItemId: menuItem.id,
        quantity: 1,
        price: parsedAmount,
        specialInstructions: name
      }
    });

    // If order has a PENDING bill, delete it so it gets regenerated accurately when requested
    if (order.status !== 'COMPLETED') {
      const pendingBill = await prisma.bill.findFirst({
        where: { orderId, status: 'PENDING' }
      });
      if (pendingBill) {
        await prisma.bill.delete({ where: { id: pendingBill.id } });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Add custom charge error:', error);
    return NextResponse.json({ error: 'Failed to add custom charge' }, { status: 500 });
  }
}
