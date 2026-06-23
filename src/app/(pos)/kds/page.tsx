'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import KDSDisplay from '@/components/kds/KDSDisplay';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function KitchenDisplaySystem() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Always show loading during SSR or when loading
  if (typeof window === 'undefined' || status === 'loading' || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-xl font-bold">Loading...</p>
      </div>
    );
  }

  const restaurantId = (session.user as any).restaurantId;

  return <KDSDisplay restaurantId={restaurantId} readOnly={false} enableReconnect={false} />;
}
