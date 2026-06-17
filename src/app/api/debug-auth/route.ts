import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not Found', { status: 404 });
  }
  try {
    const { email, password } = await request.json();
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        email: email,
      });
    }

    // Check password
    const isValid = await compare(password, user.password);

    return NextResponse.json({
      success: true,
      userFound: true,
      passwordValid: isValid,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      env: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
        NODE_ENV: process.env.NODE_ENV,
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
