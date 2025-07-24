'use client';

import { useRequireAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import AIChat from '@/components/AIChat';
import CodeEditor from '@/components/CodeEditor';
import SessionManager from '@/components/SessionManager';
import Navbar from '@/components/Navbar';

export default function PlaygroundPage() {
  const { isAuthenticated, isInitialized } = useRequireAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  // Show loading while checking auth
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render anything if not authenticated (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Navbar />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Session Manager Sidebar */}
        <SessionManager />
        
        {/* Main Content Area */}
        <div className="flex-1 flex">
          {/* AI Chat Panel */}
          <div className="w-1/2 border-r">
            <AIChat />
          </div>
          
          {/* Code Editor Panel */}
          <div className="w-1/2">
            <CodeEditor />
          </div>
        </div>
      </div>
    </div>
  );
}
