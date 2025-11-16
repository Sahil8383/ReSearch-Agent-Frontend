import axiosClient from "./axios-client";
import { AxiosError } from "axios";

export interface ChatRequest {
  query: string;
  stream?: boolean;
  max_iterations?: number;
  session_id?: string;
}

export interface ChatResponse {
  answer: string;
  iterations: number;
  status: string;
  actions_taken: ActionTaken[];
  execution_time_ms: number;
  message?: string;
  session_id: string;
  conversation_id: string;
}

export interface ActionTaken {
  type: string;
  input: string;
  observation?: string;
  timestamp: string;
}

export interface SessionResponse {
  id: string;
  title?: string;
  created_at: string;
  updated_at: string;
  conversation_count: number;
}

export interface ConversationResponse {
  id: string;
  query: string;
  response: string;
  iterations: number;
  status: string;
  actions_taken: ActionTaken[];
  execution_time_ms: number;
  created_at: string;
  session_id: string;
}

export interface CreateSessionRequest {
  title?: string;
}

export interface StreamEvent {
  type: string;
  message?: string;
  query?: string;
  iteration?: number;
  token?: string;
  action_type?: string;
  input?: string;
  observation?: string;
  answer?: string;
  iterations?: number;
  status?: string;
  actions_count?: number;
  session_id?: string;
  conversation_id?: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  status_code: number;
  timestamp: string;
}

class ApiClient {
  private getAuthHeaders(userId: string) {
    return {
      Authorization: `Bearer ${userId}`,
    };
  }

  async chat(request: ChatRequest, userId: string): Promise<ChatResponse> {
    try {
      const response = await axiosClient.post<ChatResponse>(
        "/api/chat",
        request,
        {
          headers: this.getAuthHeaders(userId),
        }
      );
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response?.data) {
        const errorData = error.response.data as ErrorResponse;
        throw new Error(errorData.message || "Chat request failed");
      }
      throw error;
    }
  }

  async createSession(title: string, userId: string): Promise<SessionResponse> {
    try {
      const response = await axiosClient.post<SessionResponse>(
        "/api/sessions",
        { title },
        {
          headers: this.getAuthHeaders(userId),
        }
      );
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response?.data) {
        const errorData = error.response.data as ErrorResponse;
        throw new Error(errorData.message || "Failed to create session");
      }
      throw error;
    }
  }

  async getSession(
    sessionId: string,
    userId: string
  ): Promise<SessionResponse> {
    try {
      const response = await axiosClient.get<SessionResponse>(
        `/api/sessions/${sessionId}`,
        {
          headers: this.getAuthHeaders(userId),
        }
      );
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response?.data) {
        const errorData = error.response.data as ErrorResponse;
        throw new Error(errorData.message || "Failed to get session");
      }
      throw error;
    }
  }

  async getAllSessions(userId: string): Promise<SessionResponse[]> {
    try {
      const response = await axiosClient.get<SessionResponse[]>(
        "/api/sessions/",
        {
          headers: this.getAuthHeaders(userId),
        }
      );
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response?.data) {
        const errorData = error.response.data as ErrorResponse;
        throw new Error(errorData.message || "Failed to get sessions");
      }
      throw error;
    }
  }

  async deleteSession(sessionId: string, userId: string): Promise<void> {
    try {
      await axiosClient.delete(`/api/sessions/${sessionId}`, {
        headers: this.getAuthHeaders(userId),
      });
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response?.data) {
        const errorData = error.response.data as ErrorResponse;
        throw new Error(errorData.message || "Failed to delete session");
      }
      throw error;
    }
  }

  async getConversations(
    sessionId: string,
    userId: string
  ): Promise<ConversationResponse[]> {
    try {
      const response = await axiosClient.get<ConversationResponse[]>(
        "/api/conversations/",
        {
          params: { session_id: sessionId },
          headers: this.getAuthHeaders(userId),
        }
      );
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response?.data) {
        const errorData = error.response.data as ErrorResponse;
        throw new Error(errorData.message || "Failed to get conversations");
      }
      throw error;
    }
  }

  async streamChat(
    request: ChatRequest,
    userId: string,
    onEvent?: (event: StreamEvent) => void
  ): Promise<void> {
    const url = `/api/chat/stream`;

    // Use axios client's baseURL configuration
    const baseURL =
      axiosClient.defaults.baseURL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8000";
    const fullUrl = `${baseURL}${url}`;

    try {
      // For SSE streaming, axios doesn't support SSE natively
      // We use fetch but construct the request using axios client's configuration
      const response = await fetch(fullUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeaders(userId),
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error: ErrorResponse = await response.json();
        throw new Error(error.message || "Stream request failed");
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data: StreamEvent = JSON.parse(line.slice(6));
              onEvent?.(data);
            } catch (e) {
              console.error("Failed to parse SSE event:", e);
            }
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Stream request failed");
    }
  }
}

export const apiClient = new ApiClient();
