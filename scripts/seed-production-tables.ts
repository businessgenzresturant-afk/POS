import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedProductionTables() {
  try {
    console.log('🌱 Starting production table seeding...\n');

    // Get restaurant
    const restaurant = await prisma.restaurant.findFirst();
    if (!restaurant) {
      console.error('❌ No restaurant found!');
      return;
    }

    console.log('✅ Restaurant found:', restaurant.name);

    // Check existing tables
    const existingTables = await prisma.table.findMany({
      where: { restaurantId: restaurant.id },
    });

    console.log(`📊 Existing tables: ${existingTables.length}`);

    if (existingTables.length > 0) {
      console.log('⚠️  Tables already exist. Skipping table creation.');
      console.log('Existing table numbers:', existingTables.map(t => t.number).join(', '));
    } else {
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

      for (const table of tableData) {
        await prisma.table.create({
          data: {
            number: table.number,
            capacity: table.capacity,
            status: 'AVAILABLE',
            restaurantId: restaurant.id,
          },
        });
        console.log(`✅ Created Table ${table.number} (Capacity: ${table.capacity})`);
      }
      console.log(`\n✅ Created ${tableData.length} tables successfully!`);
    }

    // Check menu items
    const menuCount = await prisma.menuItem.count({
      where: { restaurantId: restaurant.id },
    });

    console.log(`\n📋 Menu items: ${menuCount}`);

    if (menuCount === 0) {
      console.log('⚠️  No menu items found! Run full seed to add menu items.');
    }

    // Check users
    const users = await prisma.user.findMany({
      where: { restaurantId: restaurant.id },
      select: { email: true, role: true, name: true },
    });

    console.log('\n👥 Users:');
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ${user.role}`);
    });

    // Check KDS token
    console.log('\n🔐 KDS Display Token:', restaurant.kdsDisplayToken ? 'EXISTS ✅' : 'NOT SET ❌');
    if (restaurant.kdsDisplayToken) {
      console.log('   URL: https://pos.gen-z.online/kds-display/' + restaurant.kdsDisplayToken);
    }

    console.log('\n🎉 Production data check complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedProductionTables();
