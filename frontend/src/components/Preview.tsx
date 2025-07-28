'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { Eye, X, Move, Maximize2, Minimize2, Monitor, Square, AlertCircle, Play } from 'lucide-react';
import { LiveProvider, LivePreview, LiveError } from 'react-live';
import { usePlaygroundStore } from '@/store/usePlaygroundStore';
import React from 'react';

interface PreviewProps {
  showPreview: boolean;
  onTogglePreview: () => void;
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
  // Add more commonly used components/libraries as needed
};

export default function Preview({ showPreview, onTogglePreview }: PreviewProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 480, height: 270 }); // 16:9 ratio (480x270)
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showCode, setShowCode] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get current code from playground store
  const { currentCode, currentLanguage } = usePlaygroundStore();

  // Set default position to bottom-right
  useEffect(() => {
    const updatePosition = () => {
      if (typeof window !== 'undefined') {
        const padding = 20;
        setPosition({
          x: window.innerWidth - size.width - padding,
          y: window.innerHeight - size.height - padding - 100 // Account for navbar
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

  // Process code for React Live
  const processCodeForPreview = useCallback((code: string, language: string) => {
    if (!code || !code.trim()) {
      return `function EmptyComponent() {
  return (
    <div style={{
      padding: '20px',
      textAlign: 'center',
      color: '#6b7280',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      border: '2px dashed #d1d5db'
    }}>
      <h3>No Code Available</h3>
      <p>Start coding in the editor to see live preview</p>
    </div>
  );
}

render(<EmptyComponent />);`;
    }

    try {
      let processedCode = code;

      // Remove import statements (React is already in scope)
      processedCode = processedCode.replace(/import\s+.*?from\s+['"][^'"]*['"];?\s*/g, '');
      processedCode = processedCode.replace(/import\s+['"][^'"]*['"];?\s*/g, '');

      // Remove TypeScript interfaces and type definitions (multi-line support)
      processedCode = processedCode.replace(/interface\s+\w+\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\s*/g, '');
      processedCode = processedCode.replace(/type\s+\w+\s*=\s*[^;]+;\s*/g, '');

      // Remove TypeScript type annotations
      processedCode = processedCode.replace(/:\s*React\.FC<[^>]*>/g, '');
      processedCode = processedCode.replace(/:\s*React\.ReactNode/g, '');
      processedCode = processedCode.replace(/:\s*\w+(\[\])?(?=\s*[=,)])/g, '');
      processedCode = processedCode.replace(/<[^>]+>(?=\s*\()/g, ''); // Remove generic type parameters
      processedCode = processedCode.replace(/:\s*\([^)]*\)\s*=>\s*\w+/g, ''); // Remove function type annotations

      // Enhanced className to style conversion with more Tailwind classes
      const classNameToStyle = (className: string) => {
        const styleMap: { [key: string]: string } = {
          // Colors
          'bg-blue-500': 'backgroundColor: "#3b82f6"',
          'bg-blue-700': 'backgroundColor: "#1d4ed8"',
          'bg-gray-500': 'backgroundColor: "#6b7280"',
          'bg-gray-700': 'backgroundColor: "#374151"',
          'bg-gray-100': 'backgroundColor: "#f3f4f6"',
          'bg-gray-300': 'backgroundColor: "#d1d5db"',
          'bg-gray-800': 'backgroundColor: "#1f2937"',
          'bg-gray-900': 'backgroundColor: "#111827"',
          'bg-green-500': 'backgroundColor: "#10b981"',
          'bg-green-700': 'backgroundColor: "#047857"',
          'bg-red-500': 'backgroundColor: "#ef4444"',
          'bg-red-700': 'backgroundColor: "#b91c1c"',
          'bg-yellow-500': 'backgroundColor: "#eab308"',
          'bg-yellow-700': 'backgroundColor: "#a16207"',
          'bg-cyan-500': 'backgroundColor: "#06b6d4"',
          'bg-cyan-700': 'backgroundColor: "#0e7490"',
          
          // Text colors
          'text-white': 'color: "white"',
          'text-gray-800': 'color: "#1f2937"',
          'text-2xl': 'fontSize: "1.5rem"',
          
          // Font
          'font-bold': 'fontWeight: "bold"',
          
          // Padding
          'p-4': 'padding: "16px"',
          'py-2': 'paddingTop: "8px", paddingBottom: "8px"',
          'px-4': 'paddingLeft: "16px", paddingRight: "16px"',
          
          // Border radius
          'rounded': 'borderRadius: "4px"',
          
          // Remove hover and focus states for React Live
          'hover:bg-blue-700': '',
          'hover:bg-gray-700': '',
          'hover:bg-gray-300': '',
          'hover:bg-gray-900': '',
          'hover:bg-green-700': '',
          'hover:bg-red-700': '',
          'hover:bg-yellow-700': '',
          'hover:bg-cyan-700': '',
          'focus:outline-none': '',
          'focus:shadow-outline': ''
        };

        return className.split(/\s+/)
          .map(cls => styleMap[cls.trim()] || '')
          .filter(style => style)
          .join(', ');
      };

      // Replace className with style objects
      processedCode = processedCode.replace(/className\s*=\s*["'`]([^"'`]+)["'`]/g, (match, classes) => {
        const styles = classNameToStyle(classes);
        return styles ? `style={{${styles}}}` : '';
      });

      // Handle template literals in className
      processedCode = processedCode.replace(/className\s*=\s*\{`([^`]+)`\}/g, (match, classes) => {
        // For template literals, just remove className for now (too complex to parse)
        return '';
      });

      // Remove complex className expressions that use variables
      processedCode = processedCode.replace(/className\s*=\s*\{[^}]+\}/g, '');

      // Remove object property definitions that might cause issues
      processedCode = processedCode.replace(/const\s+\w+\s*=\s*\{[^}]*\};\s*/g, '');

      // Clean up export statements more carefully
      processedCode = processedCode.replace(/export\s+default\s+(?=function)/g, '');
      processedCode = processedCode.replace(/export\s+default\s+(\w+);?\s*$/gm, '');
      processedCode = processedCode.replace(/export\s+\{[^}]*\}.*;?\s*/g, '');

      // Clean up extra whitespace and comments
      processedCode = processedCode.replace(/\/\/.*$/gm, ''); // Remove single-line comments
      processedCode = processedCode.replace(/\n\s*\n\s*\n/g, '\n\n').trim();

      // For JSX/TSX, ensure we have a proper component
      if (language === 'jsx' || language === 'tsx') {
        // If it's a function component, add render call
        if (processedCode.includes('function ') || (processedCode.includes('const ') && processedCode.includes('=>'))) {
          // Extract component name
          const functionMatch = processedCode.match(/(?:function\s+(\w+)|const\s+(\w+)\s*[:=])/);
          const componentName = functionMatch ? (functionMatch[1] || functionMatch[2]) : 'Component';
          
          if (!processedCode.includes('render(')) {
            processedCode += `\n\nrender(<${componentName} />);`;
          }
          return processedCode;
        }
        
        // If it's just JSX, wrap in a component
        if (processedCode.includes('<') && processedCode.includes('>')) {
          return `function PreviewComponent() {
  return (
    ${processedCode}
  );
}

render(<PreviewComponent />);`;
        }
      }
      
      // For JavaScript/TypeScript, create a simple display
      return `function CodePreview() {
  const result = (() => {
    ${processedCode}
  })();
  
  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      fontFamily: 'monospace'
    }}>
      <h4>Code Execution Result:</h4>
      <pre style={{ 
        background: '#e2e8f0', 
        padding: '10px', 
        borderRadius: '4px',
        whiteSpace: 'pre-wrap'
      }}>
        {typeof result !== 'undefined' ? JSON.stringify(result, null, 2) : 'Code executed successfully'}
      </pre>
    </div>
  );
}

render(<CodePreview />);`;
    } catch (error) {
      return `function ErrorComponent() {
  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#fef2f2',
      borderRadius: '8px',
      color: '#dc2626'
    }}>
      <h4>⚠️ Code Processing Error</h4>
      <p>Unable to process code for preview</p>
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
          </div>
          <div className="flex items-center space-x-1">
            {/* Show/Hide Code Button */}
            <button
              onClick={() => setShowCode(prev => !prev)}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
              aria-label={showCode ? 'Hide code' : 'Show code'}
            >
              <Eye className="w-4 h-4" />
            </button>
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
          <LiveProvider 
            key={`${currentCode.length}-${currentLanguage}`}
            code={processedCode} 
            scope={scope}
            noInline={needsNoInline}
          >
            <div className="h-full flex flex-col">
              {/* Live Preview */}
              <div className={`${showCode ? 'h-1/2' : 'h-full'} overflow-auto border-b`}>
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
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        maxWidth: '300px',
                        wordWrap: 'break-word',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Code Display (when toggled) */}
              {showCode && (
                <div className="h-1/2 overflow-auto bg-gray-900 text-white">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-300">Source Code</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400">
                          {currentCode.split('\n').length} lines
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-400">
                          {currentLanguage.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <pre className="text-sm overflow-auto">
                      <code>{currentCode || '// No code available'}</code>
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </LiveProvider>
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
