import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

// PATCH - Cancel an order item (set status to CANCELLED)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { status, cancelReason } = body;

    if (status !== 'CANCELLED') {
      return NextResponse.json(
        { error: 'Only CANCELLED status is allowed' },
        { status: 400 }
      );
    }

    // Require cancel reason
    if (!cancelReason || cancelReason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Cancellation reason is required' },
        { status: 400 }
      );
    }

    // Get user ID from authenticated session
    const userId = (auth.session.user as any).id;

    // Verify the order item exists and belongs to an order in the user's restaurant
    const restaurantId = (auth.session.user as any).restaurantId;
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: params.itemId,
        orderId: params.id,
        order: {
          OR: [
            { table: { restaurantId } },
            { items: { some: { menuItem: { restaurantId } } } }
          ]
        }
      },
      include: {
        order: true
      }
    });

    if (!orderItem) {
      return NextResponse.json(
        { error: 'Order item not found' },
        { status: 404 }
      );
    }

    // Don't allow cancelling items from already billed orders
    const bill = await prisma.bill.findFirst({
      where: { orderId: params.id, status: 'PAID' }
    });

    if (bill) {
      return NextResponse.json(
        { error: 'Cannot cancel items from paid orders' },
        { status: 400 }
      );
    }

    // Update the order item status and recalculate order total
    const result = await prisma.$transaction(async (tx) => {
      // Cancel the item with reason and user ID
      const updatedItem = await tx.orderItem.update({
        where: { id: params.itemId },
        data: { 
          status: 'CANCELLED',
          cancelReason: cancelReason.trim(),
          cancelledByUserId: userId
        }
      });

      // Recalculate order total (sum of ACTIVE items only)
      const activeItems = await tx.orderItem.findMany({
        where: {
          orderId: params.id,
          status: 'ACTIVE'
        }
      });

      const newTotal = activeItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // Update order total
      await tx.order.update({
        where: { id: params.id },
        data: { totalAmount: newTotal }
      });

      return updatedItem;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error cancelling order item:', error);
    return NextResponse.json(
      { error: 'Failed to cancel order item' },
      { status: 500 }
    );
  }
}
