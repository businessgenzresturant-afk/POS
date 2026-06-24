import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

/**
 * DEBUG ENDPOINT: Check current session details
 * Helps diagnose why dashboard shows "No tables found" despite tables existing
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({
        error: 'No session found',
        hint: 'User is not logged in or session expired',
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      session: {
        user: {
          email: session.user?.email,
          name: session.user?.name,
          role: (session.user as any)?.role,
          restaurantId: (session.user as any)?.restaurantId,
        },
        expires: session.expires,
      },
      hint: 'This is what the API sees when you make requests',
    });

  } catch (error) {
    console.error('[DEBUG-SESSION] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get session', details: (error as any).message },
      { status: 500 }
    );
  }
}
