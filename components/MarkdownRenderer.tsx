
import React from 'react';

interface Props {
  content: string;
}

const MarkdownRenderer: React.FC<Props> = ({ content }) => {
  const renderContent = (text: string = "") => {
    if (!text) return { __html: "" };
    
    // 基础 Markdown 替换逻辑
    let processed = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 加粗
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // 斜体
    processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // 无序列表
    processed = processed.replace(/^\s*-\s+(.*)$/gm, '<li class="ml-4 list-disc">$1</li>');
    // 有序列表
    processed = processed.replace(/^\s*(\d+)\.\s+(.*)$/gm, '<li class="ml-4 list-decimal">$2</li>');
    // 代码块
    processed = processed.replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-red-500 px-1 rounded font-mono text-xs">$1</code>');
    // 换行
    processed = processed.replace(/\n/g, '<br />');
    
    return { __html: processed };
  };

  return (
    <div 
      className="markdown-content text-[13px] sm:text-base leading-relaxed break-words"
      dangerouslySetInnerHTML={renderContent(content)}
    />
  );
};

export default MarkdownRenderer;
