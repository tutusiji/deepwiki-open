import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';

const Mermaid = dynamic(() => import('./Mermaid'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[240px] items-center justify-center rounded-md border border-dashed border-[var(--border-color)]/70 bg-[var(--background)]/40 p-4 text-xs text-[var(--muted)]">
      Loading diagram runtime...
    </div>
  ),
});

interface MarkdownProps {
  content: string;
}

function estimateMermaidHeight(chart: string): number {
  const lineCount = chart.split(/\r?\n/).filter(Boolean).length;
  return Math.max(220, Math.min(520, 180 + lineCount * 10));
}

const MermaidBlock: React.FC<{ chart: string }> = ({ chart }) => {
  const lineCount = chart.split(/\r?\n/).filter(Boolean).length;
  const isLargeDiagram = lineCount > 18 || chart.length > 1200;
  const estimatedHeight = estimateMermaidHeight(chart);
  const [isExpanded, setIsExpanded] = useState(!isLargeDiagram);

  return (
    <div className="my-8 overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[var(--border-color)] bg-[var(--background)]/60 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-semibold text-[var(--foreground)]">Mermaid Diagram</div>
          <div className="text-xs text-[var(--muted)]">
            {lineCount} lines
            {isLargeDiagram ? ' · deferred by default for smoother scrolling' : ' · rendered inline'}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(current => !current)}
          className="inline-flex items-center justify-center rounded-md border border-[var(--border-color)] px-3 py-2 text-xs font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--background)]"
        >
          {isExpanded ? 'Collapse Diagram' : 'Render Diagram'}
        </button>
      </div>

      {isExpanded ? (
        <div className="px-3 py-4">
          <Mermaid
            chart={chart}
            className="w-full max-w-full"
            zoomingEnabled={true}
            deferUntilVisible={true}
            estimatedHeight={estimatedHeight}
          />
        </div>
      ) : (
        <div
          className="flex items-center justify-center px-4 py-6 text-center text-xs text-[var(--muted)]"
          style={{ minHeight: `${Math.min(estimatedHeight, 260)}px` }}
        >
          Expand this diagram only when you need it. This keeps long pages more stable while Mermaid finishes rendering.
        </div>
      )}
    </div>
  );
};

const CodeComponent: NonNullable<Components['code']> = ({ className, children, ...props }) => {
  const { inline, ...restProps } = props as typeof props & { inline?: boolean };
  const match = /language-(\w+)/.exec(className || '');
  const codeContent = children ? String(children).replace(/\n$/, '') : '';

  if (!inline && match && match[1] === 'mermaid') {
    return <MermaidBlock chart={codeContent} />;
  }

  if (!inline && match) {
    return (
      <div className="my-6 overflow-hidden rounded-md text-sm shadow-sm">
        <div className="flex items-center justify-between bg-gray-800 px-5 py-2 text-sm text-gray-200">
          <span>{match[1]}</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(codeContent);
            }}
            className="text-gray-400 hover:text-white"
            title="Copy code"
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 01-2-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
        </div>
        <SyntaxHighlighter
          language={match[1]}
          style={tomorrow}
          className="!text-sm"
          customStyle={{ margin: 0, borderRadius: '0 0 0.375rem 0.375rem', padding: '1rem' }}
          showLineNumbers={true}
          wrapLines={true}
          wrapLongLines={true}
        >
          {codeContent}
        </SyntaxHighlighter>
      </div>
    );
  }

  return (
    <code
      className={`${className} rounded bg-gray-100 px-2 py-0.5 font-mono text-sm text-pink-500 dark:bg-gray-800 dark:text-pink-400`}
      {...restProps}
    >
      {children}
    </code>
  );
};

