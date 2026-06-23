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

    console.log('[SEED-MENU] Starting menu seeding for restaurant:', user.restaurantId);

    // Check existing menu items
    const existingItems = await prisma.menuItem.count({
      where: { restaurantId: user.restaurantId },
    });

    if (existingItems > 0) {
      return NextResponse.json({
        message: 'Menu items already exist',
        count: existingItems,
      });
    }

    // Sample menu items (just a few for quick testing - you can add more later via UI)
    const sampleMenuItems: Array<{
      name: string;
      category: string;
      price: number;
      imageUrl: string;
      available: boolean;
      dietType: 'VEG' | 'NON_VEG';
    }> = [
      // Starters
      { name: 'Paneer Tikka', category: 'Tandoor Starters', price: 280, imageUrl: '/images/paneer-tikka.jpg', available: true, dietType: 'VEG' },
      { name: 'Chicken Tikka', category: 'Tandoor Starters', price: 390, imageUrl: '/images/chicken-tikka.jpg', available: true, dietType: 'NON_VEG' },
      { name: 'Tandoori Soya Chaap', category: 'Tandoor Starters', price: 190, imageUrl: '/images/tandoori-soya.jpg', available: true, dietType: 'VEG' },
      
      // Chinese
      { name: 'Chilli Paneer', category: 'Chinese Starters', price: 320, imageUrl: '/images/chilli-paneer.jpg', available: true, dietType: 'VEG' },
      { name: 'Chilli Chicken', category: 'Chinese Starters', price: 320, imageUrl: '/images/chilli-chicken.jpg', available: true, dietType: 'NON_VEG' },
      
      // Noodles & Rice
      { name: 'Veg Noodle', category: 'Noodles', price: 160, imageUrl: '/images/veg-noodle.jpg', available: true, dietType: 'VEG' },
      { name: 'Chicken Noodle', category: 'Noodles', price: 190, imageUrl: '/images/chicken-noodle.jpg', available: true, dietType: 'NON_VEG' },
      { name: 'Veg Fried Rice', category: 'Fried Rice', price: 150, imageUrl: '/images/veg-fried-rice.jpg', available: true, dietType: 'VEG' },
      { name: 'Chicken Fried Rice', category: 'Fried Rice', price: 190, imageUrl: '/images/chicken-rice.jpg', available: true, dietType: 'NON_VEG' },
      
      // Main Course
      { name: 'Dal Tadka', category: 'Main Course', price: 190, imageUrl: '/images/dal-tadka.jpg', available: true, dietType: 'VEG' },
      { name: 'Dal Makhni', category: 'Main Course', price: 220, imageUrl: '/images/dal-makhni.jpg', available: true, dietType: 'VEG' },
      { name: 'Paneer Butter Masala', category: 'Main Course', price: 270, imageUrl: '/images/paneer-butter-masala.jpg', available: true, dietType: 'VEG' },
      { name: 'Butter Chicken', category: 'Main Course', price: 420, imageUrl: '/images/butter-chicken.jpg', available: true, dietType: 'NON_VEG' },
      { name: 'Kadhai Chicken', category: 'Main Course', price: 420, imageUrl: '/images/kadhai-chicken.jpg', available: true, dietType: 'NON_VEG' },
      
      // Bread
      { name: 'Tandoori Roti', category: 'Bread', price: 12, imageUrl: '/images/tandoori-roti.jpg', available: true, dietType: 'VEG' },
      { name: 'Butter Naan', category: 'Bread', price: 30, imageUrl: '/images/butter-naan.jpg', available: true, dietType: 'VEG' },
      { name: 'Garlic Naan', category: 'Bread', price: 40, imageUrl: '/images/garlic-naan.jpg', available: true, dietType: 'VEG' },
      
      // Biryani
      { name: 'Veg Biryani', category: 'Biryani', price: 200, imageUrl: '/images/veg-biryani.jpg', available: true, dietType: 'VEG' },
      { name: 'Chicken Biryani', category: 'Biryani', price: 290, imageUrl: '/images/chicken-biryani.jpg', available: true, dietType: 'NON_VEG' },
      
      // Beverages
      { name: 'Classic Mojito', category: 'Refreshers', price: 100, imageUrl: '/images/classic-mojito.jpg', available: true, dietType: 'VEG' },
      { name: 'Cold Coffee', category: 'Shakes', price: 80, imageUrl: '/images/cold-coffee-shake.jpg', available: true, dietType: 'VEG' },
      { name: 'Lassi', category: 'Beverages', price: 80, imageUrl: '/images/lassi.jpg', available: true, dietType: 'VEG' },
    ];

    const createdItems = [];
    for (const item of sampleMenuItems) {
      const created = await prisma.menuItem.create({
        data: {
          ...item,
          restaurantId: user.restaurantId,
        },
      });
      createdItems.push(created);
    }

    console.log(`[SEED-MENU] Created ${createdItems.length} menu items successfully`);

    return NextResponse.json({
      success: true,
      message: `Created ${createdItems.length} sample menu items successfully`,
      count: createdItems.length,
      note: 'You can add more items through the Menu Management UI',
    });

  } catch (error) {
    console.error('[SEED-MENU] Error:', error);
    return NextResponse.json(
      { error: 'Failed to seed menu', details: (error as any).message },
      { status: 500 }
    );
  }
}
