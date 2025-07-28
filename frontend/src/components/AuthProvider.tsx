'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { usePlaygroundStore } from '@/store/usePlaygroundStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initializeAuth, isInitialized, isAuthenticated } = useAuthStore();
  const { setAuthenticated } = usePlaygroundStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Sync authentication state with playground store
  useEffect(() => {
    if (isInitialized) {
      setAuthenticated(isAuthenticated);
      // Only try to load server sessions if actually authenticated
      if (isAuthenticated) {
        // Small delay to ensure auth tokens are available
        setTimeout(() => {
          const { loadServerSessions } = usePlaygroundStore.getState();
          loadServerSessions().catch(console.error);
        }, 100);
      }
    }
  }, [isAuthenticated, isInitialized, setAuthenticated]);

  // Show loading spinner while initializing auth
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}