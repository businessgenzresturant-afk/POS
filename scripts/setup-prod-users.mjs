import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Direct Supabase connection
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:gen-zresturant@db.slzyuqoafjqhjkvhrhnx.supabase.co:5432/postgres'
    }
  }
});

async function main() {
  console.log('🔌 Connecting to Supabase...');

  // Check existing users
  const existingUsers = await prisma.user.findMany({
    select: { id: true, email: true, role: true, restaurantId: true }
  });
  console.log('📋 Existing users:', existingUsers);

  // Get restaurant
  const restaurant = await prisma.restaurant.findFirst({
    select: { id: true, name: true }
  });
  console.log('🏠 Restaurant:', restaurant);

  if (!restaurant) {
    console.error('❌ No restaurant found!');
    return;
  }

  // Hash passwords
  const adminHash = await bcrypt.hash('GenZ@Admin2024', 12);
  const staffHash = await bcrypt.hash('GenZ@Staff2024', 12);

  // Delete all old users for this restaurant
  const deleted = await prisma.user.deleteMany({
    where: { restaurantId: restaurant.id }
  });
  console.log(`🗑️  Deleted ${deleted.count} old users`);

  // Create ADMIN
  const admin = await prisma.user.create({
    data: {
      email: 'business.genzresturant@gmail.com',
      password: adminHash,
      name: 'Gen-Z Admin',
      role: 'ADMIN',
      restaurantId: restaurant.id,
    },
    select: { id: true, email: true, role: true }
  });
  console.log('✅ Admin created:', admin);

  // Create STAFF
  const staff = await prisma.user.create({
    data: {
      email: 'staff.genz@gen-z.online',
      password: staffHash,
      name: 'Gen-Z Staff',
      role: 'STAFF',
      restaurantId: restaurant.id,
    },
    select: { id: true, email: true, role: true }
  });
  console.log('✅ Staff created:', staff);

  console.log('\n🎉 Done! Login credentials:');
  console.log('   ADMIN: business.genzresturant@gmail.com / GenZ@Admin2024');
  console.log('   STAFF: staff.genz@gen-z.online / GenZ@Staff2024');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
