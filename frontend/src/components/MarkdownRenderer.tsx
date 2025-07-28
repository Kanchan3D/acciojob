'use client';

import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const renderContent = () => {
    // Split content by code blocks
    const parts = content.split(/(```[\s\S]*?```)/);
    
    return parts.map((part, index) => {
      // Check if this part is a code block
      if (part.startsWith('```') && part.endsWith('```')) {
        // Extract language and code
        const lines = part.slice(3, -3).split('\n');
        const language = lines[0].trim() || 'javascript';
        const code = lines.slice(1).join('\n');
        
        return (
          <div key={index} className="my-2 max-w-full overflow-hidden">
            <SyntaxHighlighter
              language={language}
              style={vscDarkPlus}
              className="rounded-md !text-sm max-w-full"
              customStyle={{
                margin: 0,
                fontSize: '12px',
                lineHeight: '1.3',
                backgroundColor: '#1e1e1e',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #333',
                maxWidth: '100%',
                overflow: 'auto',
              }}
              showLineNumbers={false}
              wrapLongLines={true}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        );
      }
      
      // Regular text with markdown formatting
      return (
        <div key={index} className="markdown-content">
          {renderMarkdownText(part)}
        </div>
      );
    });
  };

  const renderMarkdownText = (text: string) => {
    // Split by lines to handle different markdown elements
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.trim() === '') {
        elements.push(<br key={i} />);
        continue;
      }
      
      // Handle headers
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={i} className="text-base font-semibold mt-3 mb-2 text-gray-800">
            {line.slice(4)}
          </h3>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={i} className="text-lg font-semibold mt-3 mb-2 text-gray-800">
            {line.slice(3)}
          </h2>
        );
      } else if (line.startsWith('# ')) {
        elements.push(
          <h1 key={i} className="text-xl font-bold mt-3 mb-2 text-gray-800">
            {line.slice(2)}
          </h1>
        );
      }
      // Handle bullet points
      else if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const content = line.trim().slice(2);
        elements.push(
          <div key={i} className="flex items-start mb-1 ml-2">
            <span className="text-blue-500 mr-2 mt-1 text-sm flex-shrink-0">•</span>
            <span className="flex-1 text-sm break-words overflow-hidden">{renderInlineMarkdown(content)}</span>
          </div>
        );
      }
      // Handle numbered lists
      else if (/^\d+\.\s/.test(line.trim())) {
        const content = line.trim().replace(/^\d+\.\s/, '');
        const number = line.trim().match(/^(\d+)\./)?.[1];
        elements.push(
          <div key={i} className="flex items-start mb-1 ml-2">
            <span className="text-blue-500 mr-2 mt-1 font-medium text-sm flex-shrink-0">{number}.</span>
            <span className="flex-1 text-sm break-words overflow-hidden">{renderInlineMarkdown(content)}</span>
          </div>
        );
      }
      // Handle inline code
      else if (line.includes('`') && !line.startsWith('```')) {
        elements.push(
          <p key={i} className="mb-2 text-sm break-words overflow-hidden">
            {renderInlineMarkdown(line)}
          </p>
        );
      }
      // Regular paragraphs
      else {
        elements.push(
          <p key={i} className="mb-2 text-sm leading-relaxed break-words overflow-hidden">
            {renderInlineMarkdown(line)}
          </p>
        );
      }
    }
    
    return elements;
  };

  const renderInlineMarkdown = (text: string) => {
    // Handle inline code
    const parts = text.split(/(`[^`]+`)/);
    
    return parts.map((part, index) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={index}
            className="bg-gray-200 px-1.5 py-0.5 rounded text-xs font-mono text-gray-700"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      
      // Handle bold text
      if (part.includes('**')) {
        const boldParts = part.split(/(\*\*[^*]+\*\*)/);
        return boldParts.map((boldPart, boldIndex) => {
          if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
            return (
              <strong key={`${index}-${boldIndex}`} className="font-semibold">
                {boldPart.slice(2, -2)}
              </strong>
            );
          }
          return boldPart;
        });
      }
      
      return part;
    });
  };

  return (
    <div className={`markdown-renderer max-w-full overflow-hidden ${className}`}>
      {renderContent()}
    </div>
  );
}