import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Get any existing restaurant or create one
  let rest = await prisma.restaurant.findFirst();
  if (!rest) {
    rest = await prisma.restaurant.create({ data: { name: 'Test Rest', address: 'Test' } });
  }

  // Create customer
  const cust = await prisma.customer.create({
    data: { name: 'Test Cust', phone: '9998887776' }
  });

  // Create order
  const order = await prisma.order.create({
    data: { status: 'COMPLETED', orderType: 'DINE_IN', totalAmount: 100 }
  });

  // Create bill
  const bill = await prisma.bill.create({
    data: {
      orderId: order.id,
      customerId: cust.id,
      subtotal: 100, tax: 0, total: 100,
      status: 'PAID'
    }
  });

  // Fetch customer with bills
  const fetchedCust = await prisma.customer.findUnique({
    where: { id: cust.id },
    include: {
      bills: {
        where: { status: 'PAID' },
        include: { order: true }
      }
    }
  });

  console.log("Fetched Customer Bills Length:", fetchedCust?.bills?.length);
  
  // Cleanup
  await prisma.bill.delete({ where: { id: bill.id } });
  await prisma.order.delete({ where: { id: order.id } });
  await prisma.customer.delete({ where: { id: cust.id } });
}

main().catch(console.error).finally(() => prisma.$disconnect());
