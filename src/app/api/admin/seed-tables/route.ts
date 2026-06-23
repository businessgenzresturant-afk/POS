import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function POST() {
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

    if (!user || user.role !== 'ADMIN' || !user.restaurantId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('[SEED] Starting table seeding for restaurant:', user.restaurantId);

    // Check existing tables
    const existingTables = await prisma.table.findMany({
      where: { restaurantId: user.restaurantId },
    });

    if (existingTables.length > 0) {
      return NextResponse.json({
        message: 'Tables already exist',
        count: existingTables.length,
        tables: existingTables.map(t => ({ number: t.number, capacity: t.capacity, status: t.status })),
      });
    }

    // Create 10 tables
    const tableData = [
      { number: 1, capacity: 2 },
      { number: 2, capacity: 2 },
      { number: 3, capacity: 4 },
      { number: 4, capacity: 4 },
      { number: 5, capacity: 4 },
      { number: 6, capacity: 6 },
      { number: 7, capacity: 6 },
      { number: 8, capacity: 8 },
      { number: 9, capacity: 2 },
      { number: 10, capacity: 4 },
    ];

    const createdTables = [];
    for (const table of tableData) {
      const created = await prisma.table.create({
        data: {
          number: table.number,
          capacity: table.capacity,
          status: 'AVAILABLE',
          restaurantId: user.restaurantId,
        },
      });
      createdTables.push(created);
    }

    console.log(`[SEED] Created ${createdTables.length} tables successfully`);

    return NextResponse.json({
      success: true,
      message: `Created ${createdTables.length} tables successfully`,
      tables: createdTables.map(t => ({ number: t.number, capacity: t.capacity, status: t.status })),
    });

  } catch (error) {
    console.error('[SEED] Error:', error);
    return NextResponse.json(
      { error: 'Failed to seed tables', details: (error as any).message },
      { status: 500 }
    );
  }
}
