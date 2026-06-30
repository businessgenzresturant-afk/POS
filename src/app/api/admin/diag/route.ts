import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { compare } from 'bcryptjs';

/**
 * DIAGNOSTIC + RESET endpoint - DELETE AFTER USE
 * GET: Check if user exists and verify password hash
 * POST: Reset password
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  if (secret !== 'genz-diag-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = searchParams.get('email') || 'business.genzresturant@gmail.com';
  
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, restaurantId: true, password: true }
  });

  if (!user) {
    return NextResponse.json({ found: false, email });
  }

  // Test password match
  const testPassword = searchParams.get('testpw');
  let passwordMatch = null;
  if (testPassword) {
    passwordMatch = await compare(testPassword, user.password);
  }

  return NextResponse.json({
    found: true,
    id: user.id,
    email: user.email,
    role: user.role,
    restaurantId: user.restaurantId,
    passwordHashPrefix: user.password.substring(0, 10) + '...',
    passwordMatch
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { secret, email, newPassword } = body;
    
    if (secret !== 'genz-diag-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    const updated = await prisma.user.update({
      where: { email },
      data: { password: hashed },
      select: { id: true, email: true, role: true }
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
