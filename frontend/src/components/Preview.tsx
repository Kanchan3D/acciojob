'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { X, Move, Maximize2, Minimize2, Monitor, Square, AlertCircle, Play } from 'lucide-react';
import { LiveProvider, LivePreview, LiveError } from 'react-live';
import { usePlaygroundStore } from '@/store/usePlaygroundStore';
import React from 'react';

interface PreviewProps {
  showPreview: boolean;
  onTogglePreview: () => void;
  isEditingMode?: boolean;
}

type AspectRatio = '16:9' | '4:3' | '1:1' | 'free';

const ASPECT_RATIOS = {
  '16:9': 16 / 9,
  '4:3': 4 / 3,
  '1:1': 1 / 1,
  'free': null
} as const;

// Scope for React Live - commonly used React components and hooks
const scope = {
  React,
  useState: React.useState,
  useEffect: React.useEffect,
  useCallback: React.useCallback,
  useMemo: React.useMemo,
  useRef: React.useRef,
  useReducer: React.useReducer,
  useContext: React.useContext,
  useLayoutEffect: React.useLayoutEffect,
  Fragment: React.Fragment,
  Component: React.Component,
  PureComponent: React.PureComponent,
  createContext: React.createContext,
  forwardRef: React.forwardRef,
  memo: React.memo,
  // Common HTML elements that might be referenced
  div: 'div',
  span: 'span',
  p: 'p',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  button: 'button',
  input: 'input',
  form: 'form',
  img: 'img',
  a: 'a',
  ul: 'ul',
  li: 'li',
  // Add more commonly used components/libraries as needed
};

