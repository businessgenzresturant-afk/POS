import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

/**
 * ONE-TIME USER SETUP ENDPOINT
 * POST /api/admin/setup-users
 * 
 * Sets up exactly 2 users:
 *   1. ADMIN: business.genzresturant@gmail.com
 *   2. STAFF: staff.genz@gen-z.online
 * 
 * Protected by SETUP_SECRET header to prevent unauthorized access.
 * DISABLE THIS ENDPOINT AFTER FIRST USE by deleting this file.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { secret, adminPassword, staffPassword } = body;

    // Security: require secret token
    const expectedSecret = process.env.SETUP_SECRET || 'genz-setup-2024-secret';
    if (secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!adminPassword || adminPassword.length < 6) {
      return NextResponse.json({ error: 'adminPassword must be at least 6 characters' }, { status: 400 });
    }
    if (!staffPassword || staffPassword.length < 6) {
      return NextResponse.json({ error: 'staffPassword must be at least 6 characters' }, { status: 400 });
    }

    // Get the restaurant
    const restaurant = await prisma.restaurant.findFirst({
      select: { id: true, name: true }
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'No restaurant found in database' }, { status: 404 });
    }

    // Hash passwords
    const [hashedAdmin, hashedStaff] = await Promise.all([
      bcrypt.hash(adminPassword, 12),
      bcrypt.hash(staffPassword, 12),
    ]);

    // Delete ALL existing users for this restaurant (clean slate)
    const deleted = await prisma.user.deleteMany({
      where: { restaurantId: restaurant.id }
    });

    // Create ADMIN user
    const adminUser = await prisma.user.create({
      data: {
        email: 'business.genzresturant@gmail.com',
        password: hashedAdmin,
        name: 'Gen-Z Admin',
        role: 'ADMIN',
        restaurantId: restaurant.id,
      },
      select: { id: true, email: true, role: true }
    });

    // Create STAFF user
    const staffUser = await prisma.user.create({
      data: {
        email: 'staff.genz@gen-z.online',
        password: hashedStaff,
        name: 'Gen-Z Staff',
        role: 'STAFF',
        restaurantId: restaurant.id,
      },
      select: { id: true, email: true, role: true }
    });

    return NextResponse.json({
      success: true,
      message: '✅ Users setup complete',
      restaurant: restaurant.name,
      deletedOldUsers: deleted.count,
      users: [
        { ...adminUser, passwordSet: true },
        { ...staffUser, passwordSet: true }
      ]
    });

  } catch (error: any) {
    console.error('[Setup Users] Error:', error);
    return NextResponse.json({ 
      error: 'Setup failed: ' + (error.message || 'Unknown error') 
    }, { status: 500 });
  }
}
