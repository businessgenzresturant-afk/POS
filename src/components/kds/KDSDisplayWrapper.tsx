'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';

// 🔥 CRITICAL FIX: Dynamically import KDSDisplay with NO SSR
// This forces client-side only rendering, bypassing hydration issues
const KDSDisplay = dynamic(() => import('./KDSDisplay'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground text-xl font-bold">Initializing Display...</p>
      </div>
    </div>
  )
});

interface Props {
  restaurantId: string;
  readOnly?: boolean;
  enableReconnect?: boolean;
  autoStart?: boolean;
}

/**
 * Client-side wrapper for KDSDisplay
 * CRITICAL FIX for old Android TV WebView:
 * - Uses Next.js dynamic import with ssr: false
 * - Forces client-side only rendering
 * - Bypasses React hydration entirely
 */
export default function KDSDisplayWrapper(props: Props) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Force client-side rendering flag
    setIsClient(true);
  }, []);

  // Show nothing during SSR
  if (!isClient) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground text-xl font-bold">Loading Kitchen Display...</p>
          <p className="text-muted-foreground text-sm mt-2">Restaurant ID: {props.restaurantId}</p>
        </div>
      </div>
    );
  }

  // Client-side only: render KDSDisplay
  return <KDSDisplay {...props} />;
}
