import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import {
  StreamEvent,
  ActionTaken,
  ConversationResponse,
  apiClient,
} from "../../api";

export interface ChatMessage {
  id: string;
  type: "user" | "agent" | "thought" | "action" | "observation" | "error";
  content: string;
  timestamp: number;
  iteration?: number;
  actionType?: string;
  observation?: string;
}

interface ChatState {
  messages: ChatMessage[];
  currentThought: string;
  currentAnswer: string;
  isStreaming: boolean;
  currentIteration: number | null;
  actions: ActionTaken[];
  error: string | null;
  currentAction: {
    type: string;
    query: string;
  } | null;
  lastSessionId: string | null;
}

const initialState: ChatState = {
  messages: [],
  currentThought: "",
  currentAnswer: "",
  isStreaming: false,
  currentIteration: null,
  actions: [],
  error: null,
  currentAction: null,
  lastSessionId: null,
};

// Helper function to convert ConversationResponse to ChatMessage[]
const convertConversationsToMessages = (
  conversations: ConversationResponse[]
): ChatMessage[] => {
  const messages: ChatMessage[] = [];

  // Sort conversations by created_at (oldest first) to maintain chronological order
  const sortedConversations = [...conversations].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  for (const conv of sortedConversations) {
    // Add user query
    messages.push({
      id: `conv-${conv.id}-query`,
      type: "user",
      content: conv.query,
      timestamp: new Date(conv.created_at).getTime(),
    });

    // Add actions and observations from actions_taken
    for (let i = 0; i < conv.actions_taken.length; i++) {
      const action = conv.actions_taken[i];

      // Add action
      messages.push({
        id: `conv-${conv.id}-action-${i}`,
        type: "action",
        content: action.input,
        timestamp: new Date(action.timestamp).getTime(),
        actionType: action.type,
      });

      // Add observation if present
      if (action.observation) {
        messages.push({
          id: `conv-${conv.id}-observation-${i}`,
          type: "observation",
          content: action.observation,
          timestamp: new Date(action.timestamp).getTime(),
          actionType: action.type,
        });
      }
    }

    // Add agent response
    messages.push({
      id: `conv-${conv.id}-response`,
      type: "agent",
      content: conv.response,
      timestamp: new Date(conv.created_at).getTime(),
    });
  }

  return messages;
};

