/**
 * Message Renderer Component
 * Beautiful markdown renderer for chat messages with syntax highlighting and JSON parsing
 */

import React, { useMemo, useState, useEffect, useRef } from "react";
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
 * Modern JSON parser with balanced bracket matching
 * Supports objects, arrays, nested structures, and streaming JSON
 */
interface ParseResult {
  json: unknown;
  remainingText: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Find balanced JSON boundaries using stack-based bracket matching
 * Supports both objects {} and arrays []
 */
function findJsonBoundaries(
  text: string,
  startIndex: number = 0,
): { start: number; end: number } | null {
  let depth = 0;
  let inString = false;
  let escapeNext = false;
  let start = -1;
  let bracketType: "{" | "[" | null = null;

  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    // Track bracket depth
    if (char === "{" || char === "[") {
      if (start === -1) {
        start = i;
        bracketType = char;
      }
      depth++;
    } else if (char === "}" || char === "]") {
      if (start === -1) continue; // No matching opening bracket

      // Check if closing bracket matches opening type
      if (
        (bracketType === "{" && char === "}") ||
        (bracketType === "[" && char === "]")
      ) {
        depth--;
        if (depth === 0) {
          return { start, end: i + 1 };
        }
      }
    }
  }

  return null;
}

/**
 * Extract and parse JSON from text with modern parsing techniques
 * Supports:
 * - Multiple JSON objects/arrays
 * - Nested structures
 * - Streaming JSON (partial JSON)
 * - JSON5-like flexibility (handles trailing commas, comments in some cases)
 */
function parseJsonFromText(text: string): {
  json: unknown;
  remainingText: string;
} | null {
  if (!text || !text.trim()) return null;

  const trimmedText = text.trim();
  let searchIndex = 0;

  // Try to find JSON object or array
  while (searchIndex < trimmedText.length) {
    // Find next potential JSON start
    const objectStart = trimmedText.indexOf("{", searchIndex);
    const arrayStart = trimmedText.indexOf("[", searchIndex);

    let jsonStart = -1;
    if (objectStart !== -1 && arrayStart !== -1) {
      jsonStart = Math.min(objectStart, arrayStart);
    } else if (objectStart !== -1) {
      jsonStart = objectStart;
    } else if (arrayStart !== -1) {
      jsonStart = arrayStart;
    } else {
      break; // No more JSON candidates
    }

    // Find balanced boundaries
    const boundaries = findJsonBoundaries(trimmedText, jsonStart);
    if (!boundaries) {
      searchIndex = jsonStart + 1;
      continue;
    }

    const jsonCandidate = trimmedText.slice(
      boundaries.start,
      boundaries.end,
    );

    // Try to parse the candidate
    try {
      // Pre-process: remove trailing commas (JSON5-like support)
      let cleaned = jsonCandidate;
      
      // Remove trailing commas before closing brackets/braces
      cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");
      
      // Try standard JSON parse first
      let json: unknown;
      try {
        json = JSON.parse(cleaned);
      } catch {
        // If standard parse fails, try with more lenient parsing
        // Remove comments (single-line and multi-line)
        cleaned = cleaned
          .replace(/\/\/.*$/gm, "") // Single-line comments
          .replace(/\/\*[\s\S]*?\*\//g, ""); // Multi-line comments
        
        json = JSON.parse(cleaned);
      }

      // Extract remaining text
      const beforeJson = trimmedText.slice(0, boundaries.start).trim();
      const afterJson = trimmedText.slice(boundaries.end).trim();
      const remainingText = [beforeJson, afterJson]
        .filter((s) => s.length > 0)
        .join(" ");

      return { json, remainingText };
    } catch {
      // This candidate failed, try next one
      searchIndex = boundaries.end;
      continue;
    }
  }

  // Fallback: try parsing entire text as JSON (for pure JSON responses)
  try {
    const cleaned = trimmedText.replace(/,(\s*[}\]])/g, "$1");
    const json = JSON.parse(cleaned);
    return { json, remainingText: "" };
  } catch {
    // Not valid JSON
  }

  return null;
}

