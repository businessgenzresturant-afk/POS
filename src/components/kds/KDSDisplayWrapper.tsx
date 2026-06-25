'use client';

import { useEffect, useState } from 'react';
import KDSDisplay from './KDSDisplay';

interface Props {
  restaurantId: string;
  readOnly?: boolean;
  enableReconnect?: boolean;
  autoStart?: boolean;
}

/**
 * Client-side wrapper for KDSDisplay
 * Prevents hydration mismatch by mounting only on client
 */
export default function KDSDisplayWrapper(props: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground text-xl font-bold">Loading Kitchen Display...</p>
        </div>
      </div>
    );
  }

  return <KDSDisplay {...props} />;
}
