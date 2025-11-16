"use client";

import React, { memo, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  setCurrentSession,
  deleteSession,
  fetchAllSessions,
} from "@/lib/store/slices/sessionSlice";
import { fetchConversations } from "@/lib/store/slices/chatSlice";
import { Trash2, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SessionListProps {
  onCreateSession: () => void;
}

const SessionList = memo(({ onCreateSession }: SessionListProps) => {
  const dispatch = useAppDispatch();
  const { userId } = useAuth();
  const sessions = useAppSelector((state) => state.sessions.sessions);
  const currentSessionId = useAppSelector(
    (state) => state.sessions.currentSessionId
  );
  const loading = useAppSelector((state) => state.sessions.loading);

  useEffect(() => {
    if (userId) {
      dispatch(fetchAllSessions(userId));
    }
  }, [dispatch, userId]);

  const handleSelectSession = useCallback(
    (sessionId: string) => {
      dispatch(setCurrentSession(sessionId));
      if (userId) {
        dispatch(fetchConversations({ sessionId, userId }));
      }
    },
    [dispatch, userId]
  );

  const handleDeleteSession = useCallback(
    async (e: React.MouseEvent, sessionId: string) => {
      e.stopPropagation();
      if (confirm("Are you sure you want to delete this session?")) {
        dispatch(deleteSession({ sessionId, userId }));
      }
    },
    [dispatch, userId]
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Sessions</CardTitle>
        <Button size="icon" variant="ghost" onClick={onCreateSession}>
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-2">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Loading sessions...
              </p>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No sessions yet. Create one to get started.
              </p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`
                    p-3 rounded-lg border cursor-pointer transition-colors
                    ${
                      currentSessionId === session.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    }
                  `}
                  onClick={() => handleSelectSession(session.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {session.title || `Session ${session.id.slice(0, 8)}`}
                      </p>
                      <p className="text-xs opacity-70 mt-1">
                        {session.conversation_count} conversations
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={(e) => handleDeleteSession(e, session.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
});

SessionList.displayName = "SessionList";

export default SessionList;
