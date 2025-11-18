/**
 * Message Renderer Component
 * Beautiful markdown renderer for chat messages with syntax highlighting and JSON parsing
 */

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useTheme } from "@/hooks/use_theme";
import { cn } from "@/lib/utils";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessageRendererProps {
  content: string;
  thinking?: string;
  isStreaming?: boolean;
  className?: string;
}

/**
 * Parse and extract JSON from text
 * Tries to find and parse JSON objects in the text
 */
function parseJsonFromText(text: string): {
  json: unknown;
  remainingText: string;
} | null {
  if (!text || !text.trim()) return null;

  // Try to find JSON object in text (handles nested objects)
  // Match from first { to last } (greedy match)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const json = JSON.parse(jsonMatch[0]);
    const remainingText = text.replace(jsonMatch[0], "").trim();
    return { json, remainingText };
  } catch {
    // If JSON parsing fails, try to find a more specific match
    // Look for JSON that might be on a single line or properly formatted
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      for (let j = i; j < lines.length; j++) {
        const candidate = lines.slice(i, j + 1).join("\n");
        try {
          const json = JSON.parse(candidate);
          const remainingText = text.replace(candidate, "").trim();
          return { json, remainingText };
        } catch {
          // Continue searching
        }
      }
    }
    return null;
  }
}

/**
 * Render JSON object beautifully with syntax highlighting
 */
