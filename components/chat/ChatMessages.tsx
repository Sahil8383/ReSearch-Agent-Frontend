"use client";

import React, { useEffect, useRef, memo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppSelector } from "@/lib/store/hooks";
import ChatMessage from "./ChatMessage";
import AgentFlow from "./AgentFlow";
import { Shimmer } from "@/components/ui/shimmer";

const ChatMessages = memo(() => {
  const messages = useAppSelector((state) => state.chat.messages);
  const currentAnswer = useAppSelector((state) => state.chat.currentAnswer);
  const isStreaming = useAppSelector((state) => state.chat.isStreaming);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentAnswer, isStreaming]);

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {/* Agent Flow - shows current thought/action */}
        <AgentFlow />

        {/* Streaming Answer */}
        {currentAnswer && (
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
              <div className="rounded-lg bg-muted px-4 py-2.5">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {currentAnswer}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Shimmer when streaming but no content yet */}
        {isStreaming && !currentAnswer && (
          <div className="flex gap-3 px-4 py-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Shimmer width="w-4" height="h-4" className="rounded-full" />
              </div>
            </div>
            <div className="flex-1 max-w-[80%]">
              <div className="rounded-lg bg-muted px-4 py-2.5">
                <Shimmer width="w-full" height="h-4" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
});

ChatMessages.displayName = "ChatMessages";

export default ChatMessages;
