/**
 * Stels API Service
 * Handles all communication with Stels API
 * 
 * Uses Webfix RPC protocol for all API methods.
 * SSE endpoints (streamChat) remain as direct GET requests.
 */

import { WebfixApiClient } from "@/lib/webfix-api-client";
import type {
  StelsModel,
  StelsApiResponse,
  Assistant,
  CreateAssistantRequest,
  UpdateAssistantRequest,
  ListAssistantsFilters,
  ModelRegistryEntry,
  RegisterModelRequest,
  ListRegisteredModelsRequest,
} from "../types";

export class StelsApiService {
  private baseUrl: string;
  private session?: string;
  private token?: string;
  private webfixClient: WebfixApiClient;

  constructor(
    baseUrl: string,
    session?: string,
    token?: string,
  ) {
    let normalizedUrl = baseUrl;

    this.baseUrl = normalizedUrl.replace(/\/$/, ""); // Remove trailing slash
    this.session = session;
    this.token = token;
    this.webfixClient = new WebfixApiClient(normalizedUrl);
    if (session) {
      this.webfixClient.setSession(session);
    }
  }

  /**
   * Get headers for API requests (for direct endpoints)
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Add session header if available (using stels-session format as per project standard)
    if (this.session) {
      headers["stels-session"] = this.session;
    }
    // Token is typically not needed if session is provided, but include it if available
    if (this.token && !this.session) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Update session for both direct endpoints and Webfix client
   */
  setSession(session?: string): void {
    this.session = session;
    this.webfixClient.setSession(session || null);
  }

  /**
   * Get list of available models using RPC method
   * Replaces deprecated getModels() which used /api/tags
   */
  async getModels(): Promise<StelsModel[]> {
    return this.stelsListModels();
  }

  /**
   * Chat with Stels model using RPC method
   * Replaces deprecated chat() which used /api/chat
   */
  async chat(
    model: string,
    messages: Array<{ role: string; content: string }>,
    options?: {
      stream?: boolean;
      context?: number[];
      format?: string;
      keep_alive?: string;
      temperature?: number;
      top_p?: number;
      top_k?: number;
      max_tokens?: number;
      stop?: string[];
      seed?: number;
    },
  ): Promise<StelsApiResponse> {
    const requestBody: {
      model: string;
      messages: Array<{ role: string; content: string }>;
      stream?: boolean;
      format?: string;
      max_tokens?: number;
      temperature?: number;
      top_p?: number;
      stop?: string[];
      seed?: number;
      options?: {
        context?: number[];
        keep_alive?: string;
        top_k?: number;
      };
    } = {
      model,
      messages,
    };

    if (options) {
      if (options.stream !== undefined) {
        requestBody.stream = options.stream;
      }
      if (options.format) {
        requestBody.format = options.format;
      }
      if (options.max_tokens !== undefined) {
        requestBody.max_tokens = options.max_tokens;
      }
      if (options.temperature !== undefined) {
        requestBody.temperature = options.temperature;
      }
      if (options.top_p !== undefined) {
        requestBody.top_p = options.top_p;
      }
      if (options.stop) {
        requestBody.stop = options.stop;
      }
      if (options.seed !== undefined) {
        requestBody.seed = options.seed;
      }
      if (options.context || options.keep_alive || options.top_k !== undefined) {
        requestBody.options = {};
        if (options.context) {
          requestBody.options.context = options.context;
        }
        if (options.keep_alive) {
          requestBody.options.keep_alive = options.keep_alive;
        }
        if (options.top_k !== undefined) {
          requestBody.options.top_k = options.top_k;
        }
      }
    }

    const data = await this.makeWebfixRequest<{
      success?: boolean;
      response?: StelsApiResponse;
    }>("stelsChat", requestBody);

    if (data.success && data.response) {
      return data.response;
    }

    // Fallback: check if response is directly in data
    if ((data as unknown as StelsApiResponse).id) {
      return data as unknown as StelsApiResponse;
    }

    throw new Error("Invalid response from stelsChat");
  }

