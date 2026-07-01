import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const restaurant = await prisma.restaurant.findFirst();
  if (!restaurant) {
    console.error("No restaurant found!");
    return;
  }
  
  const email = "staff@genz.online";
  const password = "password123";
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: 'STAFF',
      restaurantId: restaurant.id
    },
    create: {
      email,
      name: "GenZ Staff",
      password: hashedPassword,
      role: 'STAFF',
      active: true,
      restaurantId: restaurant.id
    }
  });
  
  console.log("Staff user created:", user.email);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
