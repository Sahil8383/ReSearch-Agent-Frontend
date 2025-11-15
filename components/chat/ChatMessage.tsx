"use client";

import React, { memo } from "react";
import { ChatMessage as ChatMessageType } from "@/lib/store/slices/chatSlice";
import { User, Search, Eye, Brain, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMarkdown, formatObservation } from "@/lib/formatting";

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage = memo(({ message }: ChatMessageProps) => {
  if (message.type === "user") {
    return (
      <div className="flex gap-3 px-4 py-3 justify-end">
        <div className="max-w-[80%] rounded-lg bg-primary text-primary-foreground px-4 py-2.5">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>
      </div>
    );
  }

  if (message.type === "agent") {
    return (
      <div className="flex gap-3 px-4 py-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <svg
              className="h-4 w-4 text-muted-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
        </div>
        <div className="flex-1 max-w-[80%]">
          <div className="rounded-lg bg-muted px-4 py-3">
            <div className="text-sm leading-relaxed">
              {formatMarkdown(message.content)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (message.type === "thought") {
    return (
      <div className="px-4 py-2.5 border-b border-border/40 bg-muted/20">
        <div className="flex items-start gap-2">
          <Brain className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {message.content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (message.type === "action") {
    const isWebSearch = message.actionType === "web_search";
    return (
      <div className="px-4 py-2.5 border-b border-border/40 bg-muted/20">
        <div className="flex items-center gap-2">
          {isWebSearch ? (
            <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          ) : (
            <div className="h-3.5 w-3.5 rounded-full bg-muted-foreground/30 flex-shrink-0" />
          )}
          <p className="text-sm text-muted-foreground">
            {isWebSearch ? "searching web for:" : `${message.actionType}:`}{" "}
            <span className="font-medium text-foreground/80">
              {message.content}
            </span>
          </p>
        </div>
      </div>
    );
  }

  if (message.type === "observation") {
    return (
      <div className="px-4 py-3 border-b border-border/40 bg-muted/20">
        <div className="flex items-start gap-2">
          <Eye className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex-1">{formatObservation(message.content)}</div>
        </div>
      </div>
    );
  }

  if (message.type === "error") {
    return (
      <div className="flex gap-3 px-4 py-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-4 w-4 text-destructive" />
          </div>
        </div>
        <div className="flex-1 max-w-[80%]">
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-2.5">
            <p className="text-sm leading-relaxed text-destructive whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
});

ChatMessage.displayName = "ChatMessage";

export default ChatMessage;
