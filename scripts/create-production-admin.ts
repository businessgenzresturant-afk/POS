import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createProductionAdmin() {
  try {
    console.log('🔐 Creating/Updating Production Admin Account...\n');

    // Get restaurant
    const restaurant = await prisma.restaurant.findFirst();
    if (!restaurant) {
      console.error('❌ No restaurant found! Please create restaurant first.');
      return;
    }

    // Check if admin exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'business.genzresturant@gmail.com' },
    });

    const hashedPassword = await bcrypt.hash('Admin@GenZ2024', 10);

    if (existingAdmin) {
      // Update password
      await prisma.user.update({
        where: { email: 'business.genzresturant@gmail.com' },
        data: { password: hashedPassword },
      });
      console.log('✅ Admin password updated successfully!');
    } else {
      // Create new admin
      await prisma.user.create({
        data: {
          email: 'business.genzresturant@gmail.com',
          password: hashedPassword,
          name: 'Business Admin',
          role: 'ADMIN',
          restaurantId: restaurant.id,
        },
      });
      console.log('✅ Admin account created successfully!');
    }

    console.log('\n📧 Email: business.genzresturant@gmail.com');
    console.log('🔑 Password: Admin@GenZ2024');
    console.log('👤 Role: ADMIN');
    console.log('\n✅ You can now login to production!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createProductionAdmin();
