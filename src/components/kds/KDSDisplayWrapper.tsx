'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';

// 🔥 CRITICAL FIX: Dynamically import KDSDisplay with NO SSR
// This forces client-side only rendering, bypassing hydration issues
const KDSDisplay = dynamic(() => import('./KDSDisplay'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center p-8">
        <div className="w-24 h-24 border-8 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-white text-3xl font-bold mb-4">⏳ Initializing Display...</p>
        <p className="text-gray-400 text-xl">Dynamic import loading...</p>
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
 * DIAGNOSTIC VERSION - Shows visible step-by-step progress
 * This helps identify EXACTLY where the TV browser gets stuck
 */
export default function KDSDisplayWrapper(props: Props) {
  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const mountTimeRef = useRef<number>(0);

  useEffect(() => {
    mountTimeRef.current = Date.now();
    console.log('[KDS Wrapper] Step 1: Component mounted');
    
    // Step 2: useEffect executed
    setStep(2);
    console.log('[KDS Wrapper] Step 2: useEffect executed');
    
    // Step 3: Set timeout to force transition after 1 second
    const timer1 = setTimeout(() => {
      setStep(3);
      console.log('[KDS Wrapper] Step 3: Timer 1 executed (1s)');
    }, 1000);
    
    // Step 4: Another timeout as fallback
    const timer2 = setTimeout(() => {
      setStep(4);
      console.log('[KDS Wrapper] Step 4: Timer 2 executed (2s)');
    }, 2000);
    
    // Step 5: Final timeout to show KDS Display
    const timer3 = setTimeout(() => {
      setStep(5);
      console.log('[KDS Wrapper] Step 5: Ready to show KDS Display (3s)');
    }, 3000);
    
    // Emergency timeout - if stuck after 10 seconds, show error
    const emergencyTimer = setTimeout(() => {
      if (step < 5) {
        setErrorMsg(`STUCK AT STEP ${step} - useEffect not working properly on this TV browser`);
        console.error('[KDS Wrapper] EMERGENCY: Stuck at step', step);
      }
    }, 10000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(emergencyTimer);
    };
  }, []); // Empty dependency array - runs once on mount

  // Show diagnostic steps
  if (step < 5) {
    const elapsedMs = Date.now() - mountTimeRef.current;
    const elapsedSec = (elapsedMs / 1000).toFixed(1);
    
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
        <div className="text-center max-w-2xl bg-gray-800 p-12 rounded-3xl border-4 border-blue-500">
          <div className="w-24 h-24 border-8 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
          
          <h1 className="text-4xl font-black text-white mb-8">
            🔍 DIAGNOSTIC MODE
          </h1>
          
          <div className="space-y-4 text-left bg-gray-900 p-6 rounded-2xl mb-6">
            <div className={`text-2xl font-bold ${step >= 1 ? 'text-green-400' : 'text-gray-600'}`}>
              {step >= 1 ? '✅' : '⏳'} Step 1: Component Mounted
            </div>
            <div className={`text-2xl font-bold ${step >= 2 ? 'text-green-400' : 'text-gray-600'}`}>
              {step >= 2 ? '✅' : '⏳'} Step 2: useEffect Executed
            </div>
            <div className={`text-2xl font-bold ${step >= 3 ? 'text-green-400' : 'text-gray-600'}`}>
              {step >= 3 ? '✅' : '⏳'} Step 3: Timer 1 (1 second)
            </div>
            <div className={`text-2xl font-bold ${step >= 4 ? 'text-green-400' : 'text-gray-600'}`}>
              {step >= 4 ? '✅' : '⏳'} Step 4: Timer 2 (2 seconds)
            </div>
            <div className={`text-2xl font-bold ${step >= 5 ? 'text-green-400' : 'text-gray-600'}`}>
              {step >= 5 ? '✅' : '⏳'} Step 5: Loading KDS Display...
            </div>
          </div>
          
          <div className="bg-blue-900 p-4 rounded-xl mb-6">
            <p className="text-blue-200 text-xl font-bold">⏱️ Elapsed: {elapsedSec}s</p>
            <p className="text-blue-300 text-lg mt-2">Restaurant ID: {props.restaurantId}</p>
          </div>
          
          {errorMsg && (
            <div className="bg-red-900 border-4 border-red-500 p-6 rounded-xl">
              <p className="text-red-200 text-2xl font-black">❌ {errorMsg}</p>
              <p className="text-red-300 text-lg mt-4">
                TV Browser Issue: React state updates not working
              </p>
            </div>
          )}
          
          <p className="text-gray-400 text-lg mt-6">
            📷 Take a photo of this screen and send to developer
          </p>
        </div>
      </div>
    );
  }

  // Step 5: Show the actual KDS Display
  console.log('[KDS Wrapper] Rendering KDSDisplay component');
  return <KDSDisplay {...props} />;
}
