import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';
import { updateBillSchema } from '@/lib/validations';

// GET single bill by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const restaurantId = (auth.session.user as any).restaurantId;
    const bill = await prisma.bill.findFirst({
      where: {
        id: params.id,
        OR: [
          { table: { restaurantId } },
          { order: { items: { some: { menuItem: { restaurantId } } } } }
        ]
      },
      include: {
        order: {
          include: {
            items: {
              include: {
                menuItem: true
              }
            }
          }
        },
        table: true
      }
    });

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    return NextResponse.json(bill);
  } catch (error) {
    console.error('Error fetching bill:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH update bill status (mark as paid)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const validation = updateBillSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }
    const { status, paymentMethod } = validation.data;

    // Get the bill with order and table info and verify restaurant ownership
    const restaurantId = (auth.session.user as any).restaurantId;
    const existingBill = await prisma.bill.findFirst({
      where: {
        id: params.id,
        OR: [
          { table: { restaurantId } },
          { order: { items: { some: { menuItem: { restaurantId } } } } }
        ]
      },
      include: {
        order: {
          include: {
            table: true
          }
        }
      }
    });

    if (!existingBill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    // Update bill and free table in a transaction if payment is confirmed
    const result = await prisma.$transaction(async (tx) => {
      // Update the bill
      const updatedBill = await tx.bill.update({
        where: { id: params.id },
        data: {
          status,
          paymentMethod: paymentMethod || null,
          paidAt: status === 'PAID' ? new Date() : null
        },
        include: {
          order: {
            include: {
              items: {
                include: {
                  menuItem: true
                }
              },
              table: true
            }
          }
        }
      });

      // If bill is paid, update order payment status and free the table
      if (status === 'PAID') {
        await tx.order.update({
          where: { id: existingBill.orderId },
          data: { paymentStatus: 'PAID' }
        });

        // Free the table if order was linked to a table
        if (existingBill.order.tableId) {
          await tx.table.update({
            where: { id: existingBill.order.tableId },
            data: { status: 'AVAILABLE' }
          });
        }
      }

      return updatedBill;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating bill:', error);
    return NextResponse.json(
      { error: 'Failed to update bill. Please try again.' },
      { status: 500 }
    );
  }
}