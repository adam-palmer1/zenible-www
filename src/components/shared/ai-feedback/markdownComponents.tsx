import React from 'react';

type MarkdownVariant = 'analysis' | 'message';

export function getMarkdownComponents(darkMode: boolean, variant: MarkdownVariant = 'analysis') {
  const isAnalysis = variant === 'analysis';

  return {
    h1: ({children}: {children?: React.ReactNode}) => (
      <h1 className={`${isAnalysis ? 'text-lg sm:text-xl font-semibold mt-4 mb-2' : 'text-base font-semibold mt-2 mb-1'} ${darkMode ? 'text-white' : 'text-zinc-950'}`}>{children}</h1>
    ),
    h2: ({children}: {children?: React.ReactNode}) => (
      <h2 className={`${isAnalysis ? 'text-base sm:text-lg font-semibold mt-3 mb-2' : 'text-sm font-semibold mt-2 mb-1'} ${darkMode ? 'text-white' : 'text-zinc-950'}`}>{children}</h2>
    ),
    h3: ({children}: {children?: React.ReactNode}) => (
      <h3 className={`${isAnalysis ? 'text-sm sm:text-base font-semibold mt-2 mb-1' : 'text-sm font-semibold mt-1 mb-1'} ${darkMode ? 'text-white' : 'text-zinc-950'}`}>{children}</h3>
    ),
    h4: ({children}: {children?: React.ReactNode}) => (
      <h4 className={`${isAnalysis ? 'text-xs sm:text-sm font-semibold mt-2 mb-1' : 'text-xs font-semibold mt-1 mb-1'} ${darkMode ? 'text-white' : 'text-zinc-950'}`}>{children}</h4>
    ),
    p: ({children}: {children?: React.ReactNode}) => (
      <p className={`${isAnalysis ? 'mb-3' : 'mb-2'} ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{children}</p>
    ),
    ul: ({children}: {children?: React.ReactNode}) => (
      <ul className={`list-disc ${isAnalysis ? 'ml-5 mb-3 space-y-1' : 'ml-4 mb-2 space-y-0.5'} ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{children}</ul>
    ),
    ol: ({children}: {children?: React.ReactNode}) => (
      <ol className={`list-decimal ${isAnalysis ? 'ml-5 mb-3 space-y-1' : 'ml-4 mb-2 space-y-0.5'} ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{children}</ol>
    ),
    li: ({children}: {children?: React.ReactNode}) => (
      <li className={`${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{children}</li>
    ),
    blockquote: ({children}: {children?: React.ReactNode}) => (
      <blockquote className={`${isAnalysis ? 'border-l-4 pl-4 my-3' : 'border-l-2 pl-2 my-2'} ${
        darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'
      }`}>
        {children}
      </blockquote>
    ),
    code: ({inline, children}: {inline?: boolean; children?: React.ReactNode}) => {
      if (inline) {
        return (
          <code className={`px-1 py-0.5 rounded text-xs ${
            darkMode ? 'bg-gray-800 text-purple-300' : 'bg-gray-100 text-purple-700'
          }`}>
            {children}
          </code>
        );
      }
      return (
        <code className={`block ${isAnalysis ? 'p-3' : 'p-2'} rounded-lg overflow-x-auto text-xs ${
          darkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-800'
        }`}>
          {children}
        </code>
      );
    },
    pre: ({children}: {children?: React.ReactNode}) => (
      <pre className={`rounded-lg overflow-x-auto ${isAnalysis ? 'my-3' : 'my-2'} ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        {children}
      </pre>
    ),
    strong: ({children}: {children?: React.ReactNode}) => (
      <strong className={`font-semibold ${darkMode ? 'text-white' : 'text-zinc-950'}`}>{children}</strong>
    ),
    em: ({children}: {children?: React.ReactNode}) => (
      <em className={`italic ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{children}</em>
    ),
    hr: () => (
      <hr className={`${isAnalysis ? 'my-4' : 'my-2'} ${darkMode ? 'border-gray-700' : 'border-gray-300'}`} />
    ),
    a: ({href, children}: {href?: string; children?: React.ReactNode}) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`underline hover:no-underline ${
          darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
        }`}
      >
        {children}
      </a>
    ),
    ...(isAnalysis ? {
      table: ({children}: {children?: React.ReactNode}) => (
        <table className={`min-w-full divide-y my-3 ${
          darkMode ? 'divide-gray-700' : 'divide-gray-300'
        }`}>
          {children}
        </table>
      ),
      th: ({children}: {children?: React.ReactNode}) => (
        <th className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider ${
          darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
        }`}>
          {children}
        </th>
      ),
      td: ({children}: {children?: React.ReactNode}) => (
        <td className={`px-3 py-2 text-xs ${
          darkMode ? 'text-gray-200 border-gray-700' : 'text-gray-800 border-gray-200'
        }`}>
          {children}
        </td>
      ),
    } : {}),
  };
}
