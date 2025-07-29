'use client';

import { useState, useEffect, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { usePlaygroundStore } from '@/store/usePlaygroundStore';
import { Copy, Download, Save, Edit3, X, Check, Settings, Eye, EyeOff, MessageCircleCode } from 'lucide-react';
import toast from 'react-hot-toast';

type SupportedLanguage = 'javascript' | 'typescript' | 'jsx' | 'tsx';

interface CodeEditorProps {
  showPreview: boolean;
  onTogglePreview: () => void;
  onEditStart?: () => void;
  onEditEnd?: () => void;
}

export default function CodeEditor({ showPreview, onTogglePreview, onEditStart, onEditEnd }: CodeEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const { 
    currentCode, 
    currentLanguage, 
    updateCode, 
    setLanguage,
    createSession,
    updateSession,
    activeSessionId,
    sessions,
    useLastAICode,
    codeUpdateTrigger
  } = usePlaygroundStore();

  useEffect(() => {
    setEditedCode(currentCode);
  }, [currentCode, codeUpdateTrigger]); // Also watch for the trigger

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      toast.success('Code copied to clipboard!');
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('Failed to copy code. Please try again.');
    }
  }, [currentCode]);

  const getFileExtension = useCallback((language: SupportedLanguage): string => {
    const extensions = {
      javascript: 'js',
      typescript: 'ts',
      jsx: 'jsx',
      tsx: 'tsx'
    };
    return extensions[language];
  }, []);

  const getFileName = useCallback((code: string, language: SupportedLanguage): string => {
    // Try to extract component name from code
    const componentMatch = code.match(/(?:export\s+default\s+function\s+|function\s+|const\s+)(\w+)/);
    const componentName = componentMatch ? componentMatch[1] : 'Component';
    return `${componentName}.${getFileExtension(language)}`;
  }, [getFileExtension]);

  const handleDownloadCode = useCallback(() => {
    try {
      const blob = new Blob([currentCode], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = getFileName(currentCode, currentLanguage);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Code downloaded successfully!');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download code. Please try again.');
    }
  }, [currentCode, currentLanguage, getFileName]);

  const handleSaveCode = useCallback(() => {
    if (isEditing) {
      if (editedCode.trim() === '') {
        toast.error('Code cannot be empty');
        return;
      }
      updateCode(editedCode);
      setIsEditing(false);
      onEditEnd?.(); // Call the edit end callback
      toast.success('Code saved successfully!');
    } else {
      setIsEditing(true);
      onEditStart?.(); // Call the edit start callback
    }
  }, [isEditing, editedCode, updateCode, onEditStart, onEditEnd]);

  const handleCancelEdit = useCallback(() => {
    setEditedCode(currentCode);
    setIsEditing(false);
    onEditEnd?.(); // Call the edit end callback when cancelling
    toast('Edit cancelled', { icon: 'ℹ️' });
  }, [currentCode, onEditEnd]);

  const handleSaveSession = useCallback(async () => {
    try {
      if (activeSessionId) {
        // Update existing session
        const currentSession = sessions.find(s => s.id === activeSessionId);
        if (currentSession) {
          await updateSession(activeSessionId, {
            code: currentCode,
            language: currentLanguage,
            updatedAt: new Date()
          });
          toast.success('Session updated successfully!');
        } else {
          toast.error('Current session not found');
        }
      } else {
        // Create new session
        const title = prompt('Enter session title:');
        if (title?.trim()) {
          await createSession(title.trim());
          toast.success('New session created successfully!');
        } else if (title === '') {
          toast.error('Session title cannot be empty');
        }
      }
    } catch (error) {
      console.error('Session save failed:', error);
      toast.error('Failed to save session. Please try again.');
    }
  }, [activeSessionId, sessions, updateSession, currentCode, currentLanguage, createSession]);

  const handleLanguageChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = event.target.value as SupportedLanguage;
    setLanguage(lang);
    toast.success(`Language changed to ${lang.toUpperCase()}`);
  }, [setLanguage]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const handleUseLastAICode = useCallback(() => {
    try {
      useLastAICode();
      toast.success('Last AI code applied successfully!');
    } catch (error) {
      console.error('Failed to use last AI code:', error);
      toast.error('No AI code found in chat history');
    }
  }, [useLastAICode]);

  return (
    <div className={`flex flex-col bg-white ${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 flex-shrink-0">
        <div className="flex items-center space-x-4 min-w-0">
          <h2 className="font-semibold text-gray-900 whitespace-nowrap">Code Editor</h2>
          
          {/* Language Selector */}
          <select
            value={currentLanguage}
            onChange={handleLanguageChange}
            className="text-xs px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white transition-colors"
            aria-label="Select programming language"
          >
            <option value="jsx">JSX</option>
            <option value="tsx">TSX</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
          </select>
        </div>

        <div className="flex items-center space-x-1 flex-shrink-0 overflow-x-auto">
          <button
            onClick={toggleFullscreen}
            className="flex items-center space-x-1 px-2 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors whitespace-nowrap"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            <Settings className="w-3 h-3" />
            <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>
          
          <button
            onClick={onTogglePreview}
            className="flex items-center space-x-1 px-2 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors whitespace-nowrap"
            aria-label={showPreview ? 'Hide preview' : 'Show preview'}
          >
            {showPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            <span className="hidden sm:inline">{showPreview ? 'Hide' : 'Show'} Preview</span>
          </button>
          
          <button
            onClick={handleUseLastAICode}
            className="flex items-center space-x-1 px-2 py-1.5 text-xs text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-md transition-colors whitespace-nowrap"
            aria-label="Use last AI generated code"
          >
            <MessageCircleCode className="w-3 h-3" />
            <span className="hidden sm:inline">Use AI Code</span>
          </button>
          
          <button
            onClick={handleCopyCode}
            className="flex items-center space-x-1 px-2 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors whitespace-nowrap"
            aria-label="Copy code to clipboard"
          >
            <Copy className="w-3 h-3" />
            <span className="hidden sm:inline">Copy</span>
          </button>
          
          <button
            onClick={handleDownloadCode}
            className="flex items-center space-x-1 px-2 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors whitespace-nowrap"
            aria-label="Download code file"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Download</span>
          </button>
          
          <button
            onClick={handleSaveSession}
            className="flex items-center space-x-1 px-2 py-1.5 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors whitespace-nowrap"
            aria-label={activeSessionId ? "Update current session" : "Save as new session"}
          >
            <Save className="w-3 h-3" />
            <span className="hidden sm:inline">
              {activeSessionId ? 'Update Session' : 'Save Session'}
            </span>
          </button>
        </div>
      </div>

      {/* Code Display/Editor */}
      <div className="flex-1 overflow-hidden min-h-0">
        {isEditing ? (
          <div className="h-full flex flex-col min-h-0">
            <div className="flex items-center justify-between p-3 bg-yellow-50 border-b flex-shrink-0">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-700 font-medium">Editing Mode</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
                  aria-label="Cancel editing"
                >
                  <X className="w-3 h-3" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSaveCode}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  aria-label="Save changes"
                >
                  <Check className="w-3 h-3" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden min-h-0 relative">
              <textarea
                value={editedCode}
                onChange={(e) => setEditedCode(e.target.value)}
                className="absolute inset-0 w-full h-full p-4 font-mono text-sm border-none outline-none resize-none text-gray-900 bg-transparent z-10 caret-gray-900"
                style={{ 
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                  lineHeight: '1.6',
                  fontSize: '14px',
                  color: 'transparent',
                  caretColor: '#1f2937'
                }}
                placeholder=""
                aria-label="Code editor textarea"
                spellCheck={false}
              />
              <div className="absolute inset-0 pointer-events-none overflow-auto">
                <SyntaxHighlighter
                  language={currentLanguage === 'tsx' ? 'typescript' : currentLanguage}
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    padding: '1rem',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    background: '#1e1e1e',
                    width: '100%',
                    minWidth: '100%',
                    maxWidth: '100%',
                    overflowX: 'hidden',
                    minHeight: '100%'
                  }}
                  showLineNumbers={true}
                  wrapLines={true}
                  wrapLongLines={true}
                  codeTagProps={{
                    style: {
                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word'
                    }
                  }}
                >
                  {editedCode || '// Enter your code here...'}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto overflow-x-hidden bg-gray-900 min-h-0">
            <div className="relative min-h-full w-full">
              {/* File Info Bar */}
              <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-300 font-medium">
                    {getFileName(currentCode, currentLanguage)}
                  </span>
                </div>
                <button
                  onClick={handleSaveCode}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors text-xs"
                  title="Edit code"
                  aria-label="Switch to edit mode"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>
              <div className="overflow-y-auto overflow-x-hidden w-full">
                <SyntaxHighlighter
                  language={currentLanguage === 'tsx' ? 'typescript' : currentLanguage}
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    padding: '1.5rem',
                    paddingTop: '4rem',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    background: 'transparent',
                    width: '100%',
                    minWidth: '100%',
                    maxWidth: '100%',
                    overflowX: 'hidden',
                  }}
                  showLineNumbers={true}
                  wrapLines={true}
                  wrapLongLines={true}
                  codeTagProps={{
                    style: {
                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word'
                    }
                  }}
                >
                  {currentCode || '// No code to display\n// Ask AI to generate some code!'}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
