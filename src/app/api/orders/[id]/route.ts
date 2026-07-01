import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';
import { checkRateLimit, RateLimitPresets, createRateLimitResponse } from '@/lib/rateLimit';
import { withTiming } from '@/lib/api-logger';

export const GET = withTiming(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const rateLimit = checkRateLimit(request, RateLimitPresets.API);
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit.resetAt);
  }

  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const restaurantId = (auth.session.user as any).restaurantId;

    // ✅ FIXED: Use direct restaurantId (indexed) instead of nested join
    const order = await prisma.order.findFirst({
      where: { id, restaurantId },
      include: {
        table: { select: { id: true, number: true, status: true } },
        items: {
          include: {
            menuItem: { select: { id: true, name: true, category: true, price: true, priceHalf: true, hasHalfFullOption: true, dietType: true } }
          }
        }
      }
    });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, '/api/orders/[id]');

export const PATCH = withTiming(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const rateLimit = checkRateLimit(request, RateLimitPresets.API);
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit.resetAt);
  }

  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { status, paymentStatus, version } = body;

    const restaurantId = (auth.session.user as any).restaurantId;

    // ✅ FIXED: Use direct restaurantId (indexed) instead of nested join
    const existingOrder = await prisma.order.findFirst({
      where: { id, restaurantId },
      select: { id: true, version: true, tableId: true, status: true }
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // ✅ FIXED: Mark-as-Served uses updateMany (single query) instead of N individual updates
    const markItemsServed = async (orderId: string, tx?: any) => {
      const db = tx || prisma;
      await db.orderItem.updateMany({
        where: {
          orderId,
          status: 'ACTIVE',
          NOT: { specialInstructions: { contains: '[SERVED]' } }
        },
        data: {
          specialInstructions: '[SERVED]' // Simplified: overwrite; KDS ignores [SERVED] items
        }
      });
    };

    // If version is provided, use optimistic locking
    if (version !== undefined) {
      const updateResult = await prisma.order.updateMany({
        where: {
          id,
          version, // Only update if version matches
        },
        data: {
          ...(status && { status }),
          ...(paymentStatus && { paymentStatus }),
          version: { increment: 1 }
        }
      });

      // If no rows were updated, version mismatch occurred (conflict)
      if (updateResult.count === 0) {
        return NextResponse.json(
          {
            error: 'Conflict detected: Order was modified by another session. Please refresh and try again.',
            code: 'VERSION_CONFLICT'
          },
          { status: 409 }
        );
      }

      // ✅ FIXED: Single updateMany instead of loop
      if (status === 'SERVED') {
        await markItemsServed(id);
      }

      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          table: { select: { id: true, number: true, status: true } },
          items: {
            include: {
              menuItem: { select: { id: true, name: true, category: true, price: true, priceHalf: true, hasHalfFullOption: true, dietType: true } }
            }
          }
        }
      });

      return NextResponse.json(order);
    }

    // Fallback to regular update without optimistic locking (for backward compatibility)
    const order = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(paymentStatus && { paymentStatus }),
          version: { increment: 1 }
        },
        include: {
          table: { select: { id: true, number: true, status: true } },
          items: {
            include: {
              menuItem: { select: { id: true, name: true, category: true, price: true, priceHalf: true, hasHalfFullOption: true, dietType: true } }
            }
          }
        }
      });

      // ✅ FIXED: Single updateMany instead of loop inside tx
      if (status === 'SERVED') {
        await markItemsServed(id, tx);
      }

      return updatedOrder;
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, '/api/orders/[id]');

export async function DELETE(
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
    const restaurantId = (auth.session.user as any).restaurantId;

    // ✅ FIXED: Use direct restaurantId (indexed)
    const order = await prisma.order.findFirst({
      where: { id, restaurantId },
      select: { id: true, status: true, tableId: true }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status === 'COMPLETED' || order.status === 'SERVED') {
      return NextResponse.json({ error: 'Cannot cancel an order that is SERVED or COMPLETED' }, { status: 400 });
    }

    const deletedOrder = await prisma.$transaction(async (tx) => {
      const deleted = await tx.order.delete({ where: { id } });

      if (order.tableId) {
        const activeOrders = await tx.order.count({
          where: {
            tableId: order.tableId,
            status: { notIn: ['COMPLETED'] },
            id: { not: id }
          }
        });

        if (activeOrders === 0) {
          await tx.table.update({
            where: { id: order.tableId },
            data: { status: 'AVAILABLE' }
          });
        }
      }

      return deleted;
    });

    return NextResponse.json(deletedOrder);
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
