import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getToken } from 'next-auth/jwt';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// Force dynamic route to avoid build-time pre-rendering
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not Found', { status: 404 });
  }
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  const tokenWithReq = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
  
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch(e) {
    console.error('Auth check error:', e);
  }

  return NextResponse.json({
    hasTokenWithReq: !!tokenWithReq,
    hasSession: !!session,
    cookies: allCookies.map(c => c.name),
    env: {
      hasUrl: !!process.env.NEXTAUTH_URL,
      hasSecret: !!process.env.NEXTAUTH_SECRET,
    }
  });
}
