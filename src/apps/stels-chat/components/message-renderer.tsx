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
import { useMobile } from "@/hooks/use_mobile";
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
  isMobile = false,
}: {
  json: unknown;
  isDark: boolean;
  isStreaming: boolean;
  isMobile?: boolean;
}): React.ReactElement {
  const jsonString = JSON.stringify(json, null, 2);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`rounded border border-primary/20 bg-primary/5 overflow-hidden ${
        isMobile ? "my-2" : "my-4"
      }`}
    >
      <div
        className={`flex items-center justify-between bg-primary/10 border-b border-primary/20 ${
          isMobile ? "px-2 py-1.5" : "px-4 py-2"
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`font-semibold text-primary uppercase tracking-wide ${
              isMobile ? "text-[10px]" : "text-xs"
            }`}
          >
            JSON Response
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className={isMobile ? "h-6 px-1.5 text-[10px]" : "h-6 px-2 text-xs"}
        >
          {copied ? (
            <>
              <Check className={`${isMobile ? "icon-[10px]" : "icon-xs"} mr-1`} />
              {!isMobile && "Copied"}
            </>
          ) : (
            <>
              <Copy className={`${isMobile ? "icon-[10px]" : "icon-xs"} mr-1`} />
              {!isMobile && "Copy"}
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
            padding: isMobile ? "0.5rem" : "1rem",
            background: "transparent",
            fontSize: isMobile ? "0.75rem" : "0.875rem",
            lineHeight: "1.6",
          }}
          PreTag="div"
        >
          {jsonString}
        </SyntaxHighlighter>
        {isStreaming && (
          <span
            className={`absolute inline-block bg-primary/50 animate-pulse ${
              isMobile ? "bottom-1 right-1 w-1.5 h-3" : "bottom-2 right-2 w-2 h-4"
            }`}
          />
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
  isMobile = false,
}: {
  thinking: string;
  isStreaming: boolean;
  isMobile?: boolean;
}): React.ReactElement {
  const parsedJson = useMemo(() => parseJsonFromText(thinking), [thinking]);

  return (
    <div
      className={`rounded border border-amber-500/20 bg-amber-500/5 ${
        isMobile ? "p-2" : "p-4"
      }`}
    >
      <div className={`flex items-center gap-2 ${isMobile ? "mb-2" : "mb-3"}`}>
        <div className="flex items-center gap-1.5">
          <div
            className={`rounded-full bg-amber-500 animate-pulse ${
              isMobile ? "w-1.5 h-1.5" : "w-2 h-2"
            }`}
          />
          <span
            className={`font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide ${
              isMobile ? "text-[10px]" : "text-xs"
            }`}
          >
            Thinking Process
          </span>
        </div>
      </div>

      {parsedJson ? (
        <div className={isMobile ? "space-y-2" : "space-y-3"}>
          {/* Text before JSON */}
          {parsedJson.remainingText && (
            <div
              className={`text-muted-foreground italic whitespace-pre-wrap break-words font-mono leading-relaxed ${
                isMobile ? "text-xs" : "text-sm"
              }`}
            >
              {parsedJson.remainingText}
            </div>
          )}
          {/* JSON block */}
          <JsonRenderer
            json={parsedJson.json}
            isDark={false}
            isStreaming={isStreaming}
            isMobile={isMobile}
          />
        </div>
      ) : (
        <div
          className={`text-muted-foreground italic whitespace-pre-wrap break-words font-mono leading-relaxed ${
            isMobile ? "text-xs" : "text-sm"
          }`}
        >
          {thinking}
          {isStreaming && (
            <span
              className={`inline-block ml-1 bg-amber-500/50 animate-pulse ${
                isMobile ? "w-1.5 h-3" : "w-2 h-4"
              }`}
            />
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
  isMobile = false,
  ...rest
}: {
  language: string;
  codeString: string;
  isDark: boolean;
  isMobile?: boolean;
  [key: string]: unknown;
}): React.ReactElement {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`rounded border border-border bg-muted/30 overflow-hidden shadow-sm ${
        isMobile ? "my-2" : "my-4"
      }`}
    >
      <div
        className={`flex items-center justify-between bg-muted/50 border-b border-border ${
          isMobile ? "px-2 py-1.5" : "px-4 py-2"
        }`}
      >
        <span
          className={`font-mono text-muted-foreground ${
            isMobile ? "text-[10px]" : "text-xs"
          }`}
        >
          {language}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className={isMobile ? "h-6 px-1.5 text-[10px]" : "h-6 px-2 text-xs"}
        >
          {copied ? (
            <>
              <Check className={`${isMobile ? "icon-[10px]" : "icon-xs"} mr-1`} />
              {!isMobile && "Copied"}
            </>
          ) : (
            <>
              <Copy className={`${isMobile ? "icon-[10px]" : "icon-xs"} mr-1`} />
              {!isMobile && "Copy"}
            </>
          )}
        </Button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={isDark ? oneDark : oneLight}
        customStyle={{
          margin: 0,
          padding: isMobile ? "0.5rem" : "1rem",
          background: "transparent",
          fontSize: isMobile ? "0.75rem" : "0.875rem",
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

function createMarkdownComponents(isDark: boolean, isMobile: boolean) {
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
            isMobile={isMobile}
            {...rest}
          />
        );
      }

      // Inline code
      return (
        <code
          className={`rounded bg-muted text-foreground font-mono border border-border/50 ${
            isMobile ? "px-1 py-0.5 text-xs" : "px-1.5 py-0.5 text-sm"
          }`}
          {...rest}
        >
          {children}
        </code>
      );
    },

    // Headings
    h1: ({ children }: { children?: React.ReactNode }) => (
      <h1
        className={`font-bold text-foreground ${
          isMobile
            ? "text-lg mt-3 mb-2"
            : "text-2xl mt-6 mb-4"
        }`}
      >
        {children}
      </h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2
        className={`font-semibold text-foreground ${
          isMobile
            ? "text-base mt-2.5 mb-1.5"
            : "text-xl mt-5 mb-3"
        }`}
      >
        {children}
      </h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3
        className={`font-semibold text-foreground ${
          isMobile
            ? "text-sm mt-2 mb-1"
            : "text-lg mt-4 mb-2"
        }`}
      >
        {children}
      </h3>
    ),
    h4: ({ children }: { children?: React.ReactNode }) => (
      <h4
        className={`font-semibold text-foreground ${
          isMobile
            ? "text-xs mt-1.5 mb-1"
            : "text-base mt-3 mb-2"
        }`}
      >
        {children}
      </h4>
    ),

    // Paragraphs
    p: ({ children }: { children?: React.ReactNode }) => (
      <p
        className={`leading-relaxed text-foreground ${
          isMobile ? "mb-2 text-xs" : "mb-4"
        }`}
      >
        {children}
      </p>
    ),

    // Lists
    ul: ({ children }: { children?: React.ReactNode }) => (
      <ul
        className={`list-disc list-inside text-foreground ${
          isMobile ? "mb-2 space-y-0.5" : "mb-4 space-y-1"
        }`}
      >
        {children}
      </ul>
    ),
    ol: ({ children }: { children?: React.ReactNode }) => (
      <ol
        className={`list-decimal list-inside text-foreground ${
          isMobile ? "mb-2 space-y-0.5" : "mb-4 space-y-1"
        }`}
      >
        {children}
      </ol>
    ),
    li: ({ children }: { children?: React.ReactNode }) => (
      <li
        className={`leading-relaxed ${isMobile ? "ml-2 mb-0.5 text-xs" : "ml-4 mb-1"}`}
      >
        {children}
      </li>
    ),

    // Tables
    table: ({ children }: { children?: React.ReactNode }) => (
      <div className={isMobile ? "my-2 overflow-x-auto" : "my-4 overflow-x-auto"}>
        <table
          className={`min-w-full border-collapse border border-border rounded ${
            isMobile ? "text-xs" : ""
          }`}
        >
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
      <th
        className={`text-left font-semibold text-foreground border-r border-border last:border-r-0 ${
          isMobile ? "px-2 py-1 text-[10px]" : "px-4 py-2"
        }`}
      >
        {children}
      </th>
    ),
    td: ({ children }: { children?: React.ReactNode }) => (
      <td
        className={`text-foreground border-r border-border last:border-r-0 ${
          isMobile ? "px-2 py-1 text-[10px]" : "px-4 py-2"
        }`}
      >
        {children}
      </td>
    ),

    // Blockquotes
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote
        className={`border-l-4 border-primary/50 italic text-muted-foreground bg-muted/20 rounded-r ${
          isMobile
            ? "pl-2 py-1 my-2 text-xs"
            : "pl-4 py-2 my-4"
        }`}
      >
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
  const isMobile = useMobile();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Parse JSON from content
  const parsedContent = useMemo(() => {
    if (!content) return null;
    return parseJsonFromText(content);
  }, [content]);

  const markdownComponents = useMemo(
    () => createMarkdownComponents(isDark, isMobile),
    [isDark, isMobile],
  );
	
	return (
    <div className={cn(isMobile ? "space-y-2" : "space-y-4", className)}>
      {/* Thinking section */}
      {thinking && thinking.length > 0 && (
        <ThinkingRenderer
          thinking={thinking}
          isStreaming={isStreaming}
          isMobile={isMobile}
        />
      )}

      {/* Content section */}
      {parsedContent ? (
        <div className={isMobile ? "space-y-2" : "space-y-4"}>
          {/* JSON block */}
          <JsonRenderer
            json={parsedContent.json}
            isDark={isDark}
            isStreaming={isStreaming}
            isMobile={isMobile}
          />
          {/* Remaining text after JSON */}
          {parsedContent.remainingText && (
            <div
              className={`prose dark:prose-invert max-w-none ${
                isMobile ? "prose-xs" : "prose-sm"
              }`}
            >
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
        <div
          className={`prose dark:prose-invert max-w-none ${
            isMobile ? "prose-xs" : "prose-sm"
          }`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={markdownComponents}
          >
            {content || (isStreaming && " ")}
          </ReactMarkdown>

          {/* Streaming indicator */}
          {isStreaming && content && (
            <span
              className={`inline-block ml-1 bg-foreground/50 animate-pulse ${
                isMobile ? "w-1.5 h-3" : "w-2 h-4"
              }`}
            />
          )}

          {/* Loading indicator when no content */}
          {!content && isStreaming && (
            <div
              className={`flex items-center gap-2 text-muted-foreground ${
                isMobile ? "gap-1" : "gap-2"
              }`}
            >
              <span
                className={`rounded-full bg-current animate-pulse ${
                  isMobile ? "w-1 h-1" : "w-1.5 h-1.5"
                }`}
              />
              <span
                className={`rounded-full bg-current animate-pulse delay-75 ${
                  isMobile ? "w-1 h-1" : "w-1.5 h-1.5"
                }`}
              />
              <span
                className={`rounded-full bg-current animate-pulse delay-150 ${
                  isMobile ? "w-1 h-1" : "w-1.5 h-1.5"
                }`}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
