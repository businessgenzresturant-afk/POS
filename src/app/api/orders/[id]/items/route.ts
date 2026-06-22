import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';
import { checkRateLimit, RateLimitPresets, createRateLimitResponse } from '@/lib/rateLimit';

// Force dynamic route to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * PATCH /api/orders/[id]/items
 * Cancel an individual item in an order
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimit = checkRateLimit(request, RateLimitPresets.API);
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit.resetAt);
  }

  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { itemId, status, cancelReason } = body;
    const orderId = id;
    const userId = (auth.session.user as any).id;

    // Validation
    if (!itemId) {
      return NextResponse.json(
        { error: 'itemId is required' },
        { status: 400 }
      );
    }

    if (!status || !['ACTIVE', 'CANCELLED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be ACTIVE or CANCELLED' },
        { status: 400 }
      );
    }

    // RBAC: Require cancel reason when cancelling an item (for accountability)
    if (status === 'CANCELLED' && (!cancelReason || cancelReason.trim() === '')) {
      return NextResponse.json(
        { error: 'Cancel reason is required for accountability. Please provide a reason.' },
        { status: 400 }
      );
    }

    // Verify the order exists and belongs to the restaurant
    const restaurantId = (auth.session.user as any).restaurantId;
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        OR: [
          { table: { restaurantId } },
          { items: { some: { menuItem: { restaurantId } } } }
        ]
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Find the specific item
    const orderItem = order.items.find(item => item.id === itemId);
    if (!orderItem) {
      return NextResponse.json(
        { error: 'Order item not found' },
        { status: 404 }
      );
    }

    // Don't allow cancelling if order is already completed
    if (order.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot modify items on a completed order' },
        { status: 400 }
      );
    }

    // Update the item status and recalculate order total
    const result = await prisma.$transaction(async (tx) => {
      // Update the item status with cancel reason and userId
      const updatedItem = await tx.orderItem.update({
        where: { id: itemId },
        data: { 
          status,
          cancelReason: status === 'CANCELLED' ? cancelReason : null,
          cancelledByUserId: status === 'CANCELLED' ? userId : null
        }
      });

      // Recalculate order total (excluding cancelled items)
      const activeItems = await tx.orderItem.findMany({
        where: {
          orderId,
          status: 'ACTIVE'
        }
      });

      const newTotal = activeItems.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);

      // Update order total
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { totalAmount: newTotal },
        include: {
          table: true,
          items: {
            include: {
              menuItem: true
            }
          }
        }
      });

      // If item was cancelled, restore stock
      if (status === 'CANCELLED' && orderItem.menuItem.stockQuantity !== null) {
        await tx.menuItem.update({
          where: { id: orderItem.menuItemId },
          data: {
            stockQuantity: { increment: orderItem.quantity },
            available: true // Make available again
          }
        });
      }

      return updatedOrder;
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error updating order item:', error);
    return NextResponse.json(
      { error: 'Failed to update order item' },
      { status: 500 }
    );
  }
}