/**
 * Parse multiple JSON objects from text
 * Returns array of parsed JSON objects with their positions
 */
function parseMultipleJsonFromText(
  text: string,
): Array<{ json: unknown; start: number; end: number }> {
  const results: Array<{ json: unknown; start: number; end: number }> = [];
  let searchIndex = 0;

  while (searchIndex < text.length) {
    const objectStart = text.indexOf("{", searchIndex);
    const arrayStart = text.indexOf("[", searchIndex);

    let jsonStart = -1;
    if (objectStart !== -1 && arrayStart !== -1) {
      jsonStart = Math.min(objectStart, arrayStart);
    } else if (objectStart !== -1) {
      jsonStart = objectStart;
    } else if (arrayStart !== -1) {
      jsonStart = arrayStart;
    } else {
      break;
    }

    const boundaries = findJsonBoundaries(text, jsonStart);
    if (!boundaries) {
      searchIndex = jsonStart + 1;
      continue;
    }

    const jsonCandidate = text.slice(boundaries.start, boundaries.end);
    try {
      let cleaned = jsonCandidate.replace(/,(\s*[}\]])/g, "$1");
      const json = JSON.parse(cleaned);
      results.push({
        json,
        start: boundaries.start,
        end: boundaries.end,
      });
      searchIndex = boundaries.end;
    } catch {
      searchIndex = boundaries.end;
    }
  }

  return results;
}

/**
 * Get JSON type label and icon
 */
function getJsonTypeInfo(json: unknown): { label: string; type: string } {
  if (json === null) {
    return { label: "Null", type: "null" };
  }
  if (Array.isArray(json)) {
    return {
      label: `Array (${json.length} items)`,
      type: "array",
    };
  }
  if (typeof json === "object") {
    const keys = Object.keys(json as Record<string, unknown>);
    return {
      label: `Object (${keys.length} keys)`,
      type: "object",
    };
  }
  return {
    label: typeof json === "string"
      ? "String"
      : typeof json === "number"
      ? "Number"
      : typeof json === "boolean"
      ? "Boolean"
      : "Unknown",
    type: typeof json,
  };
}

