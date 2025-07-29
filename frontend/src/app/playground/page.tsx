'use client';

import { useRequireAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import AIChat from '@/components/AIChat';
import CodeEditor from '@/components/CodeEditor';
import SessionManager from '@/components/SessionManager';
import Navbar from '@/components/Navbar';
import Preview from '@/components/Preview';
import toast from 'react-hot-toast';

export default function PlaygroundPage() {
  const { isAuthenticated, isInitialized } = useRequireAuth();
  const router = useRouter();
  const [showPreview, setShowPreview] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [previewWasVisible, setPreviewWasVisible] = useState(true); // Track if preview was visible before editing

  const togglePreview = () => {
    setShowPreview(prev => !prev);
  };

  const handleEditStart = () => {
    setPreviewWasVisible(showPreview); // Remember current preview state
    setIsEditing(true);
    setShowPreview(false); // Hide preview when editing starts
    toast('📝 Preview hidden while editing', { 
      duration: 2000,
      icon: '👁️‍🗨️',
      style: {
        background: '#fef3c7',
        color: '#92400e',
      }
    });
  };

  const handleEditEnd = () => {
    setIsEditing(false);
    setShowPreview(previewWasVisible); // Restore preview visibility after saving
    if (previewWasVisible) {
      toast('👁️ Preview updated with your changes!', { 
        duration: 2000,
        icon: '✅',
        style: {
          background: '#d1fae5',
          color: '#065f46',
        }
      });
    }
  };

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
      
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Session Manager Sidebar */}
        <SessionManager />
        
        {/* Main Content Area */}
        <div className="flex-1 flex min-w-0">
          {/* AI Chat Panel - 40% */}
          <div className="w-2/5 border-r min-w-0 h-full">
            <AIChat />
          </div>
          
          {/* Code Editor Panel - 60% */}
          <div className="w-3/5 min-w-0 h-full">
            <CodeEditor 
              showPreview={showPreview} 
              onTogglePreview={togglePreview}
              onEditStart={handleEditStart}
              onEditEnd={handleEditEnd}
            />
          </div>
        </div>
      </div>
      
      {/* Floating Preview Component */}
      <Preview showPreview={showPreview} onTogglePreview={togglePreview} isEditingMode={isEditing} />
    </div>
  );
}
