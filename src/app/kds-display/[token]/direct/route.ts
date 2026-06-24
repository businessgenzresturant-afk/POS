import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Direct KDS Display Route - Server-Side Rendered HTML
 * For old TV browsers that can't handle client-side JavaScript
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    
    // Validate token
    const restaurant = await prisma.restaurant.findUnique({
      where: { kdsDisplayToken: token },
      select: { id: true, name: true }
    });

    if (!restaurant) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Access Denied</title>
          <style>
            body { 
              margin: 0; 
              font-family: system-ui, -apple-system, sans-serif; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              background: #0a0a0a; 
              color: #fff;
            }
            .error { text-align: center; padding: 2rem; }
            .error h1 { font-size: 4rem; margin: 0 0 1rem 0; }
            .error p { font-size: 1.5rem; color: #888; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>🔒</h1>
            <h1>Access Denied</h1>
            <p>Invalid KDS Display Token</p>
          </div>
        </body>
        </html>`,
        {
          status: 404,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }

    // Return HTML that redirects to the main KDS page with restaurant ID
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Loading KDS...</title>
        <meta http-equiv="refresh" content="0; url=/kds-display/${token}?rid=${restaurant.id}">
        <style>
          body { 
            margin: 0; 
            font-family: system-ui, -apple-system, sans-serif; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            background: #0a0a0a; 
            color: #fff;
          }
          .loading { text-align: center; }
          .spinner {
            width: 50px;
            height: 50px;
            border: 5px solid #333;
            border-top-color: #fff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading Kitchen Display...</p>
        </div>
        <script>
          // Fallback for browsers that don't support meta refresh
          setTimeout(function() {
            window.location.href = '/kds-display/${token}?rid=${restaurant.id}';
          }, 100);
        </script>
      </body>
      </html>`,
      {
        status: 200,
        headers: { 
          'Content-Type': 'text/html',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      }
    );
  } catch (error) {
    console.error('Direct KDS route error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
