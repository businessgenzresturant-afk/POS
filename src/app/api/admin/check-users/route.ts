import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

/**
 * ADMIN-ONLY: Check all user accounts in production database
 * Used to verify no unauthorized accounts were created during empty-database window
 */
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is ADMIN
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('[CHECK-USERS] Admin check initiated by:', user.email);

    // Get all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        restaurantId: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Get table count
    const tableCount = await prisma.table.count();

    // Get menu item count
    const menuCount = await prisma.menuItem.count();

    // Get order count
    const orderCount = await prisma.order.count();

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      databaseStatus: {
        users: allUsers.length,
        tables: tableCount,
        menuItems: menuCount,
        orders: orderCount,
      },
      users: allUsers.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt.toISOString(),
        restaurantId: u.restaurantId,
      })),
      expectedAccounts: [
        'admin@genz.com (ADMIN - from seed)',
        'staff@genz.com (STAFF - from seed)',
        'business.genzresturant@gmail.com (ADMIN - manually created)',
      ],
    };

    console.log('[CHECK-USERS] Database status:', response.databaseStatus);
    console.log('[CHECK-USERS] User count:', allUsers.length);

    return NextResponse.json(response);

  } catch (error) {
    console.error('[CHECK-USERS] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check users', details: (error as any).message },
      { status: 500 }
    );
  }
}
