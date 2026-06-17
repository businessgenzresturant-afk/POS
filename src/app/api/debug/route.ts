import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not Found', { status: 404 });
  }
  const results: Record<string, any> = {};
  
  // 1. Check if DATABASE_URL is set
  results.databaseUrl = process.env.DATABASE_URL 
    ? `Set (starts with: ${process.env.DATABASE_URL.substring(0, 30)}...)` 
    : 'NOT SET';
  results.directUrl = process.env.DIRECT_URL ? 'Set' : 'NOT SET';
  results.nextauthSecret = process.env.NEXTAUTH_SECRET ? 'Set' : 'NOT SET';
  results.nextauthUrl = process.env.NEXTAUTH_URL || 'NOT SET';
  
  // 2. Try connecting to DB
  try {
    await prisma.$connect();
    results.dbConnection = 'SUCCESS';
  } catch (e: any) {
    results.dbConnection = `FAILED: ${e.message}`;
    return NextResponse.json(results, { status: 500 });
  }

  // 3. Check if tables exist by counting
  try {
    results.userCount = await prisma.user.count();
  } catch (e: any) {
    results.userCount = `ERROR: ${e.message}`;
  }

  try {
    results.restaurantCount = await prisma.restaurant.count();
  } catch (e: any) {
    results.restaurantCount = `ERROR: ${e.message}`;
  }

  try {
    results.tableCount = await prisma.table.count();
  } catch (e: any) {
    results.tableCount = `ERROR: ${e.message}`;
  }

  try {
    results.menuItemCount = await prisma.menuItem.count();
  } catch (e: any) {
    results.menuItemCount = `ERROR: ${e.message}`;
  }

  // 4. List all users (email + role only, no passwords)
  try {
    const users = await prisma.user.findMany({ select: { email: true, role: true, name: true } });
    results.users = users;
  } catch (e: any) {
    results.users = `ERROR: ${e.message}`;
  }

  // 5. Try to auto-seed if empty
  if (typeof results.userCount === 'number' && results.userCount === 0) {
    try {
      const { hash } = await import('bcryptjs');
      
      let restaurant = await prisma.restaurant.findFirst();
      if (!restaurant) {
        restaurant = await prisma.restaurant.create({
          data: { id: '00000000-0000-0000-0000-000000000001', name: 'GenZ Restaurant', address: '123 Main Street' }
        });
      }

      await prisma.user.createMany({
        data: [
          { name: 'Admin User', email: 'admin@genz.com', password: await hash('admin123', 10), role: 'ADMIN', restaurantId: restaurant.id },
          { name: 'Staff User', email: 'staff@genz.com', password: await hash('staff123', 10), role: 'STAFF', restaurantId: restaurant.id },
        ]
      });
      results.autoSeed = 'SUCCESS - Created admin@genz.com and staff@genz.com';
      results.newUserCount = await prisma.user.count();
    } catch (e: any) {
      results.autoSeed = `FAILED: ${e.message}`;
    }
  }

  return NextResponse.json(results);
}
