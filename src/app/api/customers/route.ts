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
    const customers = await prisma.customer.findMany({
      orderBy: { totalSpend: 'desc' },
      include: {
        bills: {
          orderBy: { createdAt: 'desc' },
          include: {
            order: {
              include: {
                items: {
                  include: {
                    menuItem: true
                  }
                }
              }
            }
          }
        },
        pointTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer data' },
      { status: 500 }
    );
  }
}
