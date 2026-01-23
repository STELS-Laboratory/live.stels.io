/**
 * Agent Chat Panel Component
 * Interactive chat interface for communicating with agents
 */

import { useCallback, useEffect, useRef, useState, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import {
  Bot,
  Send,
  Trash2,
  Settings,
  Loader2,
  User,
  AlertCircle,
  Clock,
  Zap,
  Copy,
  Check,
  MoreVertical,
  Radio,
  Folder,
  Rocket,
  CloudOff,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Brain,
  Wrench,
  FileJson,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAccountsStore } from "@/stores/modules/accounts.store";
import { getExchangeIconPath } from "@/apps/accounts/types";
import type { Agent, ChatMessage } from "../types";
import {
  parseAgentMessage,
  formatJsonForDisplay,
  getToolCallSummary,
  getJsonPreview,
  convertHtmlLinksToMarkdown,
  processLatex,
  type MessageBlock,
} from "@/lib/agent-message-parser";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AgentChatPanelProps {
  agent: Agent | null;
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  onSendMessage: (message: string, stream?: boolean) => void;
  onClearConversation: () => void;
  onEditAgent: () => void;
  onDeleteAgent: () => void;
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

/** Markdown content renderer with custom styling */
const MarkdownContent = memo(function MarkdownContent({ content }: { content: string }) {
  // Pre-process content: convert HTML links and process LaTeX
  const processedContent = processLatex(convertHtmlLinksToMarkdown(content));
  
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        // Headings
        h1: ({ children }) => (
          <h1 className="text-lg font-bold mt-3 mb-2 first:mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-bold mt-3 mb-2 first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-bold mt-2 mb-1 first:mt-0">{children}</h3>
        ),
        // Paragraphs
        p: ({ children }) => (
          <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
        ),
        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-outside ml-4 mb-2 space-y-0.5">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-outside ml-4 mb-2 space-y-0.5">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="leading-relaxed">{children}</li>
        ),
        // Inline code
        code: ({ className, children, ...props }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <code
                className="block bg-background/50 rounded-md p-3 my-2 text-xs font-mono overflow-x-auto"
                {...props}
              >
                {children}
              </code>
            );
          }
          return (
            <code
              className="bg-background/50 px-1.5 py-0.5 rounded text-xs font-mono"
              {...props}
            >
              {children}
            </code>
          );
        },
        // Code blocks
        pre: ({ children }) => (
          <pre className="bg-background/50 rounded-md overflow-x-auto my-2">
            {children}
          </pre>
        ),
        // Bold
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        // Italic
        em: ({ children }) => (
          <em className="italic">{children}</em>
        ),
        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:text-primary/80 inline-flex items-center gap-1"
          >
            {children}
            <ExternalLink className="w-3 h-3 inline-block" />
          </a>
        ),
        // Blockquote
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-primary/50 pl-3 my-2 italic text-muted-foreground">
            {children}
          </blockquote>
        ),
        // Horizontal rule
        hr: () => <hr className="my-3 border-border" />,
        // Tables
        table: ({ children }) => (
          <div className="overflow-x-auto my-2">
            <table className="min-w-full text-xs border-collapse">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-muted/50">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="border border-border px-2 py-1 text-left font-semibold">{children}</th>
        ),
        td: ({ children }) => (
          <td className="border border-border px-2 py-1">{children}</td>
        ),
      }}
    >
      {processedContent}
    </ReactMarkdown>
  );
});