export const fetchConversations = createAsyncThunk(
  "chat/fetchConversations",
  async ({ sessionId, userId }: { sessionId: string; userId: string }) => {
    return await apiClient.getConversations(sessionId, userId);
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
    },
    addUserMessage: (state, action: PayloadAction<string>) => {
      state.messages.push({
        id: Date.now().toString(),
        type: "user",
        content: action.payload,
        timestamp: Date.now(),
      });
    },
    handleStreamEvent: (state, action: PayloadAction<StreamEvent>) => {
      const event = action.payload;

      switch (event.type) {
        case "start":
          state.isStreaming = true;
          state.error = null;
          state.currentThought = "";
          state.currentAnswer = "";
          state.actions = [];
          state.currentAction = null;
          if (event.query) {
            state.messages.push({
              id: Date.now().toString(),
              type: "user",
              content: event.query,
              timestamp: Date.now(),
            });
          }
          break;

        case "iteration_start":
          state.currentIteration = event.iteration || null;
          break;

        case "thought_token":
          state.currentThought += event.token || "";
          break;

        case "thought_complete":
          if (state.currentThought) {
            // Clean up the thought text (remove "Thought:" prefix if present)
            let cleanedThought = state.currentThought.trim();
            if (cleanedThought.startsWith("Thought:")) {
              cleanedThought = cleanedThought
                .replace(/^Thought:\s*/i, "")
                .trim();
            }

            state.messages.push({
              id: `thought-${state.currentIteration}-${Date.now()}`,
              type: "thought",
              content: cleanedThought,
              timestamp: Date.now(),
              iteration: state.currentIteration || undefined,
            });
            state.currentThought = "";
          }
          break;

        case "action":
          // Store current action for UI display
          const actionType = event.action_type || "action";
          const actionInput = event.input || "";

          if (actionType === "web_search") {
            state.currentAction = {
              type: "web_search",
              query: actionInput,
            };
          } else {
            state.currentAction = {
              type: actionType,
              query: actionInput,
            };
          }

          // Save action as a message
          state.messages.push({
            id: `action-${state.currentIteration}-${Date.now()}`,
            type: "action",
            content: actionInput,
            timestamp: Date.now(),
            iteration: state.currentIteration || undefined,
            actionType: actionType,
          });
          break;

        case "observation":
          // Save observation as a message before clearing action
          if (event.observation) {
            state.messages.push({
              id: `observation-${state.currentIteration}-${Date.now()}`,
              type: "observation",
              content: event.observation,
              timestamp: Date.now(),
              iteration: state.currentIteration || undefined,
              actionType: event.action_type || undefined,
            });
          }
          // Clear current action after observation
          state.currentAction = null;
          break;

        case "final_answer_token":
          state.currentAnswer += event.token || "";
          break;

        case "final_answer_complete":
          if (state.currentAnswer) {
            state.messages.push({
              id: `answer-${Date.now()}`,
              type: "agent",
              content: state.currentAnswer,
              timestamp: Date.now(),
            });
            state.currentAnswer = "";
          }
          if (event.session_id) {
            state.lastSessionId = event.session_id;
          }
          state.isStreaming = false;
          state.currentIteration = null;
          break;

        case "error":
          state.error = event.message || "An error occurred";
          state.isStreaming = false;
          state.messages.push({
            id: `error-${Date.now()}`,
            type: "error",
            content: event.message || "An error occurred",
            timestamp: Date.now(),
          });
          break;

        case "end":
          // Save any remaining content before clearing
          if (state.currentAnswer) {
            state.messages.push({
              id: `answer-${Date.now()}`,
              type: "agent",
              content: state.currentAnswer,
              timestamp: Date.now(),
            });
            state.currentAnswer = "";
          }
          if (state.currentThought) {
            let cleanedThought = state.currentThought.trim();
            if (cleanedThought.startsWith("Thought:")) {
              cleanedThought = cleanedThought
                .replace(/^Thought:\s*/i, "")
                .trim();
            }
            state.messages.push({
              id: `thought-${state.currentIteration}-${Date.now()}`,
              type: "thought",
              content: cleanedThought,
              timestamp: Date.now(),
              iteration: state.currentIteration || undefined,
            });
            state.currentThought = "";
          }
          // Save any pending action if it exists
          if (state.currentAction) {
            state.messages.push({
              id: `action-${state.currentIteration}-${Date.now()}`,
              type: "action",
              content: state.currentAction.query,
              timestamp: Date.now(),
              iteration: state.currentIteration || undefined,
              actionType: state.currentAction.type,
            });
            state.currentAction = null;
          }
          if (event.session_id) {
            state.lastSessionId = event.session_id;
          }
          state.isStreaming = false;
          state.currentIteration = null;
          break;

        case "max_iterations":
          // Save any remaining content before showing error
          if (state.currentAnswer) {
            state.messages.push({
              id: `answer-${Date.now()}`,
              type: "agent",
              content: state.currentAnswer,
              timestamp: Date.now(),
            });
            state.currentAnswer = "";
          }
          if (state.currentThought) {
            let cleanedThought = state.currentThought.trim();
            if (cleanedThought.startsWith("Thought:")) {
              cleanedThought = cleanedThought
                .replace(/^Thought:\s*/i, "")
                .trim();
            }
            state.messages.push({
              id: `thought-${state.currentIteration}-${Date.now()}`,
              type: "thought",
              content: cleanedThought,
              timestamp: Date.now(),
              iteration: state.currentIteration || undefined,
            });
            state.currentThought = "";
          }
          if (state.currentAction) {
            state.messages.push({
              id: `action-${state.currentIteration}-${Date.now()}`,
              type: "action",
              content: state.currentAction.query,
              timestamp: Date.now(),
              iteration: state.currentIteration || undefined,
              actionType: state.currentAction.type,
            });
            state.currentAction = null;
          }
          state.isStreaming = false;
          state.messages.push({
            id: `max-iterations-${Date.now()}`,
            type: "error",
            content: event.message || "Maximum iterations reached",
            timestamp: Date.now(),
          });
          state.currentIteration = null;
          break;

        default:
          // Ignore unknown event types (e.g., "pause" which has been removed from backend)
          // This ensures the frontend continues processing other events in the stream
          break;
      }
    },
    clearMessages: (state) => {
      state.messages = [];
      state.currentThought = "";
      state.currentAnswer = "";
      state.error = null;
      state.actions = [];
      state.currentAction = null;
      state.lastSessionId = null;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isStreaming = false;
    },
    loadConversations: (
      state,
      action: PayloadAction<ConversationResponse[]>
    ) => {
      state.messages = convertConversationsToMessages(action.payload);
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.messages = convertConversationsToMessages(action.payload);
        state.error = null;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.error = action.error.message || "Failed to fetch conversations";
      });
  },
});

export const {
  addMessage,
  addUserMessage,
  handleStreamEvent,
  clearMessages,
  setError,
  loadConversations,
} = chatSlice.actions;

export default chatSlice.reducer;
