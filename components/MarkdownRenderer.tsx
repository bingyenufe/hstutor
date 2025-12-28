
import React, { useMemo } from 'react';
import { marked } from 'marked';
import katex from 'katex';

interface Props {
  content: string;
}

const MarkdownRenderer: React.FC<Props> = ({ content }) => {
  const htmlContent = useMemo(() => {
    if (!content) return "";

    let text = content;

    // 1. 处理块级公式 $$ ... $$
    text = text.replace(/\$\$\s*([\s\S]+?)\s*\$\$/g, (_, equation) => {
      try {
        return `<div class="katex-display">${katex.renderToString(equation, { displayMode: true, throwOnError: false })}</div>`;
      } catch (e) {
        return `$$${equation}$$`;
      }
    });

    // 2. 处理行内公式 $ ... $
    // 使用更严谨的正则避免误伤普通的美元符号
    text = text.replace(/(?<!\\)\$([^\$\n]+?)(?<!\\)\$/g, (_, equation) => {
      try {
        return katex.renderToString(equation, { displayMode: false, throwOnError: false });
      } catch (e) {
        return `$${equation}$`;
      }
    });

    // 3. 使用 marked 渲染剩余的 Markdown
    // 配置 marked 以支持换行符转 <br>
    return marked.parse(text, { 
      breaks: true,
      gfm: true 
    }) as string;
  }, [content]);

  return (
    <div 
      className="markdown-content text-[14px] sm:text-[15px] leading-relaxed break-words"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default MarkdownRenderer;