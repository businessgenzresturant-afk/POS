import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

/**
 * Production Cleanup Endpoint
 * Clears all testing/demo data while preserving core configuration
 * Only accessible by ADMIN users
 */
export async function POST(req: Request) {
  try {
    const { error, session } = await checkAuth();
    if (error || !session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    // Execute cleanup in a transaction for data integrity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete all transactional data (order matters for foreign keys)
      const deletedPointTransactions = await tx.pointTransaction.deleteMany({});
      const deletedOrderItems = await tx.orderItem.deleteMany({});
      const deletedBills = await tx.bill.deleteMany({});
      const deletedOrders = await tx.order.deleteMany({});
      
      // 2. Reset customer data (optional - keep customer history or wipe)
      const deletedCustomers = await tx.customer.deleteMany({});
      
      // 3. Reset all tables to AVAILABLE
      const updatedTables = await tx.table.updateMany({
        data: {
          status: 'AVAILABLE'
        }
      });

      return {
        deletedPointTransactions: deletedPointTransactions.count,
        deletedOrderItems: deletedOrderItems.count,
        deletedBills: deletedBills.count,
        deletedOrders: deletedOrders.count,
        deletedCustomers: deletedCustomers.count,
        resetTables: updatedTables.count
      };
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Production database successfully cleaned. All test data removed, tables reset.',
      stats: result
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Production cleanup error:', error);
    }
    return NextResponse.json({ 
      error: 'Failed to clean database', 
      detail: error?.message 
    }, { status: 500 });
  }
}
