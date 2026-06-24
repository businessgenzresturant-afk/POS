'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import KDSDisplay from '@/components/kds/KDSDisplay';

export default function PublicKDSDisplay() {
  const params = useParams();
  const searchParams = useSearchParams();
  const ridFromUrl = searchParams.get('rid');
  
  const [restaurantId, setRestaurantId] = useState<string | null>(ridFromUrl);
  const [loading, setLoading] = useState(!ridFromUrl);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we already have restaurantId from URL params, skip validation
    if (ridFromUrl) {
      console.log('✅ Restaurant ID from URL params:', ridFromUrl);
      return;
    }

    // Otherwise validate token
    let mounted = true;

    async function validateToken() {
      try {
        const token = params.token as string;
        console.log('🔍 Validating token:', token?.substring(0, 10));
        
        const response = await fetch(`/api/kds-display/${token}/validate`);
        console.log('📥 Response:', response.status);
        
        if (!response.ok) {
          if (mounted) {
            setError(response.status === 404 ? 'Invalid KDS Display Token' : 'Failed to validate token');
            setLoading(false);
          }
          return;
        }

        const data = await response.json();
        console.log('✅ Validation successful, redirecting with rid...');
        
        // Redirect to same page with restaurantId in query params
        // This completely bypasses React state issues on TV browsers
        window.location.href = `${window.location.pathname}?rid=${data.restaurantId}`;
        
      } catch (err) {
        console.error('❌ Validation error:', err);
        if (mounted) {
          setError('Failed to connect to server');
          setLoading(false);
        }
      }
    }

    validateToken();
    
    return () => {
      mounted = false;
    };
  }, [params.token, ridFromUrl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground text-xl font-bold">Validating access...</p>
        </div>
      </div>
    );
  }

  if (error || !restaurantId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-12 bg-card rounded-3xl border-4 border-destructive">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-3xl font-black text-destructive mb-4">Access Denied</h1>
          <p className="text-xl text-muted-foreground font-bold mb-6">
            {error || 'Invalid or expired KDS display token'}
          </p>
          <p className="text-sm text-muted-foreground">
            Please contact your restaurant administrator for the correct display URL
          </p>
        </div>
      </div>
    );
  }

  return <KDSDisplay restaurantId={restaurantId} readOnly={true} enableReconnect={true} />;
}