/**
 * Render JSON object beautifully with syntax highlighting
 * Modern implementation with type detection and better formatting
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
  const jsonString = useMemo(() => {
    try {
      return JSON.stringify(json, null, 2);
    } catch {
      return String(json);
    }
  }, [json]);
  
  const [copied, setCopied] = React.useState(false);
  const typeInfo = useMemo(() => getJsonTypeInfo(json), [json]);

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <div
      className={`rounded overflow-hidden ${
        isDark
          ? "border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10"
          : "border border-amber-600/30 bg-amber-50 dark:bg-amber-500/5"
      } ${isMobile ? "my-2" : "my-4"}`}
    >
      <div
        className={`flex items-center justify-between border-b ${
          isDark
            ? "bg-amber-500/10 border-amber-500/20"
            : "bg-amber-100/50 dark:bg-amber-500/10 border-amber-600/20 dark:border-amber-500/20"
        } ${isMobile ? "px-2 py-1.5" : "px-4 py-2"}`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`font-semibold uppercase tracking-wide ${
              isDark
                ? "text-amber-400"
                : "text-amber-700 dark:text-amber-400"
            } ${isMobile ? "text-[10px]" : "text-xs"}`}
          >
            JSON {typeInfo.label}
          </span>
          <span
            className={`${
              isDark
                ? "text-amber-500/70"
                : "text-amber-600/70 dark:text-amber-500/70"
            } ${isMobile ? "text-[9px]" : "text-[10px]"}`}
          >
            ({typeInfo.type})
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className={`${
            isDark
              ? "hover:bg-amber-500/20 text-amber-300"
              : "hover:bg-amber-200/50 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-300"
          } ${isMobile ? "h-6 px-1.5 text-[10px]" : "h-6 px-2 text-xs"}`}
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
      <div className={`relative ${isDark ? "bg-[#1e1e1e]" : "bg-white dark:bg-[#1e1e1e]"}`}>
        <SyntaxHighlighter
          language="json"
          style={isDark ? oneDark : oneLight}
          customStyle={{
            margin: 0,
            padding: isMobile ? "0.5rem" : "1rem",
            background: isDark ? "#1e1e1e" : "#ffffff",
            fontSize: isMobile ? "0.75rem" : "0.875rem",
            lineHeight: "1.6",
          }}
          PreTag="div"
        >
          {jsonString}
        </SyntaxHighlighter>
        {isStreaming && (
          <span
            className={`absolute inline-block animate-pulse ${
              isDark
                ? "bg-amber-400/50"
                : "bg-amber-600/50 dark:bg-amber-400/50"
            } ${isMobile ? "bottom-1 right-1 w-1.5 h-3" : "bottom-2 right-2 w-2 h-4"}`}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Render thinking with JSON parsing
 * Theme-aware implementation
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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const parsedJson = useMemo(() => parseJsonFromText(thinking), [thinking]);

  return (
    <div
      className={`rounded border ${
        isDark
          ? "border-amber-500/20 bg-amber-500/5"
          : "border-amber-600/30 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/5"
      } ${isMobile ? "p-2" : "p-4"}`}
    >
      <div className={`flex items-center gap-2 ${isMobile ? "mb-2" : "mb-3"}`}>
        <div className="flex items-center gap-1.5">
          <div
            className={`rounded-full animate-pulse ${
              isDark
                ? "bg-amber-400"
                : "bg-amber-600 dark:bg-amber-400"
            } ${isMobile ? "w-1.5 h-1.5" : "w-2 h-2"}`}
          />
          <span
            className={`font-semibold uppercase tracking-wide ${
              isDark
                ? "text-amber-400"
                : "text-amber-700 dark:text-amber-400"
            } ${isMobile ? "text-[10px]" : "text-xs"}`}
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
              className={`italic whitespace-pre-wrap break-words font-mono leading-relaxed ${
                isDark
                  ? "text-amber-300/80"
                  : "text-amber-800/80 dark:text-amber-300/80"
              } ${isMobile ? "text-xs" : "text-sm"}`}
            >
              {parsedJson.remainingText}
            </div>
          )}
          {/* JSON block */}
          <JsonRenderer
            json={parsedJson.json}
            isDark={isDark}
            isStreaming={isStreaming}
            isMobile={isMobile}
          />
        </div>
      ) : (
        <div
          className={`italic whitespace-pre-wrap break-words font-mono leading-relaxed ${
            isDark
              ? "text-amber-300/80"
              : "text-amber-800/80 dark:text-amber-300/80"
          } ${isMobile ? "text-xs" : "text-sm"}`}
        >
          {thinking}
          {isStreaming && (
            <span
              className={`inline-block ml-1 animate-pulse ${
                isDark
                  ? "bg-amber-400/50"
                  : "bg-amber-600/50 dark:bg-amber-400/50"
              } ${isMobile ? "w-1.5 h-3" : "w-2 h-4"}`}
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
      className={`rounded border overflow-hidden ${
        isDark
          ? "border-border bg-muted/30"
          : "border-border/50 bg-muted/20 dark:bg-muted/30"
      } ${isMobile ? "my-2" : "my-4"}`}
    >
      <div
        className={`flex items-center justify-between border-b ${
          isDark
            ? "bg-muted/50 border-border"
            : "bg-muted/30 dark:bg-muted/50 border-border/50 dark:border-border"
        } ${isMobile ? "px-2 py-1.5" : "px-4 py-2"}`}
      >
        <span
          className={`font-mono ${
            isDark
              ? "text-muted-foreground"
              : "text-foreground/70 dark:text-muted-foreground"
          } ${isMobile ? "text-[10px]" : "text-xs"}`}
        >
          {language}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className={`${
            isDark
              ? "hover:bg-muted text-foreground"
              : "hover:bg-muted/50 dark:hover:bg-muted text-foreground/70 dark:text-foreground"
          } ${isMobile ? "h-6 px-1.5 text-[10px]" : "h-6 px-2 text-xs"}`}
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
      <div className={isDark ? "bg-[#1e1e1e]" : "bg-white dark:bg-[#1e1e1e]"}>
        <SyntaxHighlighter
          language={language}
          style={isDark ? oneDark : oneLight}
          customStyle={{
            margin: 0,
            padding: isMobile ? "0.5rem" : "1rem",
            background: isDark ? "#1e1e1e" : "#ffffff",
            fontSize: isMobile ? "0.75rem" : "0.875rem",
            lineHeight: "1.6",
          }}
          PreTag="div"
          {...rest}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
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

      // Inline code - theme-aware
      return (
        <code
          className={`rounded font-mono border ${
            isDark
              ? "bg-muted/50 text-foreground border-border/50"
              : "bg-muted/30 dark:bg-muted/50 text-foreground dark:text-foreground border-border/30 dark:border-border/50"
          } ${isMobile ? "px-1 py-0.5 text-xs" : "px-1.5 py-0.5 text-sm"}`}
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

    // Tables - theme-aware
    table: ({ children }: { children?: React.ReactNode }) => (
      <div className={isMobile ? "my-2 overflow-x-auto" : "my-4 overflow-x-auto"}>
        <table
          className={`min-w-full border-collapse border rounded ${
            isDark
              ? "border-border"
              : "border-border/50 dark:border-border"
          } ${isMobile ? "text-xs" : ""}`}
        >
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: { children?: React.ReactNode }) => (
      <thead
        className={
          isDark
            ? "bg-muted/50"
            : "bg-muted/30 dark:bg-muted/50"
        }
      >
        {children}
      </thead>
    ),
    tbody: ({ children }: { children?: React.ReactNode }) => (
      <tbody>{children}</tbody>
    ),
    tr: ({ children }: { children?: React.ReactNode }) => (
      <tr
        className={`border-b transition-colors ${
          isDark
            ? "border-border hover:bg-muted/30"
            : "border-border/50 dark:border-border hover:bg-muted/20 dark:hover:bg-muted/30"
        }`}
      >
        {children}
      </tr>
    ),
    th: ({ children }: { children?: React.ReactNode }) => (
      <th
        className={`text-left font-semibold border-r last:border-r-0 ${
          isDark
            ? "text-foreground border-border"
            : "text-foreground dark:text-foreground border-border/50 dark:border-border"
        } ${isMobile ? "px-2 py-1 text-[10px]" : "px-4 py-2"}`}
      >
        {children}
      </th>
    ),
    td: ({ children }: { children?: React.ReactNode }) => (
      <td
        className={`border-r last:border-r-0 ${
          isDark
            ? "text-foreground border-border"
            : "text-foreground dark:text-foreground border-border/50 dark:border-border"
        } ${isMobile ? "px-2 py-1 text-[10px]" : "px-4 py-2"}`}
      >
        {children}
      </td>
    ),

    // Blockquotes - theme-aware with amber accent
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote
        className={`border-l-4 italic rounded-r ${
          isDark
            ? "border-amber-500/50 text-amber-200/80 bg-amber-500/5"
            : "border-amber-600/50 dark:border-amber-500/50 text-amber-800/80 dark:text-amber-200/80 bg-amber-50/50 dark:bg-amber-500/5"
        } ${isMobile
          ? "pl-2 py-1 my-2 text-xs"
          : "pl-4 py-2 my-4"}`}
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
 * Memoized to prevent unnecessary re-renders during streaming
 */
export const MessageRenderer = React.memo(function MessageRenderer({
  content,
  thinking,
  isStreaming = false,
  className,
}: MessageRendererProps): React.ReactElement {
  const isMobile = useMobile();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Parse JSON from content - throttle updates during streaming
  // During streaming, be more lenient with incomplete JSON
  const parsedContent = useMemo(() => {
    if (!content) return null;
    
    // Try standard parsing first
    const result = parseJsonFromText(content);
    if (result) return result;
    
    // During streaming, try to find incomplete JSON and wait for completion
    if (isStreaming) {
      // Check if we have a potential incomplete JSON (starts with { or [)
      const trimmed = content.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        // Count brackets to see if JSON might be incomplete
        let depth = 0;
        let inString = false;
        let escapeNext = false;
        
        for (let i = 0; i < trimmed.length; i++) {
          const char = trimmed[i];
          
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          
          if (char === "\\") {
            escapeNext = true;
            continue;
          }
          
          if (char === '"' && !escapeNext) {
            inString = !inString;
            continue;
          }
          
          if (inString) continue;
          
          if (char === "{" || char === "[") {
            depth++;
          } else if (char === "}" || char === "]") {
            depth--;
          }
        }
        
        // If depth > 0, JSON is incomplete - don't try to parse yet
        if (depth > 0) {
          return null;
        }
      }
    }
    
    return null;
  }, [content, isStreaming]);

  const markdownComponents = useMemo(
    () => createMarkdownComponents(isDark, isMobile),
    [isDark, isMobile],
  );

  // Throttle markdown rendering during streaming to prevent UI blocking
  const [throttledContent, setThrottledContent] = useState(content);
  const contentUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isStreaming) {
      // During streaming, update content with throttling
      if (contentUpdateTimeoutRef.current) {
        clearTimeout(contentUpdateTimeoutRef.current);
      }
      contentUpdateTimeoutRef.current = setTimeout(() => {
        setThrottledContent(content);
        contentUpdateTimeoutRef.current = null;
      }, 100); // Update every 100ms during streaming
    } else {
      // When streaming stops, update immediately
      setThrottledContent(content);
      if (contentUpdateTimeoutRef.current) {
        clearTimeout(contentUpdateTimeoutRef.current);
        contentUpdateTimeoutRef.current = null;
      }
    }

    return () => {
      if (contentUpdateTimeoutRef.current) {
        clearTimeout(contentUpdateTimeoutRef.current);
      }
    };
  }, [content, isStreaming]);

  // Use throttled content for rendering during streaming
  const renderContent = isStreaming ? throttledContent : content;
	
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
            {renderContent || (isStreaming && " ")}
          </ReactMarkdown>

          {/* Streaming indicator */}
          {isStreaming && renderContent && (
            <span
              className={`inline-block ml-1 bg-foreground/50 animate-pulse ${
                isMobile ? "w-1.5 h-3" : "w-2 h-4"
              }`}
            />
          )}

          {/* Loading indicator when no content */}
          {!renderContent && isStreaming && (
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
}, (prevProps, nextProps) => {
  // Custom comparison for memo - only re-render if content actually changed significantly
  // or streaming state changed
  if (prevProps.isStreaming !== nextProps.isStreaming) {
    return false; // Re-render if streaming state changed
  }
  
  // During streaming, only re-render if content changed by more than 50 characters
  // This prevents excessive re-renders on every small chunk
  if (nextProps.isStreaming) {
    const prevLength = prevProps.content?.length || 0;
    const nextLength = nextProps.content?.length || 0;
    const diff = Math.abs(nextLength - prevLength);
    
    // Re-render if content changed significantly (50+ chars) or if it's the first update
    if (diff < 50 && prevLength > 0) {
      return true; // Skip re-render for small updates during streaming
    }
  }
  
  // Normal comparison for non-streaming
  return (
    prevProps.content === nextProps.content &&
    prevProps.thinking === nextProps.thinking &&
    prevProps.className === nextProps.className
  );
});
