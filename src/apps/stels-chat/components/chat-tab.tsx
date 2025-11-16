/**
 * Chat Tab Component
 * Individual chat tab with message history
 */

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Bot, FileText, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ChatTab as ChatTabType } from "../types";
import { MessageRenderer } from "./message-renderer";

interface ChatTabProps {
  tab: ChatTabType;
  isActive: boolean;
  onClose: (tabId: string) => void;
  onSelect: (tabId: string) => void;
}

/**
 * Chat Tab Component
 */
export function ChatTab({
  tab,
  isActive,
}: ChatTabProps): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const isStreamingRef = useRef(false);

  // Track last message and its streaming state
  const lastMessage = useMemo(() => {
    return tab.messages[tab.messages.length - 1];
  }, [tab.messages]);

  const isStreaming = lastMessage?.isStreaming ?? false;
  const lastMessageContent = lastMessage?.content ?? "";
  const lastMessageThinking = lastMessage?.thinking ?? "";

  // Update streaming ref
  useEffect(() => {
    isStreamingRef.current = isStreaming;
  }, [isStreaming]);

  // Auto-scroll function
  const scrollToBottom = useCallback(
    (force = false): void => {
      if (!isActive) return;

      // Find the actual scroll viewport element (try both possible selectors)
      const scrollElement = (scrollRef.current?.querySelector(
        "[data-slot='scroll-area-viewport']",
      ) as HTMLElement) ||
        (scrollRef.current?.querySelector(
          "[data-radix-scroll-area-viewport]",
        ) as HTMLElement) ||
        (scrollRef.current?.querySelector(
          ".scroll-area-viewport",
        ) as HTMLElement);

      if (scrollElement) {
        // During streaming, use instant scroll for better UX
        // Otherwise use smooth scroll
        if (isStreamingRef.current || force) {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        } else {
          scrollElement.scrollTo({
            top: scrollElement.scrollHeight,
            behavior: "smooth",
          });
        }
      }
    },
    [isActive],
  );

  // Scroll on message changes
  useEffect(() => {
    if (isActive) {
      // Small delay to ensure DOM is updated
      const timeoutId = setTimeout(() => {
        scrollToBottom();
      }, 10);
      return () => clearTimeout(timeoutId);
    }
  }, [isActive, tab.messages.length, lastMessage?.id, scrollToBottom]);

  // Scroll on content updates during streaming
  useEffect(() => {
    if (isActive && isStreaming) {
      // Use requestAnimationFrame for smooth updates during streaming
      const rafId = requestAnimationFrame(() => {
        scrollToBottom(true);
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [
    isActive,
    isStreaming,
    lastMessageContent,
    lastMessageThinking,
    scrollToBottom,
  ]);

  // Use MutationObserver to track DOM changes during streaming
  useEffect(() => {
    if (!isActive || !isStreaming) return;

    const scrollElement = (scrollRef.current?.querySelector(
      "[data-slot='scroll-area-viewport']",
    ) as HTMLElement) ||
      (scrollRef.current?.querySelector(
        "[data-radix-scroll-area-viewport]",
      ) as HTMLElement);

    if (!scrollElement || !lastMessageRef.current) return;

    // Create observer to watch for content changes
    const observer = new MutationObserver(() => {
      if (isStreamingRef.current) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    });

    // Observe the last message element for changes
    observer.observe(lastMessageRef.current, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [isActive, isStreaming, lastMessage?.id]);

  // Scroll when streaming state changes
  useEffect(() => {
    if (isActive && !isStreaming && isStreamingRef.current) {
      // Just finished streaming - scroll to bottom
      setTimeout(() => scrollToBottom(false), 100);
    }
  }, [isActive, isStreaming, scrollToBottom]);

  return (
    <div
      className={cn(
        "flex flex-col bg-background flex-1 min-h-0",
        isActive ? "flex" : "hidden",
      )}
    >
      <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
        <div className="p-4 space-y-4">
          {tab.messages.length === 0
            ? (
              <div className="flex flex-col items-center justify-center h-[100%] min-h-[400px] text-center">
                <Bot className="icon-2xl text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Start a conversation
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Select a model and start chatting. You can attach files for
                  context.
                </p>
              </div>
            )
            : (
              tab.messages.map((message, index) => {
                const isLastMessage = index === tab.messages.length - 1;
                return (
                  <motion.div
                    key={message.id}
                    ref={isLastMessage ? lastMessageRef : null}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="icon-sm text-primary" />
                        </div>
                      </div>
                    )}

                    <div
                      className={cn(
                        "rounded-lg px-4 py-3 max-w-[80%]",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground",
                      )}
                    >
                      {message.role === "assistant"
                        ? (
                          <MessageRenderer
                            content={message.content}
                            thinking={message.thinking}
                            isStreaming={message.isStreaming}
                          />
                        )
                        : (
                          <div className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </div>
                        )}

                      {message.contextFiles &&
                        message.contextFiles.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap gap-1">
                          {message.contextFiles.map((fileName) => (
                            <span
                              key={fileName}
                              className="text-xs flex items-center gap-1 text-muted-foreground"
                            >
                              <FileText className="icon-xs" />
                              {fileName}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="text-xs mt-2 opacity-70">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>

                    {message.role === "user" && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="icon-sm text-foreground" />
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
        </div>
      </ScrollArea>
    </div>
  );
}
