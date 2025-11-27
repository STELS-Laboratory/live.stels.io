/**
 * Stels API Service
 * Handles all communication with Stels API
 * 
 * Note: This service uses direct API endpoints
 * (e.g., /api/tags, /api/chat) which remain unchanged.
 * For WebFIX RPC methods, use stels*.
 */

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

  constructor(
    baseUrl: string,
    session?: string,
    token?: string,
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.session = session;
    this.token = token;
  }

  /**
   * Get headers for API requests
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Add session header if available (using stels-session format as per project standard)
    if (this.session) {
      headers["stels-session"] = this.session;

    } else {
			// Empty block
		}
    // Token is typically not needed if session is provided, but include it if available
    if (this.token && !this.session) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Test connection to Stels API
   */
  async testConnection(): Promise<boolean> {
    try {
      const headers = this.getHeaders();

      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        // Response not ok
      }

      return response.ok;
    } catch {

      return false;
    }
  }

  /**
   * Get list of available models
   * Returns models in OpenAI-compatible format: { data: Model[], object: "list" }
   */
  async getModels(): Promise<StelsModel[]> {
    const response = await fetch(`${this.baseUrl}/api/tags`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    // OpenAI-compatible format: { data: Model[], object: "list" }
    // Convert to StelsModel format (id -> name)
    const models = data.data || [];
    return models.map((model: { id: string; object?: string; created?: number; owned_by?: string }) => ({
      name: model.id,
      model: model.id,
      size: 0, // Size not available in OpenAI format
      digest: "",
      details: {
        format: "",
        family: "",
        families: null,
        parameter_size: "",
        quantization_level: "",
      },
    }));
  }

  /**
   * Generate chat completion
   */
  async chat(
    model: string,
    messages: Array<{ role: string; content: string }>,
    options?: {
      stream?: boolean;
      context?: number[];
      format?: string;
      keep_alive?: string;
    },
  ): Promise<StelsApiResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        model,
        messages,
        stream: options?.stream || false,
        context: options?.context,
        format: options?.format,
        keep_alive: options?.keep_alive,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error?.message || `Failed to chat: ${response.statusText}`,
      );
    }

    return await response.json();
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
   * Make webfix API request
   */
  private async makeWebfixRequest(
    method: string,
    body: unknown,
    networkId?: string,
  ): Promise<unknown> {
    const requestBody: {
      webfix: string;
      method: string;
      params?: string[];
      body?: unknown;
    } = {
      webfix: "1.0",
      method,
    };

    // Only add params if networkId is provided
    if (networkId) {
      requestBody.params = [networkId];
    }

    // Only add body if it's provided and not empty
    if (body !== undefined && body !== null) {
      requestBody.body = body;
    }

    const response = await fetch(`${this.baseUrl}/`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        (error as { error?: { message?: string } }).error?.message ||
          `Failed to ${method}: ${response.statusText}`,
      );
    }

    const data = await response.json();
    if ((data as { error?: unknown }).error) {
      const errorData = (data as { error: { code?: number; message?: string } })
        .error;
      throw new Error(
        errorData.message || `API error: ${errorData.code || "unknown"}`,
      );
    }

    return data;
  }

  /**
   * Create assistant
   */
  async createAssistant(
    config: CreateAssistantRequest,
    networkId: string = "testnet",
  ): Promise<Assistant> {
    const data = (await this.makeWebfixRequest(
      "createAssistant",
      config,
      networkId,
    )) as {
      result?: { assistant?: Assistant };
    };

    if (!data.result?.assistant) {
      throw new Error("Failed to create assistant: invalid response");
    }

    return data.result.assistant;
  }

  /**
   * List assistants
   */
  async listAssistants(
    filters?: ListAssistantsFilters,
    networkId: string = "testnet",
  ): Promise<Assistant[]> {
    const data = (await this.makeWebfixRequest(
      "listAssistants",
      filters || {},
      networkId,
    )) as {
      result?: { assistants?: Assistant[] };
    };

    return data.result?.assistants || [];
  }

  /**
   * Get assistant by ID
   */
  async getAssistant(
    assistantId: string,
    networkId: string = "testnet",
  ): Promise<Assistant> {
    const data = (await this.makeWebfixRequest(
      "getAssistant",
      { id: assistantId },
      networkId,
    )) as {
      result?: { assistant?: Assistant };
    };

    if (!data.result?.assistant) {
      throw new Error("Assistant not found");
    }

    return data.result.assistant;
  }

  /**
   * Update assistant
   */
  async updateAssistant(
    config: UpdateAssistantRequest,
    networkId: string = "testnet",
  ): Promise<Assistant> {
    const data = (await this.makeWebfixRequest(
      "updateAssistant",
      config,
      networkId,
    )) as {
      result?: { assistant?: Assistant };
    };

    if (!data.result?.assistant) {
      throw new Error("Failed to update assistant: invalid response");
    }

    return data.result.assistant;
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
    const data = (await this.makeWebfixRequest(
      "stelsListModels",
      undefined,
    )) as {
      result?: { models?: StelsModel[] };
    };

    return data.result?.models || [];
  }

  /**
   * Pull model from Ollama registry
   * Automatically registers model in registry if user is developer/owner
   */
  async stelsPullModel(modelName: string): Promise<void> {
    const data = (await this.makeWebfixRequest(
      "stelsPullModel",
      { name: modelName },
    )) as {
      result?: { success?: boolean; response?: { status?: string } };
    };

    if (!data.result?.success) {
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
    const data = (await this.makeWebfixRequest(
      "registerModel",
      config,
    )) as {
      result?: { model?: ModelRegistryEntry };
    };

    if (!data.result?.model) {
      throw new Error("Failed to register model: invalid response");
    }

    return data.result.model;
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
    const data = (await this.makeWebfixRequest(
      "listRegisteredModels",
      filters || {},
    )) as {
      result?: { models?: ModelRegistryEntry[] };
    };

    return data.result?.models || [];
  }
}