function JsonRenderer({
  json,
  isDark,
  isStreaming,
}: {
  json: unknown;
  isDark: boolean;
  isStreaming: boolean;
}): React.ReactElement {
  const jsonString = JSON.stringify(json, null, 2);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded border border-primary/20 bg-primary/5 overflow-hidden">
      <div className="flex items-center justify-between bg-primary/10 px-4 py-2 border-b border-primary/20">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-primary uppercase tracking-wide">
            JSON Response
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-6 px-2 text-xs"
        >
          {copied ? (
            <>
              <Check className="icon-xs mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="icon-xs mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
      <div className="relative">
        <SyntaxHighlighter
          language="json"
          style={isDark ? oneDark : oneLight}
          customStyle={{
            margin: 0,
            padding: "1rem",
            background: "transparent",
            fontSize: "0.875rem",
            lineHeight: "1.6",
          }}
          PreTag="div"
        >
          {jsonString}
        </SyntaxHighlighter>
        {isStreaming && (
          <span className="absolute bottom-2 right-2 inline-block w-2 h-4 bg-primary/50 animate-pulse" />
        )}
      </div>
    </div>
  );
}

/**
 * Render thinking with JSON parsing
 */
function ThinkingRenderer({
  thinking,
  isStreaming,
}: {
  thinking: string;
  isStreaming: boolean;
}): React.ReactElement {
  const parsedJson = useMemo(() => parseJsonFromText(thinking), [thinking]);

  return (
    <div className="rounded border border-amber-500/20 bg-amber-500/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
            Thinking Process
          </span>
        </div>
      </div>

      {parsedJson ? (
        <div className="space-y-3">
          {/* Text before JSON */}
          {parsedJson.remainingText && (
            <div className="text-sm text-muted-foreground italic whitespace-pre-wrap break-words font-mono leading-relaxed">
              {parsedJson.remainingText}
            </div>
          )}
          {/* JSON block */}
          <JsonRenderer
            json={parsedJson.json}
            isDark={false}
            isStreaming={isStreaming}
          />
        </div>
      ) : (
        <div className="text-sm text-muted-foreground italic whitespace-pre-wrap break-words font-mono leading-relaxed">
          {thinking}
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-amber-500/50 animate-pulse" />
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Markdown components factory
 */
/**
 * Code Block Component
 * Renders code blocks with syntax highlighting and copy functionality
 */
function CodeBlock({
  language,
  codeString,
  isDark,
  ...rest
}: {
  language: string;
  codeString: string;
  isDark: boolean;
  [key: string]: unknown;
}): React.ReactElement {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded border border-border bg-muted/30 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between bg-muted/50 px-4 py-2 border-b border-border">
        <span className="text-xs font-mono text-muted-foreground">
          {language}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-6 px-2 text-xs"
        >
          {copied ? (
            <>
              <Check className="icon-xs mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="icon-xs mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={isDark ? oneDark : oneLight}
        customStyle={{
          margin: 0,
          padding: "1rem",
          background: "transparent",
          fontSize: "0.875rem",
          lineHeight: "1.6",
        }}
        PreTag="div"
        {...rest}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
}

function createMarkdownComponents(isDark: boolean) {
  return {
    // Code blocks with syntax highlighting
    code(props: {
      inline?: boolean;
      className?: string;
      children?: React.ReactNode;
      [key: string]: unknown;
    }) {
      const { inline, className, children, ...rest } = props;
      const match = /language-(\w+)/.exec(className || "");

      if (!inline && match) {
        const codeString = String(children).replace(/\n$/, "");
        return (
          <CodeBlock
            language={match[1]}
            codeString={codeString}
            isDark={isDark}
            {...rest}
          />
        );
      }

      // Inline code
      return (
        <code
          className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-sm border border-border/50"
          {...rest}
        >
          {children}
        </code>
      );
    },

    // Headings
    h1: ({ children }: { children?: React.ReactNode }) => (
      <h1 className="text-2xl font-bold mt-6 mb-4 text-foreground">
        {children}
      </h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="text-xl font-semibold mt-5 mb-3 text-foreground">
        {children}
      </h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="text-lg font-semibold mt-4 mb-2 text-foreground">
        {children}
      </h3>
    ),
    h4: ({ children }: { children?: React.ReactNode }) => (
      <h4 className="text-base font-semibold mt-3 mb-2 text-foreground">
        {children}
      </h4>
    ),

    // Paragraphs
    p: ({ children }: { children?: React.ReactNode }) => (
      <p className="mb-4 leading-relaxed text-foreground">{children}</p>
    ),

    // Lists
    ul: ({ children }: { children?: React.ReactNode }) => (
      <ul className="list-disc list-inside mb-4 space-y-1 text-foreground">
        {children}
      </ul>
    ),
    ol: ({ children }: { children?: React.ReactNode }) => (
      <ol className="list-decimal list-inside mb-4 space-y-1 text-foreground">
        {children}
      </ol>
    ),
    li: ({ children }: { children?: React.ReactNode }) => (
      <li className="ml-4 mb-1 leading-relaxed">{children}</li>
    ),

    // Tables
    table: ({ children }: { children?: React.ReactNode }) => (
      <div className="my-4 overflow-x-auto">
        <table className="min-w-full border-collapse border border-border rounded">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: { children?: React.ReactNode }) => (
      <thead className="bg-muted/50">{children}</thead>
    ),
    tbody: ({ children }: { children?: React.ReactNode }) => (
      <tbody>{children}</tbody>
    ),
    tr: ({ children }: { children?: React.ReactNode }) => (
      <tr className="border-b border-border hover:bg-muted/30 transition-colors">
        {children}
      </tr>
    ),
    th: ({ children }: { children?: React.ReactNode }) => (
      <th className="px-4 py-2 text-left font-semibold text-foreground border-r border-border last:border-r-0">
        {children}
      </th>
    ),
    td: ({ children }: { children?: React.ReactNode }) => (
      <td className="px-4 py-2 text-foreground border-r border-border last:border-r-0">
        {children}
      </td>
    ),

    // Blockquotes
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="border-l-4 border-primary/50 pl-4 py-2 my-4 italic text-muted-foreground bg-muted/20 rounded-r">
        {children}
      </blockquote>
    ),

    // Links
    a: ({
      href,
      children,
    }: {
      href?: string;
      children?: React.ReactNode;
    }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline font-medium"
      >
        {children}
      </a>
    ),

    // Strong and emphasis
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => (
      <em className="italic text-foreground">{children}</em>
    ),

    // Horizontal rule
    hr: () => <hr className="my-6 border-t border-border" />,

    // Images
    img: ({ src, alt }: { src?: string; alt?: string }) => (
      <img
        src={src}
        alt={alt}
        className="my-4 rounded border border-border max-w-full h-auto"
      />
    ),
  };
}

/**
 * Message Renderer Component
 * Renders markdown content with beautiful formatting and JSON parsing
 */
export function MessageRenderer({
  content,
  thinking,
  isStreaming = false,
  className,
}: MessageRendererProps): React.ReactElement {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Parse JSON from content
  const parsedContent = useMemo(() => {
    if (!content) return null;
    return parseJsonFromText(content);
  }, [content]);

  const markdownComponents = useMemo(
    () => createMarkdownComponents(isDark),
    [isDark],
  );
	
	return (
    <div className={cn("space-y-4", className)}>
      {/* Thinking section */}
      {thinking && thinking.length > 0 && (
        <ThinkingRenderer thinking={thinking} isStreaming={isStreaming} />
      )}

      {/* Content section */}
      {parsedContent ? (
        <div className="space-y-4">
          {/* JSON block */}
          <JsonRenderer
            json={parsedContent.json}
            isDark={isDark}
            isStreaming={isStreaming}
          />
          {/* Remaining text after JSON */}
          {parsedContent.remainingText && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={markdownComponents}
              >
                {parsedContent.remainingText}
              </ReactMarkdown>
            </div>
          )}
        </div>
      ) : (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={markdownComponents}
          >
            {content || (isStreaming && " ")}
          </ReactMarkdown>

          {/* Streaming indicator */}
          {isStreaming && content && (
            <span className="inline-block w-2 h-4 ml-1 bg-foreground/50 animate-pulse" />
          )}

          {/* Loading indicator when no content */}
          {!content && isStreaming && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse delay-75" />
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse delay-150" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
