import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Force dynamic route
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // Await params in Next.js 15
    const { token } = await params;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Find restaurant by token
    const restaurant = await prisma.restaurant.findUnique({
      where: { kdsDisplayToken: token },
      select: { id: true, name: true }
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      restaurantId: restaurant.id,
      restaurantName: restaurant.name
    });
  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
