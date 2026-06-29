import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { error, session } = await checkAuth();
    if (error || !session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all critical configuration data
    const [
      restaurants,
      menuItems,
      users,
      tables,
    ] = await Promise.all([
      prisma.restaurant.findMany(),
      prisma.menuItem.findMany(),
      prisma.user.findMany(),
      prisma.table.findMany(),
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      restaurants,
      menuItems,
      users,
      tables,
    };

    return NextResponse.json(backupData);
  } catch (error) {
    console.error('Backup Error:', error);
    return NextResponse.json({ error: 'Failed to generate backup' }, { status: 500 });
  }
}
