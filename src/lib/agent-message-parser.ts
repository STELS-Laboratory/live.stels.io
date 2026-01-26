/**
 * Agent Message Parser
 * Parses and structures agent responses for better display
 * Handles: JSON blocks, thinking/reasoning, tool calls, HTML links, LaTeX
 */

export type MessageBlockType = 
  | "text" 
  | "json" 
  | "thinking" 
  | "tool_call" 
  | "tool_result"
  | "code"
  | "table";

export interface MessageBlock {
  type: MessageBlockType;
  content: string;
  metadata?: {
    language?: string;
    toolName?: string;
    toolArgs?: Record<string, unknown>;
    collapsed?: boolean;
  };
}

export interface ParsedMessage {
  blocks: MessageBlock[];
  hasThinking: boolean;
  hasToolCalls: boolean;
  hasJson: boolean;
}

// Patterns for detecting different content types
const PATTERNS = {
  // JSON object or array (standalone on its own lines)
  json: /^(\s*)([[{][\s\S]*?[\]}])(\s*)$/m,
  // Tool call pattern: { "name": "...", "arguments": {...} }
  toolCall: /\{\s*"name"\s*:\s*"([^"]+)"\s*,\s*"arguments"\s*:\s*(\{[\s\S]*?\})\s*\}/g,
  // Thinking/reasoning patterns (common LLM patterns)
  thinking: [
    // Explicit thinking blocks
    /^<thinking>[\s\S]*?<\/thinking>/gm,
    /^<reasoning>[\s\S]*?<\/reasoning>/gm,
    // Implicit reasoning (sentences describing intent)
    /^(?:(?:I|We)(?:'ll| will| need to| should| want to|'m going to)|(?:User wants|Need to|Should|Let me|Let's|Going to))[^.]*\.[^.]*(?:\.|$)/gm,
  ],
  // Code blocks in markdown
  codeBlock: /```(\w+)?\n([\s\S]*?)```/g,
  // HTML anchor tags
  htmlLink: /<a\s+href="([^"]+)"[^>]*>([^<]*)<\/a>/gi,
  // Raw URLs
  rawUrl: /(?<!["(])https?:\/\/[^\s<>)"',]+/g,
  // LaTeX math (block and inline)
  latexBlock: /\\\[([\s\S]*?)\\\]/g,
  latexInline: /\\\(([\s\S]*?)\\\)/g,
  // Result prefix
  resultPrefix: /^(?:Result|Результат):\s*/m,
};

/**
 * Detects if text looks like agent's internal thinking/reasoning
 * These are internal monologue patterns that shouldn't be shown to users
 */
function isThinkingText(text: string): boolean {
  const trimmed = text.trim();
  
  // Skip if it's too long to be thinking (likely actual content)
  if (trimmed.length > 1000) return false;
  
  // Skip if it has markdown formatting (likely actual content for user)
  if (/^#{1,6}\s|^\*{1,2}[^*]|\|[\s-]+\|/.test(trimmed)) return false;
  
  const thinkingIndicators = [
    // English patterns
    /^(?:I|We)(?:'ll| will| need to| should| want to|'m going to) /i,
    /^(?:User wants|Need to|Should|Let me|Let's|Going to|Will)/i,
    /^(?:We have|We need|We can|We should|We'll)/i,
    /^(?:So I|So we|Now I|Now we|First,? I|First,? we)/i,
    
    // Technical planning patterns
    /call\s+(?:multiple\s+)?(?:getTicker|fetchData|fetch|get|create|update|delete|post|put)/i,
    /(?:call|use|invoke|query|fetch)\s+(?:the\s+)?(?:API|tool|function|endpoint)/i,
    /(?:possibly|maybe|perhaps)\s+(?:we|I|sequentially)/i,
    /^Use\s+(?:the\s+)?(?:price|ticker|balance|market)/i,
    /^(?:Use|Call|Try|Check|Get|Fetch)\s+[A-Z]/,
    
    // Data processing patterns
    /(?:then|and)\s+(?:calculate|compute|convert|parse)/i,
    /provide\s+insights|give\s+suggestions/i,
    /for\s+each\s+(?:asset|symbol|pair|item)/i,
    
    // Uncertain/planning language
    /not\s+sure\s+if/i,
    /we\s+can\s+try/i,
    /if\s+not\s+available/i,
    /we\s+can\s+mention/i,
    
    // Common LLM reasoning starters
    /^(?:Hmm|Ok|Okay|Alright|Right),?\s/i,
    /^(?:Based on|Given that|Since|Because)/i,
    /^(?:The user|This request|This task)/i,
    
    // Technical implementation details
    /most\s+(?:are|have)\s+paired\s+with/i,
    /(?:value|price)\s*\*\s*(?:amount|quantity)/i,
    /(?:sequentially|in parallel|one by one)/i,
  ];
  
  // Check if multiple indicators match (more confident it's thinking)
  const matchCount = thinkingIndicators.filter(pattern => pattern.test(trimmed)).length;
  
  // If strong indicator present, or multiple weak indicators
  return matchCount >= 1;
}

/**
 * Detects if a string is valid JSON
 */
function isValidJson(str: string): boolean {
  try {
    const trimmed = str.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return false;
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}

/**
 * Detects if JSON looks like a tool call
 */
function isToolCallJson(str: string): { isToolCall: boolean; name?: string; args?: Record<string, unknown> } {
  try {
    const parsed = JSON.parse(str.trim());
    if (parsed && typeof parsed === "object" && "name" in parsed && "arguments" in parsed) {
      return { 
        isToolCall: true, 
        name: parsed.name, 
        args: parsed.arguments 
      };
    }
  } catch {
    // Not valid JSON
  }
  return { isToolCall: false };
}

/**
 * Converts HTML links to markdown links
 */
export function convertHtmlLinksToMarkdown(text: string): string {
  return text.replace(PATTERNS.htmlLink, (_, href, linkText) => {
    // Clean up the link text
    const cleanText = linkText.trim() || "Read more →";
    return `[${cleanText}](${href})`;
  });
}

/**
 * Converts raw URLs to markdown links
 */
export function convertRawUrlsToMarkdown(text: string): string {
  // Don't convert URLs that are already in markdown link format
  return text.replace(PATTERNS.rawUrl, (url) => {
    // Check if this URL is already part of a markdown link
    const before = text.substring(0, text.indexOf(url));
    if (before.endsWith("](") || before.endsWith("(")) {
      return url;
    }
    // Try to get a meaningful label
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace("www.", "");
      return `[${hostname}](${url})`;
    } catch {
      return `[link](${url})`;
    }
  });
}

/**
 * Converts LaTeX to a more readable format (or keeps for KaTeX rendering)
 */
export function processLatex(text: string): string {
  // Convert block LaTeX to code block for now
  // In future, can use KaTeX for proper rendering
  let result = text;
  
  // Block LaTeX
  result = result.replace(PATTERNS.latexBlock, (_, formula) => {
    return `\n\`\`\`math\n${formula.trim()}\n\`\`\`\n`;
  });
  
  // Inline LaTeX
  result = result.replace(PATTERNS.latexInline, (_, formula) => {
    return `\`${formula.trim()}\``;
  });
  
  return result;
}

/**
 * Extracts JSON from text that contains "Result:" or similar prefixes
 */
function extractResultJson(text: string): { prefix: string; json: string } | null {
  const resultMatch = text.match(/^((?:Result|Результат):?\s*)([[{][\s\S]*[\]}])$/m);
  if (resultMatch && isValidJson(resultMatch[2])) {
    return { prefix: resultMatch[1], json: resultMatch[2] };
  }
  return null;
}

/**
 * Main parser function - parses agent message into structured blocks
 */
export function parseAgentMessage(content: string): ParsedMessage {
  const blocks: MessageBlock[] = [];
  let hasThinking = false;
  let hasToolCalls = false;
  let hasJson = false;
  
  // Pre-process: convert HTML links to markdown
  let processedContent = convertHtmlLinksToMarkdown(content);
  
  // Pre-process: convert LaTeX
  processedContent = processLatex(processedContent);
  
  // First, check if entire content is just JSON
  if (isValidJson(processedContent.trim())) {
    const toolInfo = isToolCallJson(processedContent.trim());
    if (toolInfo.isToolCall) {
      return {
        blocks: [{
          type: "tool_call",
          content: processedContent.trim(),
          metadata: { toolName: toolInfo.name, toolArgs: toolInfo.args },
        }],
        hasThinking: false,
        hasToolCalls: true,
        hasJson: false,
      };
    }
    return {
      blocks: [{ type: "json", content: processedContent.trim() }],
      hasThinking: false,
      hasToolCalls: false,
      hasJson: true,
    };
  }
  
  // Check for "Result:" followed by JSON
  const resultExtraction = extractResultJson(processedContent.trim());
  if (resultExtraction) {
    return {
      blocks: [{ type: "tool_result", content: resultExtraction.json }],
      hasThinking: false,
      hasToolCalls: false,
      hasJson: true,
    };
  }
  
  // Split content into paragraphs for analysis
  // Use double newline as separator but preserve code blocks
  const paragraphs = processedContent.split(/\n{2,}/);
  
  let pendingResultMarker = false;
  
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i].trim();
    if (!paragraph) continue;
    
    // Check if previous block was a result marker waiting for JSON
    if (pendingResultMarker && isValidJson(paragraph)) {
      hasJson = true;
      blocks.push({
        type: "tool_result",
        content: paragraph,
      });
      pendingResultMarker = false;
      continue;
    }
    pendingResultMarker = false;
    
    // Check for "Result:" prefix in this paragraph
    const inlineResult = extractResultJson(paragraph);
    if (inlineResult) {
      hasJson = true;
      blocks.push({
        type: "tool_result",
        content: inlineResult.json,
      });
      continue;
    }
    
    // Check if this is just "Result:" waiting for JSON in next paragraph
    if (/^(?:Result|Результат):?\s*$/i.test(paragraph)) {
      pendingResultMarker = true;
      continue;
    }
    
    // Check if this is thinking/reasoning text
    if (isThinkingText(paragraph)) {
      hasThinking = true;
      blocks.push({
        type: "thinking",
        content: paragraph,
        metadata: { collapsed: true },
      });
      continue;
    }
    
    // Check for standalone JSON
    if (isValidJson(paragraph)) {
      const toolInfo = isToolCallJson(paragraph);
      if (toolInfo.isToolCall) {
        hasToolCalls = true;
        blocks.push({
          type: "tool_call",
          content: paragraph,
          metadata: {
            toolName: toolInfo.name,
            toolArgs: toolInfo.args,
          },
        });
      } else {
        hasJson = true;
        blocks.push({
          type: "json",
          content: paragraph,
        });
      }
      continue;
    }
    
    // Regular text block
    blocks.push({
      type: "text",
      content: paragraph,
    });
  }
  
  return {
    blocks,
    hasThinking,
    hasToolCalls,
    hasJson,
  };
}

/**
 * Formats JSON for display with syntax highlighting
 */
export function formatJsonForDisplay(jsonStr: string): string {
  try {
    const parsed = JSON.parse(jsonStr);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return jsonStr;
  }
}

/**
 * Gets a summary of tool call for collapsed view
 */
export function getToolCallSummary(toolName: string, args?: Record<string, unknown>): string {
  const argsSummary = args 
    ? Object.entries(args)
        .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
        .slice(0, 3)
        .join(", ")
    : "";
  return `${toolName}(${argsSummary}${args && Object.keys(args).length > 3 ? "..." : ""})`;
}

/**
 * Gets a preview of JSON data for collapsed view
 */
export function getJsonPreview(jsonStr: string, maxLength: number = 100): string {
  try {
    const parsed = JSON.parse(jsonStr);
    
    // For arrays, show count
    if (Array.isArray(parsed)) {
      return `Array[${parsed.length}]`;
    }
    
    // For objects, show top-level keys
    if (typeof parsed === "object" && parsed !== null) {
      const keys = Object.keys(parsed);
      const preview = keys.slice(0, 3).join(", ");
      return `{ ${preview}${keys.length > 3 ? ", ..." : ""} }`;
    }
    
    return String(parsed).substring(0, maxLength);
  } catch {
    return jsonStr.substring(0, maxLength);
  }
}

/**
 * Cleans up agent message by removing common artifacts
 */
export function cleanAgentMessage(content: string): string {
  let cleaned = content;
  
  // Remove explicit thinking tags
  cleaned = cleaned.replace(/<thinking>[\s\S]*?<\/thinking>/g, "");
  cleaned = cleaned.replace(/<reasoning>[\s\S]*?<\/reasoning>/g, "");
  
  // Trim excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  
  return cleaned.trim();
}
