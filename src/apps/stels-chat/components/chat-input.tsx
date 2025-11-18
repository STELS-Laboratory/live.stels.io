/**
 * Chat Input Component
 * Input field for sending messages
 */

import React, { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { AlertCircle, Paperclip, Send, X } from "lucide-react";
import { useMobile } from "@/hooks/use_mobile";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useStelsChatStore } from "../store";

interface ChatInputProps {
  tabId: string;
  disabled?: boolean;
}

/**
 * Chat Input Component
 */
export function ChatInput({
  tabId,
  disabled = false,
}: ChatInputProps): React.ReactElement {
  const isMobile = useMobile();
  const [message, setMessage] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    sendMessage,
    attachFileToTab,
    detachFileFromTab,
    uploadFile,
    trainingFiles,
    tabs,
  } = useStelsChatStore();

  const tab = tabs.find((t) => t.id === tabId);
  const attachedFiles = tab
    ? trainingFiles.filter((f) => tab.contextFiles.includes(f.name))
    : [];
  const hasModel = tab?.model && tab.model.trim() !== "";
  const { models } = useStelsChatStore();

  const handleSend = async (): Promise<void> => {
    if (!message.trim() || disabled) return;

    // Check if model is selected
    if (!hasModel) {
      console.error("[ChatInput] Cannot send message: no model selected");
      return;
    }

    const messageToSend = message.trim();
    setMessage("");

    try {
      await sendMessage(tabId, messageToSend);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const trainingFile = await uploadFile(file, "context");
      attachFileToTab(tabId, trainingFile.id);
    } catch (error) {
      console.error("Failed to upload file:", error);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (fileName: string): void => {
    const file = trainingFiles.find((f) => f.name === fileName);
    if (file) {
      detachFileFromTab(tabId, file.id);
    }
  };

  return (
    <div
      className={`border-t border-border bg-card ${isMobile ? "p-1.5" : "p-4"}`}
    >
      {/* Model selection warning */}
      {!hasModel && models.length > 0 && (
        <Alert
          variant="default"
          className={`mb-2 ${isMobile ? "py-1.5 text-xs" : ""}`}
        >
          <AlertCircle
            className={isMobile ? "w-3 h-3" : "icon-sm"}
          />
          <AlertDescription className={isMobile ? "text-[10px]" : "text-xs"}>
            Please select a model in settings to start chatting
          </AlertDescription>
        </Alert>
      )}

      {!hasModel && models.length === 0 && (
        <Alert
          variant="default"
          className={`mb-2 ${isMobile ? "py-1.5 text-xs" : ""}`}
        >
          <AlertCircle
            className={isMobile ? "w-3 h-3" : "icon-sm"}
          />
          <AlertDescription className={isMobile ? "text-[10px]" : "text-xs"}>
            No models available. Please connect to the network and load models.
          </AlertDescription>
        </Alert>
      )}

      {/* Attached files */}
      {attachedFiles.length > 0 && (
        <div className={`${isMobile ? "mb-1" : "mb-2"} flex flex-wrap gap-1`}>
          {attachedFiles.map((file) => (
            <Badge
              key={file.id}
              variant="secondary"
              className={`flex items-center gap-0.5 ${
                isMobile ? "text-[9px] px-1 py-0.5" : ""
              }`}
            >
              <span className={isMobile ? "text-[9px]" : "text-xs"}>
                {file.name}
              </span>
              <button
                onClick={() => handleRemoveFile(file.name)}
                className={`hover:bg-destructive/20 rounded ${
                  isMobile ? "p-0.5" : "ml-1 p-0.5"
                }`}
              >
                <X className={isMobile ? "w-2.5 h-2.5" : "icon-xs"} />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className={`flex ${isMobile ? "gap-1" : "gap-2"} items-end`}>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept=".txt,.md,.json,.pdf"
        />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="Attach file"
          className={isMobile ? "h-7 w-7" : ""}
        >
          <Paperclip className={isMobile ? "w-3.5 h-3.5" : "icon-md"} />
        </Button>

        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder={isMobile
              ? "Message..."
              : "Type your message... (Enter to send, Shift+Enter for new line)"}
            disabled={disabled}
            className={`resize-none ${
              isMobile
                ? "min-h-[36px] max-h-[100px] pr-9 text-xs"
                : "min-h-[60px] max-h-[200px] pr-12"
            }`}
            rows={1}
          />
        </div>

        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled || !hasModel}
          size="icon"
          className={isMobile ? "h-7 w-14" : ""}
          title={!hasModel ? "Select a model first" : "Send message"}
        >
          <Send className={isMobile ? "w-3.5 h-3.5" : "icon-md"} />
        </Button>
      </div>
    </div>
  );
}