  /**
   * Stream chat completion using Server-Sent Events (SSE)
   * Uses GET /api/stels/chat/stream with query parameters
   */
  async *streamChat(
    model: string,
    messages: Array<{ role: string; content: string }>,
    options?: {
      temperature?: number;
      top_p?: number;
      top_k?: number;
      num_predict?: number;
      repeat_penalty?: number;
      seed?: number;
      stop?: string[];
    },
  ): AsyncGenerator<StelsApiResponse, void, unknown> {
    // Build URL with query parameters
    const messagesParam = encodeURIComponent(JSON.stringify(messages));
    const urlParams = new URLSearchParams({
      model: model,
      messages: messagesParam,
    });

    // Add options as query parameters if provided
    if (options) {
      if (options.temperature !== undefined) {
        urlParams.append("temperature", options.temperature.toString());
      }
      if (options.top_p !== undefined) {
        urlParams.append("top_p", options.top_p.toString());
      }
      if (options.top_k !== undefined) {
        urlParams.append("top_k", options.top_k.toString());
      }
      if (options.num_predict !== undefined) {
        urlParams.append("num_predict", options.num_predict.toString());
      }
      if (options.repeat_penalty !== undefined) {
        urlParams.append("repeat_penalty", options.repeat_penalty.toString());
      }
      if (options.seed !== undefined) {
        urlParams.append("seed", options.seed.toString());
      }
      if (options.stop !== undefined && options.stop.length > 0) {
        urlParams.append("stop", JSON.stringify(options.stop));
      }
    }

    const url = `${this.baseUrl}/api/stels/chat/stream?${urlParams.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error?.message || `Failed to stream chat: ${response.statusText}`,
      );
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim() === "") continue;
          
          // SSE format: "data: {json}\n\n"
          if (line.startsWith("data: ")) {
            const jsonStr = line.substring(6);
            
            // Check for end marker
            if (jsonStr === "[DONE]") {
              return;
            }
            
            try {
              const data = JSON.parse(jsonStr) as StelsApiResponse;
              yield data;
              
              if (data.done) {
                return;
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Make webfix API request using WebfixApiClient
   */
  private async makeWebfixRequest<T = unknown>(
    method: string,
    body: unknown,
    networkId?: string,
  ): Promise<T> {
    const params = networkId ? [networkId] : ["network-id"];
    return this.webfixClient.request<T>(method, body, params);
  }

  /**
   * Create assistant
   */
  async createAssistant(
    config: CreateAssistantRequest,
    networkId: string = "testnet",
  ): Promise<Assistant> {
    const data = await this.makeWebfixRequest<{
      assistant?: Assistant;
    }>("createAssistant", config, networkId);

    if (!data.assistant) {
      throw new Error("Failed to create assistant: invalid response");
    }

    return data.assistant;
  }

  /**
   * List assistants
   */
  async listAssistants(
    filters?: ListAssistantsFilters,
    networkId: string = "testnet",
  ): Promise<Assistant[]> {
    const data = await this.makeWebfixRequest<{
      assistants?: Assistant[];
    }>("listAssistants", filters || {}, networkId);

    return data.assistants || [];
  }

  /**
   * Get assistant by ID
   */
  async getAssistant(
    assistantId: string,
    networkId: string = "testnet",
  ): Promise<Assistant> {
    const data = await this.makeWebfixRequest<{
      assistant?: Assistant;
    }>("getAssistant", { id: assistantId }, networkId);

    if (!data.assistant) {
      throw new Error("Assistant not found");
    }

    return data.assistant;
  }

  /**
   * Update assistant
   */
  async updateAssistant(
    config: UpdateAssistantRequest,
    networkId: string = "testnet",
  ): Promise<Assistant> {
    const data = await this.makeWebfixRequest<{
      assistant?: Assistant;
    }>("updateAssistant", config, networkId);

    if (!data.assistant) {
      throw new Error("Failed to update assistant: invalid response");
    }

    return data.assistant;
  }

  /**
   * Delete assistant
   */
  async deleteAssistant(
    assistantId: string,
    networkId: string = "testnet",
  ): Promise<void> {
    await this.makeWebfixRequest(
      "deleteAssistant",
      { id: assistantId },
      networkId,
    );
  }

  /**
   * List available models from Ollama (WebFIX RPC)
   */
  async stelsListModels(): Promise<StelsModel[]> {
    const data = await this.makeWebfixRequest<{
      models?: StelsModel[];
    }>("stelsListModels", undefined);

    return data.models || [];
  }

  /**
   * Pull model from Ollama registry
   * Automatically registers model in registry if user is developer/owner
   */
  async stelsPullModel(modelName: string): Promise<void> {
    const data = await this.makeWebfixRequest<{
      success?: boolean;
      response?: { status?: string };
    }>("stelsPullModel", { name: modelName });

    if (!data.success) {
      throw new Error("Failed to pull model");
    }
  }

  /**
   * Register model in model registry
   * Requires developer or owner role
   */
  async registerModel(
    config: RegisterModelRequest,
  ): Promise<ModelRegistryEntry> {
    const data = await this.makeWebfixRequest<{
      model?: ModelRegistryEntry;
    }>("registerModel", config);

    if (!data.model) {
      throw new Error("Failed to register model: invalid response");
    }

    return data.model;
  }

  /**
   * Unregister model from model registry
   * Requires developer or owner role
   */
  async unregisterModel(modelName: string): Promise<void> {
    await this.makeWebfixRequest(
      "unregisterModel",
      { name: modelName },
    );
  }

  /**
   * List registered models from model registry
   */
  async listRegisteredModels(
    filters?: ListRegisteredModelsRequest,
  ): Promise<ModelRegistryEntry[]> {
    const data = await this.makeWebfixRequest<{
      models?: ModelRegistryEntry[];
    }>("listRegisteredModels", filters || {});

    return data.models || [];
  }
}