/** Collapsible JSON block with syntax highlighting */
const JsonBlock = memo(function JsonBlock({ 
  content, 
  label = "JSON Data",
  defaultCollapsed = false,
}: { 
  content: string; 
  label?: string;
  defaultCollapsed?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);
  const [copied, setCopied] = useState(false);
  
  const formatted = formatJsonForDisplay(content);
  const preview = getJsonPreview(content);
  
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [formatted]);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="my-2">
      <div className="bg-background/60 border border-border rounded-lg overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted/50 transition-colors">
            {isOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            <FileJson className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-medium text-foreground">{label}</span>
            {!isOpen && (
              <span className="text-muted-foreground ml-2 truncate">{preview}</span>
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="relative border-t border-border">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 w-6 h-6 z-10"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
            <pre className="p-3 text-xs font-mono overflow-x-auto max-h-[300px] overflow-y-auto">
              <code className="text-foreground">{formatted}</code>
            </pre>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
});

/** Collapsible thinking/reasoning block (hidden by default) */
const ThinkingBlock = memo(function ThinkingBlock({ content }: { content: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="my-2">
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-amber-500/10 transition-colors">
            {isOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-amber-600" />
            )}
            <Brain className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-medium text-amber-700 dark:text-amber-500">Хід думок агента</span>
            {!isOpen && (
              <span className="text-amber-600/60 ml-2 truncate text-[10px]">
                (натисніть, щоб розгорнути)
              </span>
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-amber-500/20 px-3 py-2">
            <p className="text-xs text-amber-700/80 dark:text-amber-400/80 whitespace-pre-wrap leading-relaxed">
              {content}
            </p>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
});

/** Tool call block showing function name and arguments */
const ToolCallBlock = memo(function ToolCallBlock({ 
  content,
  toolName,
  toolArgs,
}: { 
  content: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const summary = toolName 
    ? getToolCallSummary(toolName, toolArgs)
    : "Tool Call";
  
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="my-2">
      <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-purple-500/10 transition-colors">
            {isOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-purple-600" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-purple-600" />
            )}
            <Wrench className="w-3.5 h-3.5 text-purple-600" />
            <span className="font-medium text-purple-700 dark:text-purple-400">
              Виклик функції
            </span>
            <code className="text-purple-600 dark:text-purple-400 font-mono text-[10px] truncate">
              {summary}
            </code>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="relative border-t border-purple-500/20">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 w-6 h-6 z-10"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
            <pre className="p-3 text-xs font-mono overflow-x-auto max-h-[200px] overflow-y-auto">
              <code className="text-purple-800 dark:text-purple-300">
                {formatJsonForDisplay(content)}
              </code>
            </pre>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
});

/** Renders parsed message blocks with appropriate components */
const ParsedMessageContent = memo(function ParsedMessageContent({ 
  content 
}: { 
  content: string 
}) {
  const parsed = parseAgentMessage(content);
  
  // If no special blocks found, render as regular markdown
  if (!parsed.hasThinking && !parsed.hasToolCalls && !parsed.hasJson) {
    return <MarkdownContent content={content} />;
  }
  
  return (
    <div className="space-y-1">
      {parsed.blocks.map((block, index) => {
        switch (block.type) {
          case "thinking":
            return <ThinkingBlock key={index} content={block.content} />;
          
          case "tool_call":
            return (
              <ToolCallBlock
                key={index}
                content={block.content}
                toolName={block.metadata?.toolName}
                toolArgs={block.metadata?.toolArgs}
              />
            );
          
          case "json":
            return (
              <JsonBlock
                key={index}
                content={block.content}
                label="Дані"
                defaultCollapsed={false}
              />
            );
          
          case "tool_result":
            return (
              <JsonBlock
                key={index}
                content={block.content}
                label="Результат"
                defaultCollapsed={false}
              />
            );
          
          case "text":
          default:
            // Skip empty text blocks
            if (!block.content.trim()) return null;
            return <MarkdownContent key={index} content={block.content} />;
        }
      })}
    </div>
  );
});

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  const isUser = message.role === "user";
  const isError = message.role === "system" && message.content.startsWith("Error:");
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={cn(
        "flex gap-3 group",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          isUser
            ? "bg-primary text-primary-foreground"
            : isError
            ? "bg-destructive/10 text-destructive"
            : "bg-muted"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : isError ? (
          <AlertCircle className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          "flex flex-col max-w-[80%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5",
            isUser
              ? "bg-primary/10 text-primary-foreground rounded-br-md"
              : isError
              ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-bl-md"
              : "bg-muted rounded-bl-md"
          )}
        >
          {isAssistant && !isStreaming ? (
            <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
              <ParsedMessageContent content={message.content} />
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
            </p>
          )}
        </div>

        {/* Message Meta */}
        <div
          className={cn(
            "flex items-center gap-2 mt-1 px-1",
            isUser ? "flex-row-reverse" : "flex-row"
          )}
        >
          <span className="text-[10px] text-muted-foreground">
            {formatTimestamp(message.timestamp)}
          </span>

          {message.metadata?.latencyMs && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {message.metadata.latencyMs}ms
            </span>
          )}

          {message.metadata?.tokensUsed && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5" />
              {message.metadata.tokensUsed}
            </span>
          )}

          {message.metadata?.inferenceMethod && (
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded font-medium",
              message.metadata.inferenceMethod === "agent_route" 
                ? "bg-primary/10 text-primary" 
                : message.metadata.inferenceMethod === "direct" 
                ? "bg-secondary text-secondary-foreground"
                : "bg-destructive/10 text-destructive"
            )}>
              {message.metadata.inferenceMethod === "agent_route" ? "Agent" : 
               message.metadata.inferenceMethod === "direct" ? "Direct" : "Fallback"}
            </span>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="w-3 h-3 text-primary" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AgentChatPanel({
  agent,
  messages,
  loading,
  error,
  onSendMessage,
  onClearConversation,
  onEditAgent,
  onDeleteAgent,
}: AgentChatPanelProps) {
  const accounts = useAccountsStore((s) => s.accounts);
  const [input, setInput] = useState("");
  const [streamEnabled, setStreamEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Smooth scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
    }
  }, []);

  // Auto-scroll on new messages or loading state changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  // Also scroll when last message content changes (streaming)
  const lastMessage = messages[messages.length - 1];
  useEffect(() => {
    if (lastMessage?.role === "assistant") {
      scrollToBottom("auto");
    }
  }, [lastMessage?.content, scrollToBottom]);

  // Focus textarea when agent changes
  useEffect(() => {
    if (agent && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [agent?.id]);

  const handleSend = useCallback(() => {
    if (!input.trim() || loading) return;
    onSendMessage(input.trim(), streamEnabled);
    setInput("");
  }, [input, loading, onSendMessage, streamEnabled]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Empty state
  if (!agent) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background p-8">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Bot className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Select an Agent
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Choose an agent from the list to start a conversation, or create a new
          agent to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{agent.name}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px]">
                {agent.domain}
              </Badge>
              <Badge
                variant={agent.status === "active" ? "default" : "secondary"}
                className="text-[10px]"
              >
                {agent.status}
              </Badge>
              {agent.workspaceContext ? (
                <Badge 
                  variant="outline" 
                  className="text-[10px] flex items-center gap-1"
                  title={`Workspace: ${agent.workspaceContext.workspaceName}${agent.workspaceContext.workspaceDescription ? ` - ${agent.workspaceContext.workspaceDescription}` : ""}`}
                >
                  <Folder className="w-3 h-3" />
                  {agent.workspaceContext.workspaceName}
                </Badge>
              ) : (
                <Badge 
                  variant="outline" 
                  className="text-[10px] flex items-center gap-1 border-amber-500/50 text-amber-600 dark:text-amber-500"
                  title="No workspace context - agent not linked to workspace"
                >
                  <Folder className="w-3 h-3" />
                  Unlinked
                </Badge>
              )}
              {/* Deployment Status Badge */}
              {agent.deploymentStatus && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px] flex items-center gap-1",
                        agent.deploymentStatus.isDeployed && "border-green-500/50 text-green-600 dark:text-green-500",
                        agent.deploymentStatus.isDeploying && "border-blue-500/50 text-blue-600 dark:text-blue-500",
                        agent.deploymentStatus.isFailed && "border-red-500/50 text-red-600 dark:text-red-500",
                        !agent.deploymentStatus.isDeployed && !agent.deploymentStatus.isDeploying && !agent.deploymentStatus.isFailed && "border-gray-500/50"
                      )}
                    >
                      {agent.deploymentStatus.isDeployed ? (
                        <Rocket className="w-3 h-3" />
                      ) : agent.deploymentStatus.isDeploying ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <CloudOff className="w-3 h-3" />
                      )}
                      {agent.deploymentStatus.isDeployed 
                        ? "Deployed" 
                        : agent.deploymentStatus.isDeploying 
                        ? "Deploying" 
                        : agent.deploymentStatus.isFailed 
                        ? "Failed" 
                        : "Not Deployed"}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{agent.deploymentStatus.statusMessage}</p>
                    {agent.deploymentStatus.deploymentUrl && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {agent.deploymentStatus.deploymentUrl}
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              )}
              {(() => {
                const ids =
                  agent.connectedAccounts?.map((c) => c.accountId) ??
                  agent.connectedAccountIds ??
                  [];
                if (ids.length === 0) return null;
                return (
                  <span className="flex items-center gap-1" title="Connected accounts">
                    {ids.slice(0, 4).map((id) => {
                      const acc = accounts.find(
                        (a) => a.account.nid === id || a.id === id,
                      );
                      const ex = acc?.account.exchange ?? "gate";
                      return (
                        <img
                          key={id}
                          src={getExchangeIconPath(ex)}
                          alt=""
                          className="h-4 w-4 rounded object-contain"
                          title={acc?.account.nid ?? id}
                        />
                      );
                    })}
                    {ids.length > 4 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{ids.length - 4}
                      </span>
                    )}
                  </span>
                );
              })()}
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEditAgent}>
              <Settings className="w-4 h-4 mr-2" />
              Edit Agent
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onClearConversation}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Conversation
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDeleteAgent}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Agent
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Deployment Warning Banner */}
      {agent.deploymentStatus && !agent.deploymentStatus.isDeployed && (
        <Alert 
          className={cn(
            "mx-4 mt-2 border flex-shrink-0",
            agent.deploymentStatus.isDeploying 
              ? "border-blue-500/50 bg-blue-50 dark:bg-blue-900/20" 
              : agent.deploymentStatus.isFailed
              ? "border-red-500/50 bg-red-50 dark:bg-red-900/20"
              : "border-amber-500/50 bg-amber-50 dark:bg-amber-900/20"
          )}
        >
          {agent.deploymentStatus.isDeploying ? (
            <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
          ) : agent.deploymentStatus.isFailed ? (
            <AlertCircle className="w-4 h-4 text-red-600" />
          ) : (
            <CloudOff className="w-4 h-4 text-amber-600" />
          )}
          <AlertDescription className={cn(
            "text-sm",
            agent.deploymentStatus.isDeploying && "text-blue-800 dark:text-blue-200",
            agent.deploymentStatus.isFailed && "text-red-800 dark:text-red-200",
            !agent.deploymentStatus.isDeploying && !agent.deploymentStatus.isFailed && "text-amber-800 dark:text-amber-200"
          )}>
            {agent.deploymentStatus.isDeploying ? (
              <>Agent is currently deploying. Chat may use fallback AI until deployment completes.</>
            ) : agent.deploymentStatus.isFailed ? (
              <>Deployment failed. Chat will use fallback AI. Check DigitalOcean Gradient AI for details.</>
            ) : (
              <>Agent is not deployed. Chat will use fallback AI which may have limited capabilities.</>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollContainerRef}>
          <div className="p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[200px] py-12">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                  <Bot className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Start a conversation
                </p>
                <p className="text-xs text-muted-foreground text-center max-w-xs line-clamp-3">
                  {agent.systemPrompt || agent.description || "Chat with this agent"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => {
                  // Check if this is the last assistant message and we're still loading (streaming)
                  const isLastMessage = index === messages.length - 1;
                  const isStreamingMessage = loading && isLastMessage && message.role === "assistant";
                  
                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isStreaming={isStreamingMessage}
                    />
                  );
                })}

                {/* Typing indicator when loading and no streaming content */}
                {loading && messages[messages.length - 1]?.role !== "assistant" && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" />
                        <div
                          className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <div
                          className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Streaming indicator when agent is responding */}
                {loading && messages[messages.length - 1]?.role === "assistant" && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground ml-11">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Agent is typing...</span>
                  </div>
                )}
              </div>
            )}
            {/* Scroll anchor */}
            <div ref={messagesEndRef} className="h-1" />
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border flex-shrink-0">
        {error && (
          <div className="flex items-center gap-2 text-destructive text-xs mb-2 px-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            placeholder={`Message ${agent.name}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading || agent.status !== "active"}
            className="min-h-[44px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button
            variant={streamEnabled ? "default" : "outline"}
            size="icon"
            onClick={() => setStreamEnabled(!streamEnabled)}
            className="h-auto w-10 flex-shrink-0"
            title={streamEnabled ? "Streaming enabled" : "Streaming disabled"}
          >
            <Radio className={cn("w-4 h-4", streamEnabled && "text-green-400")} />
          </Button>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading || agent.status !== "active"}
            className="h-auto px-4"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        <div className="flex items-center justify-between mt-2 px-1">
          {agent.status !== "active" ? (
            <p className="text-xs text-muted-foreground">
              Agent must be active to chat. Current status: {agent.status}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {streamEnabled ? "Streaming mode" : "Standard mode"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
