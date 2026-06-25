import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAuth } from '@/lib/api-auth';
import { checkRateLimit, RateLimitPresets, createRateLimitResponse } from '@/lib/rateLimit';

// Force dynamic route
export const dynamic = 'force-dynamic';

// DELETE a table
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

  // Restrict to ADMIN
  if ((auth.session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    
    // Check if table exists and belongs to the restaurant
    const table = await prisma.table.findUnique({
      where: { id },
    });

    if (!table || table.restaurantId !== (auth.session.user as any).restaurantId) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    // Check if table has active orders
    const activeOrders = await prisma.order.count({
      where: {
        tableId: id,
        status: {
          notIn: ['COMPLETED', 'SERVED'],
        },
      },
    });

    if (activeOrders > 0) {
      return NextResponse.json(
        { error: 'Cannot delete table with active orders' },
        { status: 400 }
      );
    }

    await prisma.table.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete table' },
      { status: 500 }
    );
  }
}