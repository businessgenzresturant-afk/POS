import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { checkAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;

  try {
    const userId = (auth.session.user as any).id;
    const body = await request.json();
    const { name, image } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (image !== undefined) updateData.image = image ? String(image).trim() : null; // allow clearing

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
