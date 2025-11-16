import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { SessionResponse, apiClient } from "../../api";

interface SessionsState {
  sessions: SessionResponse[];
  currentSessionId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: SessionsState = {
  sessions: [],
  currentSessionId: null,
  loading: false,
  error: null,
};

export const createSession = createAsyncThunk(
  "sessions/create",
  async ({ title, userId }: { title: string; userId: string }) => {
    return await apiClient.createSession(title, userId);
  }
);

export const fetchAllSessions = createAsyncThunk(
  "sessions/fetchAll",
  async (userId: string) => {
    return await apiClient.getAllSessions(userId);
  }
);

export const deleteSession = createAsyncThunk(
  "sessions/delete",
  async ({ sessionId, userId }: { sessionId: string; userId: string }) => {
    await apiClient.deleteSession(sessionId, userId);
    return sessionId;
  }
);

const sessionSlice = createSlice({
  name: "sessions",
  initialState,
  reducers: {
    setCurrentSession: (state, action: PayloadAction<string | null>) => {
      state.currentSessionId = action.payload;
    },
    setSessions: (state, action: PayloadAction<SessionResponse[]>) => {
      state.sessions = action.payload;
    },
    addSession: (state, action: PayloadAction<SessionResponse>) => {
      state.sessions.unshift(action.payload);
    },
    removeSession: (state, action: PayloadAction<string>) => {
      state.sessions = state.sessions.filter((s) => s.id !== action.payload);
      if (state.currentSessionId === action.payload) {
        state.currentSessionId = null;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllSessions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllSessions.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions = action.payload;
      })
      .addCase(fetchAllSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch sessions";
      })
      .addCase(createSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSession.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions.unshift(action.payload);
        state.currentSessionId = action.payload.id;
      })
      .addCase(createSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create session";
      })
      .addCase(deleteSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSession.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions = state.sessions.filter((s) => s.id !== action.payload);
        if (state.currentSessionId === action.payload) {
          state.currentSessionId = null;
        }
      })
      .addCase(deleteSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to delete session";
      });
  },
});

export const {
  setCurrentSession,
  setSessions,
  addSession,
  removeSession,
  clearError,
} = sessionSlice.actions;

export default sessionSlice.reducer;
