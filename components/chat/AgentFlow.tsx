"use client";

import React, { memo } from "react";
import { Shimmer } from "@/components/ui/shimmer";
import { useAppSelector } from "@/lib/store/hooks";

const AgentFlow = memo(() => {
  const currentThought = useAppSelector((state) => state.chat.currentThought);
  const currentAction = useAppSelector((state) => state.chat.currentAction);
  const isStreaming = useAppSelector((state) => state.chat.isStreaming);

  // Clean thought text (remove "Thought:" prefix)
  const getCleanedThought = (thought: string) => {
    if (!thought) return "";
    let cleaned = thought.trim();
    if (cleaned.startsWith("Thought:")) {
      cleaned = cleaned.replace(/^Thought:\s*/i, "").trim();
    }
    return cleaned;
  };

  if (!isStreaming && !currentThought && !currentAction) {
    return null;
  }

  return (
    <div className="px-4 py-2.5 border-b border-border/40 bg-muted/20">
      <div className="space-y-1.5">
        {/* Current Thought */}
        {currentThought && (
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {getCleanedThought(currentThought)}
              </p>
            </div>
          </div>
        )}

        {/* Current Action (Web Search) */}
        {currentAction && currentAction.type === "web_search" && (
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
              <Shimmer width="w-3" height="h-3" className="rounded-full" />
            </div>
            <p className="text-sm text-muted-foreground">
              searching web for:{" "}
              <span className="font-medium text-foreground/80">
                {currentAction.query}
              </span>
            </p>
          </div>
        )}

        {/* Generic Action */}
        {currentAction && currentAction.type !== "web_search" && (
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
              <Shimmer width="w-3" height="h-3" className="rounded-full" />
            </div>
            <p className="text-sm text-muted-foreground">
              {currentAction.type}:{" "}
              <span className="font-medium text-foreground/80">
                {currentAction.query}
              </span>
            </p>
          </div>
        )}

        {/* Shimmer loader when streaming but no specific content */}
        {isStreaming && !currentThought && !currentAction && (
          <div className="flex items-center gap-2">
            <Shimmer width="w-3" height="h-3" className="rounded-full" />
            <Shimmer width="w-32" height="h-3" />
          </div>
        )}
      </div>
    </div>
  );
});

AgentFlow.displayName = "AgentFlow";

export default AgentFlow;
