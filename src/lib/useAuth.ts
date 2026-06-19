'use client';

import { useSession } from 'next-auth/react';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'STAFF';
  restaurantId: string;
}

export function useAuth() {
  const session = useSession();
  
  const user = session?.data?.user as AuthUser | undefined;
  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'STAFF';
  const isLoading = session?.status === 'loading';
  const isAuthenticated = session?.status === 'authenticated';

  return {
    user,
    isAdmin,
    isStaff,
    isLoading,
    isAuthenticated,
    session: session?.data,
    status: session?.status
  };
}
