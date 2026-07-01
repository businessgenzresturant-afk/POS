const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });
const prisma = new PrismaClient();
async function main() {
  const custs = await prisma.customer.findMany({ 
    where: { phone: '2398729750' }, 
    include: { bills: true } 
  });
  console.log(JSON.stringify(custs, null, 2));
}
main();