export default function Preview({ showPreview, onTogglePreview, isEditingMode = false }: PreviewProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 640, height: 480 }); // 4:3 ratio (640x480) - increased size
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('4:3');
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State for error tracking and debugging
  const [lastError, setLastError] = useState<string | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState<{
    codeLength: number;
    language: string;
    hasValidJSX: boolean;
    processingTime: number;
  } | null>(null);

  // Get current code from playground store
  const { currentCode, currentLanguage } = usePlaygroundStore();

  // Set default position to extreme bottom-right
  useEffect(() => {
    const updatePosition = () => {
      if (typeof window !== 'undefined') {
        const padding = 20; // Small padding from viewport edges
        setPosition({
          x: window.innerWidth - size.width - padding,
          y: window.innerHeight - size.height - padding // Extreme bottom-right corner
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [size.width, size.height]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMaximized) return;
    setIsDragging(true);
    const rect = previewRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
    e.preventDefault();
  }, [isMaximized]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMaximized) return;
    setIsResizing(true);
    e.stopPropagation();
    e.preventDefault();
  }, [isMaximized]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !isMaximized) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Constrain to viewport
        const maxX = window.innerWidth - size.width;
        const maxY = window.innerHeight - size.height;
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
      
      if (isResizing && !isMaximized) {
        const rect = previewRef.current?.getBoundingClientRect();
        if (rect) {
          const newWidth = Math.max(320, e.clientX - rect.left);
          const newHeight = Math.max(180, e.clientY - rect.top);
          
          let finalWidth = newWidth;
          let finalHeight = newHeight;
          
          // Apply aspect ratio constraint if not free
          const ratio = ASPECT_RATIOS[aspectRatio];
          if (ratio !== null) {
            // Determine which dimension to prioritize based on which changed more
            const widthChange = Math.abs(newWidth - size.width);
            const heightChange = Math.abs(newHeight - size.height);
            
            if (widthChange > heightChange) {
              // Width changed more, adjust height to match ratio
              finalWidth = newWidth;
              finalHeight = newWidth / ratio;
            } else {
              // Height changed more, adjust width to match ratio
              finalHeight = newHeight;
              finalWidth = newHeight * ratio;
            }
            
            // Ensure minimum sizes
            if (finalWidth < 320) {
              finalWidth = 320;
              finalHeight = 320 / ratio;
            }
            if (finalHeight < 180) {
              finalHeight = 180;
              finalWidth = 180 * ratio;
            }
          }
          
          // Constrain to viewport
          setSize({
            width: Math.min(finalWidth, window.innerWidth - position.x),
            height: Math.min(finalHeight, window.innerHeight - position.y)
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragOffset, size, position, isMaximized]);

  // Error handling and debugging
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error && event.filename?.includes('Preview')) {
        setLastError(event.error.message);
        setErrorCount(prev => prev + 1);
        console.error('Preview component error:', event.error);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setLastError(String(event.reason));
      setErrorCount(prev => prev + 1);
      console.error('Preview component promise rejection:', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Clear errors and update debug info when code changes
  useEffect(() => {
    const startTime = performance.now();
    setLastError(null);
    setErrorCount(0);
    
    // Analyze the code for debugging
    const hasValidJSX = currentCode.includes('<') && currentCode.includes('>') && 
                       (currentCode.includes('return') || currentCode.includes('render'));
    
    setDebugInfo({
      codeLength: currentCode.length,
      language: currentLanguage,
      hasValidJSX,
      processingTime: performance.now() - startTime
    });
  }, [currentCode, currentLanguage]);

  const toggleMaximize = useCallback(() => {
    setIsMaximized(prev => !prev);
  }, []);

  const changeAspectRatio = useCallback((newRatio: AspectRatio) => {
    setAspectRatio(newRatio);
    
    // Adjust current size to match new aspect ratio
    if (newRatio !== 'free') {
      const ratio = ASPECT_RATIOS[newRatio];
      if (ratio !== null) {
        const newHeight = size.width / ratio;
        setSize(prev => ({
          width: prev.width,
          height: Math.max(180, Math.min(newHeight, window.innerHeight - position.y))
        }));
      }
    }
  }, [size.width, position.y]);

  const getAspectRatioIcon = (ratio: AspectRatio) => {
    switch (ratio) {
      case '16:9': return <Monitor className="w-3 h-3" />;
      case '4:3': return <Monitor className="w-3 h-3" />;
      case '1:1': return <Square className="w-3 h-3" />;
      case 'free': return <Move className="w-3 h-3" />;
    }
  };

  // Process code for React Live - Simplified version to avoid "require is not defined" errors
  const processCodeForPreview = useCallback((code: string, language: string) => {
    if (!code || !code.trim()) {
      return `function EmptyComponent() {
  return (
    <div style={{
      padding: '32px',
      textAlign: 'center',
      color: '#374151',
      backgroundColor: '#f9fafb',
      borderRadius: '12px',
      border: '2px dashed #d1d5db',
      minHeight: '200px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
      <h3 style={{
        margin: '0 0 12px 0',
        fontSize: '20px',
        fontWeight: '600',
        color: '#1f2937'
      }}>
        No Code Available
      </h3>
      <p style={{
        margin: '0',
        fontSize: '16px',
        color: '#6b7280',
        lineHeight: '1.5'
      }}>
        Start coding in the editor to see live preview
      </p>
    </div>
  );
}

render(<EmptyComponent />);`;
    }

    try {
      let processedCode = code.trim();

      // Remove import statements - React is already in scope via the scope prop
      processedCode = processedCode.replace(/import\s+[^;]+;?\s*/g, '');
      
      // Remove export statements
      processedCode = processedCode.replace(/export\s+default\s+/g, '');
      processedCode = processedCode.replace(/export\s+\{[^}]*\}\s*;?\s*/g, '');
      processedCode = processedCode.replace(/export\s+(function|class|const|let|var)\s+/g, '$1 ');

      // Remove TypeScript type annotations and interfaces (basic cleanup)
      processedCode = processedCode.replace(/:\s*React\.FC<[^>]*>/g, '');
      processedCode = processedCode.replace(/:\s*React\.ReactNode/g, '');
      processedCode = processedCode.replace(/interface\s+\w+\s*\{[^}]*\}\s*/g, '');
      processedCode = processedCode.replace(/type\s+\w+\s*=\s*[^;]+;\s*/g, '');

      // Clean up comments and extra whitespace
      processedCode = processedCode.replace(/\/\/.*$/gm, '');
      processedCode = processedCode.replace(/\/\*[\s\S]*?\*\//g, '');
      processedCode = processedCode.replace(/\n\s*\n\s*\n/g, '\n\n').trim();

      // For JSX/TSX, check if it's already a complete component
      if (language === 'jsx' || language === 'tsx') {
        // Check if it already has a function component definition
        const hasFunctionComponent = /function\s+\w+\s*\(/.test(processedCode) || 
                                   /const\s+\w+\s*=\s*\([^)]*\)\s*=>/.test(processedCode) ||
                                   /const\s+\w+\s*=\s*function/.test(processedCode);

        if (hasFunctionComponent) {
          // Extract component name if possible
          let componentName = 'MyComponent';
          const functionMatch = processedCode.match(/function\s+(\w+)\s*\(/);
          const constMatch = processedCode.match(/const\s+(\w+)\s*=/);
          
          if (functionMatch) {
            componentName = functionMatch[1];
          } else if (constMatch) {
            componentName = constMatch[1];
          }

          // If there's no render call, add it
          if (!processedCode.includes('render(')) {
            processedCode += `\n\nrender(<${componentName} />);`;
          }
          
          return processedCode;
        } else {
          // If it's just JSX elements, wrap them in a component
          if (processedCode.includes('<') && processedCode.includes('>')) {
            return `function PreviewComponent() {
  return (
    ${processedCode}
  );
}

render(<PreviewComponent />);`;
          }
        }
      }
      
      // For plain JavaScript or non-JSX code
      return `function CodeResult() {
  let result;
  try {
    result = (() => {
      ${processedCode}
      return 'Code executed successfully';
    })();
  } catch (e) {
    result = 'Error: ' + e.message;
  }
  
  return (
    <div style={{
      padding: '24px',
      backgroundColor: '#f8fafc',
      borderRadius: '12px',
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      border: '2px solid #e2e8f0',
      minHeight: '120px'
    }}>
      <h4 style={{
        margin: '0 0 16px 0',
        fontSize: '18px',
        fontWeight: '600',
        color: '#1f2937',
        borderBottom: '2px solid #3b82f6',
        paddingBottom: '8px'
      }}>
        📋 Code Result
      </h4>
      <div style={{ 
        background: '#ffffff', 
        padding: '16px', 
        borderRadius: '8px',
        border: '1px solid #d1d5db',
        fontSize: '16px',
        lineHeight: '1.6',
        color: '#374151',
        fontWeight: '500'
      }}>
        {result}
      </div>
    </div>
  );
}

render(<CodeResult />);`;
    } catch (error) {
      console.error('Code processing error:', error);
      return `function ErrorComponent() {
  return (
    <div style={{
      padding: '24px',
      backgroundColor: '#fef2f2',
      borderRadius: '12px',
      color: '#dc2626',
      border: '2px solid #fecaca',
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '24px', marginRight: '12px' }}>⚠️</span>
        <h4 style={{ margin: '0', fontSize: '18px', fontWeight: '600', color: '#dc2626' }}>
          Preview Error
        </h4>
      </div>
      <p style={{ margin: '0', fontSize: '16px', lineHeight: '1.5', color: '#991b1b' }}>
        Unable to process code: {error instanceof Error ? error.message : 'Unknown error'}
      </p>
    </div>
  );
}

render(<ErrorComponent />);`;
    }
  }, []);

  // Memoize the processed code to ensure it updates when currentCode or currentLanguage changes
  const processedCode = React.useMemo(() => {
    return processCodeForPreview(currentCode, currentLanguage);
  }, [currentCode, currentLanguage, processCodeForPreview]);

  // Determine if we need noInline mode (when we have render() calls)
  const needsNoInline = React.useMemo(() => {
    return processedCode.includes('render(');
  }, [processedCode]);

  if (!showPreview) return null;

  const previewStyle = isMaximized ? {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 1000
  } : {
    position: 'fixed' as const,
    left: position.x,
    top: position.y,
    width: size.width,
    height: size.height,
    zIndex: 999
  };

  try {
    return (
      <div
        ref={previewRef}
        style={previewStyle}
        className={`bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden ${
          isDragging ? 'cursor-grabbing' : ''
        } ${isMaximized ? '' : 'min-w-[320px] min-h-[180px]'}`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-2 bg-gray-100 border-b select-none ${
            !isMaximized ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center space-x-2">
            <Move className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-700">Live Preview</h3>
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
              {aspectRatio === 'free' ? 'Free' : aspectRatio}
            </span>
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
              {currentLanguage.toUpperCase()}
            </span>
            {/* Error indicator */}
            {errorCount > 0 && (
              <span 
                className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded cursor-help" 
                title={`${errorCount} error(s): ${lastError || 'Unknown error'}`}
              >
                ⚠️ {errorCount}
              </span>
            )}
            {/* Code validity indicator */}
            {debugInfo && (
              <span 
                className={`text-xs px-2 py-0.5 rounded ${
                  debugInfo.hasValidJSX 
                    ? 'text-green-600 bg-green-100' 
                    : 'text-yellow-600 bg-yellow-100'
                }`}
                title={`Code length: ${debugInfo.codeLength}, Processing: ${debugInfo.processingTime.toFixed(1)}ms`}
              >
                {debugInfo.hasValidJSX ? '✓' : '?'}
              </span>
            )}
            {/* Editing mode indicator */}
            {isEditingMode && (
              <span 
                className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded cursor-help" 
                title="Preview hidden while editing code"
              >
                ✏️ Editing
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {/* Aspect Ratio Dropdown */}
            <div className="relative group">
              <button
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
                aria-label="Change aspect ratio"
              >
                {getAspectRatioIcon(aspectRatio)}
              </button>
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 min-w-[120px]">
                {(Object.keys(ASPECT_RATIOS) as AspectRatio[]).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => changeAspectRatio(ratio)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2 ${
                      aspectRatio === ratio ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {getAspectRatioIcon(ratio)}
                    <span>{ratio === 'free' ? 'Free resize' : ratio}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={toggleMaximize}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
              aria-label={isMaximized ? 'Minimize' : 'Maximize'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onTogglePreview}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden" style={{ height: isMaximized ? 'calc(100vh - 45px)' : size.height - 45 }}>
          {isEditingMode ? (
            // Show editing mode message instead of live preview
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center p-8">
                <div className="text-4xl mb-4">✏️</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Preview Hidden</h3>
                <p className="text-sm text-gray-500 mb-4">
                  The preview is hidden while you're editing code
                </p>
                <p className="text-xs text-gray-400">
                  Save your changes to see the updated preview
                </p>
              </div>
            </div>
          ) : (
            <LiveProvider 
              key={`${currentCode.length}-${currentLanguage}`}
              code={processedCode} 
              scope={scope}
              noInline={needsNoInline}
              transformCode={(code) => {
                try {
                  // Additional safety check and transformation
                  if (!code || !code.trim()) {
                    return `function EmptyCode() {
  return (
    <div style={{ 
      padding: '24px', 
      textAlign: 'center', 
      color: '#374151',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      border: '2px dashed #d1d5db',
      fontSize: '16px',
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>📝</div>
      <div style={{ fontWeight: '600', fontSize: '18px' }}>No code to preview</div>
    </div>
  );
}

render(<EmptyCode />);`;
                  }
                  return code;
                } catch (error) {
                  console.error('Code transformation error:', error);
                  return `function TransformError() {
  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#fef2f2',
      borderRadius: '8px',
      color: '#dc2626',
      fontSize: '16px',
      border: '2px solid #fecaca',
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <span style={{ fontSize: '20px', marginRight: '8px' }}>⚠️</span>
        <h4 style={{ margin: '0', fontSize: '18px', fontWeight: '600' }}>
          Code Transformation Error
        </h4>
      </div>
      <p style={{ 
        margin: '0',
        fontSize: '16px',
        lineHeight: '1.5',
        color: '#b91c1c'
      }}>
        Error: ${error instanceof Error ? error.message : 'Unknown transformation error'}
      </p>
    </div>
  );
}

render(<TransformError />);`;
                }
              }}
            >
              <div className="h-full flex flex-col">
                {/* Live Preview */}
                <div className="h-full overflow-auto">
                  <div className="p-4 h-full">
                    <div className="bg-white rounded-lg border h-full min-h-[100px] relative">
                      <LivePreview 
                        style={{
                          height: '100%',
                          overflow: 'auto',
                          padding: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      />
                      <LiveError 
                        style={{
                          position: 'absolute',
                          top: '16px',
                          right: '16px',
                          background: '#fee2e2',
                          color: '#dc2626',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          maxWidth: '400px',
                          wordWrap: 'break-word',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                          border: '1px solid #fecaca',
                          zIndex: 10,
                          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
                        }}
                        className="live-error"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </LiveProvider>
          )}
        </div>

        {/* Resize Handle */}
        {!isMaximized && (
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-gray-300 hover:bg-gray-400 transition-colors"
            onMouseDown={handleResizeMouseDown}
            style={{
              clipPath: 'polygon(100% 0%, 0% 100%, 100% 100%)'
            }}
          />
        )}
      </div>
    );
  } catch (error) {
    console.error('Preview error:', error);
    return (
      <div
        ref={previewRef}
        style={previewStyle}
        className="bg-red-50 border border-red-300 rounded-lg shadow-lg overflow-hidden"
      >
        <div
          className={`flex items-center justify-between p-2 bg-red-100 border-b select-none ${
            !isMaximized ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center space-x-2">
            <Move className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-medium text-red-700">Preview Error</h3>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={toggleMaximize}
              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-200 rounded transition-colors"
              aria-label={isMaximized ? 'Minimize' : 'Maximize'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onTogglePreview}
              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-200 rounded transition-colors"
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-600 font-medium">Preview Component Error</p>
          </div>
          <p className="text-xs text-red-500 mb-3">Unable to render live preview</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-red-600 hover:text-red-800 underline"
          >
            Refresh to try again
          </button>
        </div>
      </div>
    );
  }
}
