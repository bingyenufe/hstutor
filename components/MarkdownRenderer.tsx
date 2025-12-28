
import React from 'react';

interface Props {
  content: string;
}

const MarkdownRenderer: React.FC<Props> = ({ content }) => {
  // Simple regex-based markdown parser for a handful of features
  // In a real app, use react-markdown, but here we can handle basics
  const renderContent = (text: string) => {
    // Handle bold
    let processed = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Handle italics
    processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Handle bullet points
    processed = processed.replace(/^\s*-\s+(.*)$/gm, '<li class="ml-4">$1</li>');
    // Handle line breaks
    processed = processed.replace(/\n/g, '<br />');
    
    return { __html: processed };
  };

  return (
    <div 
      className="markdown-content text-sm sm:text-base leading-relaxed"
      dangerouslySetInnerHTML={renderContent(content)}
    />
  );
};

export default MarkdownRenderer;
