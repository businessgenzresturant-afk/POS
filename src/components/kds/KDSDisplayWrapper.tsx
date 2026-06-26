'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';

// 🔥 CRITICAL FIX: Dynamically import KDSDisplay with NO SSR
const KDSDisplay = dynamic(() => import('./KDSDisplay'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center p-8">
        <div className="w-24 h-24 border-8 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-white text-3xl font-bold mb-4">⏳ Loading Display...</p>
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
 * FIX: Use single setInterval instead of multiple setTimeout
 * Old Android TV browsers have issues with multiple concurrent timeouts
 * Interval-based approach is more reliable on legacy browsers
 */
export default function KDSDisplayWrapper(props: Props) {
  const [isReady, setIsReady] = useState(false);
  const mountTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    mountTimeRef.current = Date.now();
    console.log('[KDS Wrapper] Component mounted, starting initialization...');
    
    // Force ready state after 500ms using interval (more reliable than setTimeout on old browsers)
    let elapsed = 0;
    intervalRef.current = setInterval(() => {
      elapsed += 100;
      console.log('[KDS Wrapper] Interval tick:', elapsed, 'ms');
      
      if (elapsed >= 500) {
        console.log('[KDS Wrapper] Ready! Showing KDS Display');
        setIsReady(true);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, 100); // Check every 100ms
    
    // Emergency fallback - force ready after 2 seconds no matter what
    const emergencyTimer = setTimeout(() => {
      console.log('[KDS Wrapper] Emergency fallback triggered');
      setIsReady(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 2000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      clearTimeout(emergencyTimer);
    };
  }, []);

  if (!isReady) {
    const elapsedMs = Date.now() - mountTimeRef.current;
    const elapsedSec = (elapsedMs / 1000).toFixed(1);
    
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
        <div className="text-center max-w-2xl bg-gray-800 p-12 rounded-3xl border-4 border-blue-500">
          <div className="w-24 h-24 border-8 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
          
          <h1 className="text-4xl font-black text-white mb-8">
            ⏳ Loading Kitchen Display
          </h1>
          
          <div className="bg-blue-900 p-4 rounded-xl">
            <p className="text-blue-200 text-2xl font-bold">⏱️ {elapsedSec}s</p>
            <p className="text-blue-300 text-lg mt-2">Restaurant ID: {props.restaurantId.slice(0, 8)}...</p>
          </div>
          
          <p className="text-gray-400 text-sm mt-6">
            Initializing display...
          </p>
        </div>
      </div>
    );
  }

  // Ready - show the actual KDS Display
  console.log('[KDS Wrapper] Rendering KDSDisplay component');
  return <KDSDisplay {...props} />;
}