const Markdown: React.FC<MarkdownProps> = ({ content }) => {
  const MarkdownComponents: Components = {
    p({ children, ...props }: { children?: React.ReactNode }) {
      return <p className="mb-3 text-sm leading-relaxed dark:text-white" {...props}>{children}</p>;
    },
    h1({ children, ...props }: { children?: React.ReactNode }) {
      const id = typeof children === 'string'
        ? children.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-')
        : '';
      return <h1 id={id || 'heading-1'} className="mt-6 mb-3 text-xl font-bold dark:text-white" style={{ scrollMarginTop: '80px' }} {...props}>{children}</h1>;
    },
    h2({ children, ...props }: { children?: React.ReactNode }) {
      const id = typeof children === 'string'
        ? children.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-')
        : '';
      if (children && typeof children === 'string') {
        const text = children.toString();
        if (text.includes('Thought') || text.includes('Action') || text.includes('Observation') || text.includes('Answer')) {
          return (
            <h2
              id={id || 'heading-2'}
              className={`mt-5 mb-3 rounded p-2 text-base font-bold ${
                text.includes('Thought') ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                text.includes('Action') ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                text.includes('Observation') ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                text.includes('Answer') ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                'dark:text-white'
              }`}
              style={{ scrollMarginTop: '80px' }}
              {...props}
            >
              {children}
            </h2>
          );
        }
      }
      return <h2 id={id || 'heading-2'} className="mt-5 mb-3 text-lg font-bold dark:text-white" style={{ scrollMarginTop: '80px' }} {...props}>{children}</h2>;
    },
    h3({ children, ...props }: { children?: React.ReactNode }) {
      const id = typeof children === 'string'
        ? children.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-')
        : '';
      return <h3 id={id || 'heading-3'} className="mt-4 mb-2 text-base font-semibold dark:text-white" style={{ scrollMarginTop: '80px' }} {...props}>{children}</h3>;
    },
    h4({ children, ...props }: { children?: React.ReactNode }) {
      const id = typeof children === 'string'
        ? children.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-')
        : '';
      return <h4 id={id || 'heading-4'} className="mt-3 mb-2 text-sm font-semibold dark:text-white" style={{ scrollMarginTop: '80px' }} {...props}>{children}</h4>;
    },
    ul({ children, ...props }: { children?: React.ReactNode }) {
      return <ul className="mb-4 list-disc space-y-2 pl-6 text-sm dark:text-white" {...props}>{children}</ul>;
    },
    ol({ children, ...props }: { children?: React.ReactNode }) {
      return <ol className="mb-4 list-decimal space-y-2 pl-6 text-sm dark:text-white" {...props}>{children}</ol>;
    },
    li({ children, ...props }: { children?: React.ReactNode }) {
      return <li className="mb-2 text-sm leading-relaxed dark:text-white" {...props}>{children}</li>;
    },
    a({ children, href, ...props }: { children?: React.ReactNode; href?: string }) {
      return (
        <a
          href={href}
          className="font-medium text-purple-600 hover:underline dark:text-purple-400"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      );
    },
    blockquote({ children, ...props }: { children?: React.ReactNode }) {
      return (
        <blockquote
          className="my-4 border-l-4 border-gray-300 py-1 pl-4 text-sm italic text-gray-700 dark:border-gray-700 dark:text-gray-300"
          {...props}
        >
          {children}
        </blockquote>
      );
    },
    table({ children, ...props }: { children?: React.ReactNode }) {
      return (
        <div className="my-6 overflow-x-auto rounded-md">
          <table className="min-w-full border-collapse text-sm" {...props}>
            {children}
          </table>
        </div>
      );
    },
    thead({ children, ...props }: { children?: React.ReactNode }) {
      return <thead className="bg-gray-100 dark:bg-gray-800" {...props}>{children}</thead>;
    },
    tbody({ children, ...props }: { children?: React.ReactNode }) {
      return <tbody className="divide-y divide-gray-200 dark:divide-gray-700" {...props}>{children}</tbody>;
    },
    tr({ children, ...props }: { children?: React.ReactNode }) {
      return <tr className="hover:bg-gray-50 dark:hover:bg-gray-900" {...props}>{children}</tr>;
    },
    th({ children, ...props }: { children?: React.ReactNode }) {
      return (
        <th
          className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300"
          {...props}
        >
          {children}
        </th>
      );
    },
    td({ children, ...props }: { children?: React.ReactNode }) {
      return <td className="border-t border-gray-200 px-4 py-3 dark:border-gray-700" {...props}>{children}</td>;
    },
    code: CodeComponent,
  };

  return (
    <div className="prose prose-base max-w-none px-2 py-4 dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={MarkdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default Markdown;
