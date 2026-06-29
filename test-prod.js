const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:businessgenzresturant-afk@db.slzyuqoafjqhjkvhrhnx.supabase.co:5432/postgres?schema=public"
    }
  }
});
async function main() {
  const tables = await prisma.table.findMany();
  console.log('Tables:', tables.map(t => ({ id: t.number, status: t.status })));
  const orders = await prisma.order.findMany();
  console.log('Orders count:', orders.length);
}
main().catch(console.error).finally(() => prisma.$disconnect());
