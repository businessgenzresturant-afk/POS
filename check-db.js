const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL
    }
  },
  log: ['query', 'error', 'warn']
});

async function checkDatabase() {
  try {
    console.log('🔍 Checking database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected!');
    
    // Check Restaurant
    const restaurants = await prisma.restaurant.findMany();
    console.log(`\n📍 Restaurants: ${restaurants.length}`);
    if (restaurants.length > 0) {
      console.log('   →', restaurants[0].name);
    }
    
    // Check Users
    const users = await prisma.user.findMany();
    console.log(`\n👤 Users: ${users.length}`);
    users.forEach(u => console.log(`   → ${u.email} (${u.role})`));
    
    // Check Tables
    const tables = await prisma.table.findMany();
    console.log(`\n🪑 Tables: ${tables.length}`);
    
    // Check Menu Items
    const menuItems = await prisma.menuItem.findMany();
    console.log(`\n🍽️  Menu Items: ${menuItems.length}`);
    
    console.log('\n✅ Database check complete!');
    
  } catch (error) {
    console.error('\n❌ Database error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
