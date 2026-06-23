import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

// GET single menu item
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const params = await context.params;
    const menuItem = await prisma.menuItem.findUnique({
      where: { 
        id: params.id,
        restaurantId: (auth.session.user as any).restaurantId
      }
    });

    if (!menuItem) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    return NextResponse.json(menuItem);
  } catch (error) {
    console.error('Error fetching menu item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update menu item (ADMIN only)
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  // ADMIN-ONLY: Menu item editing
  const auth = await checkAuth(request, 'ADMIN');
  if (auth.error) return auth.error;

  try {
    const params = await context.params;
    const body = await request.json();
    const { name, price, priceHalf, category, dietType, hasHalfFullOption, stockQuantity, available, imageUrl } = body;

    // Build update data object (only include provided fields)
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (priceHalf !== undefined) updateData.priceHalf = priceHalf ? parseFloat(priceHalf) : null;
    if (category !== undefined) updateData.category = category;
    if (dietType !== undefined) updateData.dietType = dietType;
    if (hasHalfFullOption !== undefined) updateData.hasHalfFullOption = hasHalfFullOption;
    if (stockQuantity !== undefined) updateData.stockQuantity = stockQuantity ? parseInt(stockQuantity) : null;
    if (available !== undefined) updateData.available = available;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    const menuItem = await prisma.menuItem.update({
      where: { 
        id: params.id,
        restaurantId: (auth.session.user as any).restaurantId
      },
      data: updateData
    });

    return NextResponse.json(menuItem);
  } catch (error) {
    console.error('Error updating menu item:', error);
    return NextResponse.json({ error: 'Failed to update menu item' }, { status: 500 });
  }
}

// DELETE menu item (ADMIN only)
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  // ADMIN-ONLY: Menu item deletion
  const auth = await checkAuth(request, 'ADMIN');
  if (auth.error) return auth.error;

  try {
    const params = await context.params;
    await prisma.menuItem.delete({
      where: { 
        id: params.id,
        restaurantId: (auth.session.user as any).restaurantId
      }
    });

    return NextResponse.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json({ error: 'Failed to delete menu item' }, { status: 500 });
  }
}
