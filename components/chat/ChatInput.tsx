"use client";

import React, { useState, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { addUserMessage } from "@/lib/store/slices/chatSlice";
import { apiClient } from "@/lib/api";
import { handleStreamEvent } from "@/lib/store/slices/chatSlice";
import { setCurrentSession } from "@/lib/store/slices/sessionSlice";
import { useAuth } from "@/contexts/AuthContext";

const ChatInput = memo(() => {
  const [query, setQuery] = useState("");
  const dispatch = useAppDispatch();
  const { userId } = useAuth();
  const isStreaming = useAppSelector((state) => state.chat.isStreaming);
  const currentSessionId = useAppSelector(
    (state) => state.sessions.currentSessionId
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!query.trim() || isStreaming) return;

      const userQuery = query.trim();
      setQuery("");
      dispatch(addUserMessage(userQuery));

      try {
        await apiClient.streamChat(
          {
            query: userQuery,
            stream: true,
            max_iterations: 10,
            session_id: currentSessionId || undefined,
          },
          userId,
          (event) => {
            dispatch(handleStreamEvent(event));
            // If we receive a session_id in the event, update the current session
            // This handles cases where a new session is created automatically
            if (event.session_id && event.session_id !== currentSessionId) {
              dispatch(setCurrentSession(event.session_id));
            }
          }
        );
      } catch (error) {
        dispatch(
          handleStreamEvent({
            type: "error",
            message:
              error instanceof Error ? error.message : "An error occurred",
          })
        );
      }
    },
    [query, isStreaming, dispatch, userId, currentSessionId]
  );

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask a question..."
        disabled={isStreaming}
        className="flex-1"
      />
      <Button type="submit" disabled={isStreaming || !query.trim()}>
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
});

ChatInput.displayName = "ChatInput";

export default ChatInput;
