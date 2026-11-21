import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import clsx from 'clsx';

/** Renders markdown with GFM tables, math (KaTeX) and h2/h3 hierarchy. */
export default function Markdown({ children, className }) {
  return (
    <div className={clsx('md-body text-sm text-ink leading-[1.75] dark:text-gray-200', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Render definition-style bold markers as highlighted chips.
          strong: ({ children }) => (
            <strong className="font-semibold text-ink dark:text-white">{children}</strong>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

/** Lightweight inline renderer for chat bubbles (same stack, tighter spacing). */
export function MarkdownInline({ children }) {
  return <Markdown className="[&_h1]:text-base [&_h2]:text-[15px] [&_h2]:mt-3 [&_h3]:mt-3">{children}</Markdown>;
}
