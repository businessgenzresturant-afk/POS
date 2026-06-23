import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    console.log('\n=== USERS IN DATABASE ===\n');
    
    if (users.length === 0) {
      console.log('⚠️  No users found in database!');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
    }

    const restaurant = await prisma.restaurant.findFirst();
    console.log('=== RESTAURANT INFO ===');
    console.log('Restaurant:', restaurant?.name);
    console.log('KDS Token exists:', !!restaurant?.kdsDisplayToken);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
