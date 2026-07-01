import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
const prisma = new PrismaClient();
async function main() {
  const custs = await prisma.customer.findMany({ take: 2, include: { bills: true } });
  console.log(JSON.stringify(custs, null, 2));
}
main();
