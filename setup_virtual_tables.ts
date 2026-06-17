import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Setting up virtual tables for Takeaway, Parcel, and Delivery...');
  
  // Get all restaurants
  const restaurants = await prisma.restaurant.findMany();
  
  for (const restaurant of restaurants) {
    const virtualTables = [
      { id: crypto.randomUUID(), number: 1000, capacity: 0, status: 'AVAILABLE' as const, restaurantId: restaurant.id }, // Takeaway
      { id: crypto.randomUUID(), number: 1001, capacity: 0, status: 'AVAILABLE' as const, restaurantId: restaurant.id }, // Parcel
      { id: crypto.randomUUID(), number: 1002, capacity: 0, status: 'AVAILABLE' as const, restaurantId: restaurant.id }, // Delivery
    ];

    for (const vt of virtualTables) {
      await prisma.table.upsert({
        where: {
          restaurantId_number: {
            restaurantId: restaurant.id,
            number: vt.number
          }
        },
        update: {},
        create: vt
      });
    }
    console.log(`Virtual tables created for restaurant: ${restaurant.name}`);
  }
  console.log('Setup complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
