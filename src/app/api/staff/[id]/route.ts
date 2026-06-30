import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

// PATCH - Update staff member
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await checkAuth(request, 'ADMIN');
  if (auth.error) return auth.error;

  try {
    const params = await context.params;
    const body = await request.json();
    const { active, role } = body;
    const restaurantId = (auth.session.user as any).restaurantId;

    // Build update data object (only include provided fields)
    const updateData: any = {};
    if (active !== undefined) updateData.active = active;
    if (role !== undefined) updateData.role = role;

    const staffMember = await prisma.user.update({
      where: { 
        id: params.id,
        restaurantId
      },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true
      }
    });

    return NextResponse.json(staffMember);
  } catch (error) {
    console.error('Error updating staff member:', error);
    return NextResponse.json({ error: 'Failed to update staff member' }, { status: 500 });
  }
}

// DELETE staff member
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await checkAuth(request, 'ADMIN');
  if (auth.error) return auth.error;

  try {
    const params = await context.params;
    const restaurantId = (auth.session.user as any).restaurantId;

    // Safe to delete - delete user
    await prisma.user.delete({
      where: { 
        id: params.id,
        restaurantId
      }
    });

    return NextResponse.json({ 
      message: 'Staff member deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting staff member:', error);
    
    // Check for foreign key constraint error
    if (error.code === 'P2003' || error.message?.includes('foreign key constraint')) {
      return NextResponse.json({ 
        error: 'Cannot delete staff member',
        detail: 'This staff member is associated with orders or other records. Mark them as inactive instead.'
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to delete staff member',
      detail: error.message || 'Unknown error'
    }, { status: 500 });
  }
}
