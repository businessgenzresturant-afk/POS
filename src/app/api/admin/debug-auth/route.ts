import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';

// Temporary debug endpoint - will be deleted after fix
export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get('secret');
  if (secret !== 'genz-debug-fix-2024') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Test DB connection
    const dbUrl = process.env.DATABASE_URL;
    const dbUrlPrefix = dbUrl ? dbUrl.substring(0, 30) + '...' : 'NOT SET';

    // Try to find user
    const user = await prisma.user.findUnique({
      where: { email: 'business.genzresturant@gmail.com' },
      select: { id: true, email: true, password: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ 
        status: 'USER_NOT_FOUND',
        dbUrlPrefix,
        nextauthSecret: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
        nextauthUrl: process.env.NEXTAUTH_URL || 'NOT SET'
      });
    }

    const passwordMatch = await compare('GenZ@Admin2024', user.password);

    return NextResponse.json({
      status: 'OK',
      dbUrlPrefix,
      user: { email: user.email, role: user.role },
      passwordMatch,
      hashPrefix: user.password.substring(0, 10),
      nextauthSecret: process.env.NEXTAUTH_SECRET ? `SET (${process.env.NEXTAUTH_SECRET.length} chars)` : 'NOT SET',
      nextauthUrl: process.env.NEXTAUTH_URL || 'NOT SET'
    });
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'ERROR', 
      message: error?.message,
      code: error?.code,
      dbUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET'
    }, { status: 500 });
  }
}
