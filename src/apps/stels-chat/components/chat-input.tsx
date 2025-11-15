/**
 * Chat Input Component
 * Input field for sending messages
 */

import React, { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Paperclip, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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

  const handleSend = async (): Promise<void> => {
    if (!message.trim() || disabled) return;

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
    <div className="border-t border-border bg-card p-4">
      {/* Attached files */}
      {attachedFiles.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachedFiles.map((file) => (
            <Badge
              key={file.id}
              variant="secondary"
              className="flex items-center gap-1"
            >
              <span className="text-xs">{file.name}</span>
              <button
                onClick={() => handleRemoveFile(file.name)}
                className="ml-1 hover:bg-destructive/20 rounded p-0.5"
              >
                <X className="icon-xs" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex gap-2 items-end">
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
        >
          <Paperclip className="icon-md" />
        </Button>

        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
            disabled={disabled}
            className="min-h-[60px] max-h-[200px] resize-none pr-12"
            rows={1}
          />
        </div>

        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          size="icon"
        >
          <Send className="icon-md" />
        </Button>
      </div>
    </div>
  );
}
