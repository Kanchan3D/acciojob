'use client';

import { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { usePlaygroundStore } from '@/store/usePlaygroundStore';
import { Copy, Download, Save, RefreshCw, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CodeEditor() {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  
  const { 
    currentCode, 
    currentLanguage, 
    updateCode, 
    setLanguage,
    createSession,
    activeSessionId 
  } = usePlaygroundStore();

  useEffect(() => {
    setEditedCode(currentCode);
  }, [currentCode]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      toast.success('Code copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  const handleDownloadCode = () => {
    const blob = new Blob([currentCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `component.${currentLanguage}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Code downloaded!');
  };

  const handleSaveCode = () => {
    if (isEditing) {
      updateCode(editedCode);
      setIsEditing(false);
      toast.success('Code saved!');
    } else {
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setEditedCode(currentCode);
    setIsEditing(false);
  };

  const handleSaveSession = () => {
    const title = prompt('Enter session title:');
    if (title) {
      createSession(title);
      toast.success('Session saved!');
    }
  };

  const handleLanguageChange = (lang: 'javascript' | 'typescript' | 'jsx' | 'tsx') => {
    setLanguage(lang);
    toast.success(`Language changed to ${lang.toUpperCase()}`);
  };

  const PreviewComponent = () => {
    if (!showPreview) return null;
    
    try {
      // This is a simplified preview - in a real app you'd want to use a proper iframe sandbox
      return (
        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Preview</h3>
          <div className="bg-white p-4 rounded border">
            <p className="text-sm text-gray-600">
              Live preview would render here in a sandboxed environment
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Note: For security, live preview is disabled in this demo
            </p>
          </div>
        </div>
      );
    } catch (error) {
      return (
        <div className="mt-4 p-4 border rounded-lg bg-red-50">
          <p className="text-sm text-red-600">Preview error: Invalid component</p>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-4">
          <h2 className="font-semibold text-gray-900">Code Editor</h2>
          
          {/* Language Selector */}
          <select
            value={currentLanguage}
            onChange={(e) => handleLanguageChange(e.target.value as any)}
            className="text-xs px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          >
            <option value="jsx">JSX</option>
            <option value="tsx">TSX</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
          >
            <Settings className="w-3 h-3" />
            <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
          </button>
          
          <button
            onClick={handleCopyCode}
            className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
          >
            <Copy className="w-3 h-3" />
            <span>Copy</span>
          </button>
          
          <button
            onClick={handleDownloadCode}
            className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
          >
            <Download className="w-3 h-3" />
            <span>Download</span>
          </button>
          
          <button
            onClick={handleSaveSession}
            className="flex items-center space-x-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
          >
            <Save className="w-3 h-3" />
            <span>Save Session</span>
          </button>
        </div>
      </div>

      {/* Code Display/Editor */}
      <div className="flex-1 overflow-hidden">
        {isEditing ? (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-2 bg-yellow-50 border-b">
              <span className="text-sm text-yellow-700">Editing mode</span>
              <div className="flex space-x-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCode}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
            <textarea
              value={editedCode}
              onChange={(e) => setEditedCode(e.target.value)}
              className="flex-1 p-4 font-mono text-sm border-none outline-none resize-none text-gray-900 bg-white"
              style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace' }}
            />
          </div>
        ) : (
          <div className="h-full overflow-auto">
            <div className="relative">
              <button
                onClick={handleSaveCode}
                className="absolute top-2 right-2 z-10 p-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
                title="Edit code"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <SyntaxHighlighter
                language={currentLanguage === 'tsx' ? 'typescript' : currentLanguage}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  fontSize: '14px',
                  minHeight: '100%',
                }}
                showLineNumbers={true}
                wrapLines={true}
              >
                {currentCode}
              </SyntaxHighlighter>
            </div>
          </div>
        )}
      </div>

      {/* Preview Section */}
      <PreviewComponent />
    </div>
  );
}
