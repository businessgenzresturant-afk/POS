import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { error, session } = await checkAuth();
    if (error || !session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Wrap the deletions in a transaction to ensure atomic cleanup
    await prisma.$transaction(async (tx) => {
      // 1. Delete all PointTransactions (they depend on Bills/Customers)
      await tx.pointTransaction.deleteMany({});
      
      // 2. Delete all OrderItems (they depend on Orders)
      await tx.orderItem.deleteMany({});
      
      // 3. Delete all Bills (they depend on Orders/Tables/Customers)
      await tx.bill.deleteMany({});
      
      // 4. Delete all Orders
      await tx.order.deleteMany({});
      
      // 5. Reset all Table statuses to AVAILABLE
      await tx.table.updateMany({
        data: {
          status: 'AVAILABLE'
        }
      });
    });

    return NextResponse.json({ success: true, message: 'Testing data successfully cleaned and tables reset to AVAILABLE.' });
  } catch (error) {
    console.error('Database Clean Error:', error);
    return NextResponse.json({ error: 'Failed to clean database' }, { status: 500 });
  }
}
