import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  // Only Admin or Manager should access customer data
  const userRole = (auth.session.user as any).role;
  if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100 per page
    const skip = (page - 1) * limit;

    // ✅ FIXED: Split into two lean queries instead of one massive N+1 join
    // Query 1: Get customers with their summary stats (no deep nesting)
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        skip,
        take: limit,
        orderBy: { totalSpend: 'desc' },
        select: {
          id: true,
          phone: true,
          name: true,
          totalVisits: true,
          totalSpend: true,
          pointsBalance: true,
          createdAt: true,
          updatedAt: true,
          // ✅ Lean bill summary — just IDs and amounts, NOT full items tree
          bills: {
            orderBy: { createdAt: 'desc' },
            take: 10, // Last 10 bills only (not all time)
            select: {
              id: true,
              total: true,
              subtotal: true,
              status: true,
              paymentMethod: true,
              createdAt: true,
              paidAt: true,
              order: {
                select: {
                  id: true,
                  orderType: true,
                  // ✅ Only item names + qty for history display, NOT full menuItem object
                  items: {
                    where: { status: 'ACTIVE' },
                    select: {
                      quantity: true,
                      price: true,
                      menuItem: { select: { name: true, category: true } }
                    }
                  }
                }
              }
            }
          },
          // ✅ Only last 5 point transactions
          pointTransactions: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              points: true,
              type: true,
              createdAt: true
            }
          }
        }
      }),
      prisma.customer.count()
    ]);

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer data' },
      { status: 500 }
    );
  }
}
