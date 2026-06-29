const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const tables = await prisma.table.findMany();
  console.log('Tables:', tables.map(t => ({ id: t.number, status: t.status })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
