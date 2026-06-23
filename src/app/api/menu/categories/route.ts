import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

// GET list of unique categories
export async function GET(request: Request) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const restaurantId = (auth.session.user as any).restaurantId;
    
    // Get distinct categories from menu items
    const menuItems = await prisma.menuItem.findMany({
      where: { restaurantId },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' }
    });

    const categories = menuItems.map(item => item.category);

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
