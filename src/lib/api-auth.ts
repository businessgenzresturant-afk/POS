import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth-config";

/**
 * Authentication helper for API routes
 * 
 * SECURITY NOTES:
 * - All API routes requiring authentication MUST call checkAuth()
 * - Session-based authentication provides sufficient security for this internal POS
 * - CSRF protection: Not implemented as this is an internal, same-origin tool
 *   - NextAuth provides CSRF protection for /api/auth/* routes
 *   - Custom API routes are internal-only (no public exposure)
 *   - Same-origin policy prevents cross-site attacks
 *   - If this becomes a public API, implement CSRF tokens
 * - For production: Ensure NEXTAUTH_SECRET is set (validated in auth-config.ts)
 */

export async function checkAuth(req?: any) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return {
        error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        session: null
      };
    }

    return { error: null, session };
  } catch (error) {
    console.error("Auth check error:", error);
    return {
      error: NextResponse.json({ error: "Auth check failed" }, { status: 401 }),
      session: null
    };
  }
}

export async function softCheckAuth(req?: any) {
  try {
    const session = await getServerSession(authOptions);
    return { error: null, session };
  } catch (error) {
    console.error("Soft auth check error:", error);
    return { error: null, session: null };
  }
}
