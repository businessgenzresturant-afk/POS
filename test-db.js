const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const orders = await prisma.order.findMany();
  console.log("Orders count:", orders.length);
  const tables = await prisma.table.findMany();
  console.log("Tables count:", tables.length);
  const bills = await prisma.bill.findMany();
  console.log("Bills count:", bills.length);
}
main().catch(console.error).finally(() => prisma.$disconnect());
