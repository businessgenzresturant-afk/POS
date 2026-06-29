const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const dotenv = require('dotenv');

// Load production environment variables
dotenv.config({ path: '.env.production' });

const prisma = new PrismaClient();

async function runHandoff() {
  console.log('Connecting to production database via Prisma...');
  
  try {
    console.log('1. Fetching configuration backup...');
    const backup = {
      restaurant: await prisma.restaurant.findFirst(),
      users: await prisma.user.findMany(),
      menuItems: await prisma.menuItem.findMany(),
      tables: await prisma.table.findMany(),
    };
    
    fs.writeFileSync('production-seed-backup.json', JSON.stringify(backup, null, 2));
    console.log('✅ Configuration backup saved to production-seed-backup.json');

    console.log('2. Wiping transactional data for clean slate...');
    await prisma.bill.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    // Payment, BillItem, Customer aren't needed unless specifically added? Let's check schema.
    console.log('✅ Transactional test data wiped.');

    console.log('3. Resetting tables to AVAILABLE...');
    await prisma.table.updateMany({
      data: { status: 'AVAILABLE' }
    });
    console.log('✅ Tables reset.');

  } catch(e) {
    console.error('❌ Handoff Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

runHandoff();
