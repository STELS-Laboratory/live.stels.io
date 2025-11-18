/**
 * Chat Tab Component
 * Individual chat tab with message history
 */

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Bot, FileText, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMobile } from "@/hooks/use_mobile";
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
  const isMobile = useMobile();
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
        <div className={`${isMobile ? "p-1.5" : "p-4"} ${isMobile ? "space-y-1.5" : "space-y-4"}`}>
          {tab.messages.length === 0
            ? (
              <div
                className={`flex flex-col items-center justify-center h-[100%] text-center ${
                  isMobile ? "min-h-[150px] px-1" : "min-h-[400px]"
                }`}
              >
                <Bot
                  className={`text-muted-foreground ${
                    isMobile ? "w-8 h-8 mb-2" : "icon-2xl mb-4"
                  }`}
                />
                <h3
                  className={`font-semibold text-foreground ${
                    isMobile ? "text-xs mb-1" : "text-lg mb-2"
                  }`}
                >
                  Start a conversation
                </h3>
                <p
                  className={`text-muted-foreground ${
                    isMobile ? "text-[10px]" : "text-sm"
                  } ${isMobile ? "max-w-full px-1" : "max-w-md"}`}
                >
                  Select a model and start chatting
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
                      `flex ${isMobile ? "gap-1.5" : "gap-3"}`,
                      message.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="flex-shrink-0">
                        <div
                          className={`rounded-full bg-primary/10 flex items-center justify-center ${
                            isMobile ? "w-5 h-5" : "w-8 h-8"
                          }`}
                        >
                          <Bot
                            className={`text-primary ${
                              isMobile ? "w-3 h-3" : "icon-sm"
                            }`}
                          />
                        </div>
                      </div>
                    )}

                    <div
                      className={cn(
                        `rounded ${isMobile ? "px-2 py-1.5" : "px-4 py-3"} ${
                          isMobile ? "max-w-[88%]" : "max-w-[80%]"
                        }`,
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
                          <div
                            className={`whitespace-pre-wrap break-words ${
                              isMobile ? "text-xs" : "text-sm"
                            }`}
                          >
                            {message.content}
                          </div>
                        )}

                      {message.contextFiles &&
                        message.contextFiles.length > 0 && (
                        <div
                          className={`border-t border-border/50 flex flex-wrap gap-0.5 ${
                            isMobile ? "mt-1.5 pt-1.5" : "mt-3 pt-3"
                          }`}
                        >
                          {message.contextFiles.map((fileName) => (
                            <span
                              key={fileName}
                              className={`flex items-center gap-0.5 text-muted-foreground ${
                                isMobile ? "text-[9px]" : "text-xs"
                              }`}
                            >
                              <FileText className={isMobile ? "w-2.5 h-2.5" : "icon-xs"} />
                              {fileName}
                            </span>
                          ))}
                        </div>
                      )}
                      <div
                        className={`mt-1 opacity-60 ${
                          isMobile ? "text-[9px]" : "text-xs"
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>

                    {message.role === "user" && (
                      <div className="flex-shrink-0">
                        <div
                          className={`rounded-full bg-muted flex items-center justify-center ${
                            isMobile ? "w-5 h-5" : "w-8 h-8"
                          }`}
                        >
                          <User
                            className={`text-foreground ${
                              isMobile ? "w-3 h-3" : "icon-sm"
                            }`}
                          />
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
