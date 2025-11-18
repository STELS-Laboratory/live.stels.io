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
  ModelConfig,
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
      console.log("[StelsApiService] Adding session header:", {
        session: this.session.substring(0, 10) + "...",
        baseUrl: this.baseUrl,
      });
    } else {
      console.warn("[StelsApiService] No session available for request to:", this.baseUrl);
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
      console.log("[StelsApiService] Testing connection to:", this.baseUrl, {
        hasSession: !!this.session,
        headers: Object.keys(headers),
      });

      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        console.error("[StelsApiService] Connection test failed:", {
          status: response.status,
          statusText: response.statusText,
          url: this.baseUrl,
          hasSession: !!this.session,
        });
      }

      return response.ok;
    } catch (error) {
      console.error("[StelsApiService] Connection test error:", error);
      return false;
    }
  }

  /**
   * Get list of available models
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
    return data.models || [];
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
   * Stream chat completion
   * Uses POST /api/chat with stream: true
   * Note: For SSE endpoint, use /api/stels/chat/stream
   */
  async *streamChat(
    model: string,
    messages: Array<{ role: string; content: string }>,
    options?: {
      context?: number[];
      format?: string;
      keep_alive?: string;
      temperature?: number;
      top_p?: number;
      top_k?: number;
      num_predict?: number;
      repeat_penalty?: number;
      seed?: number;
      stop?: string[];
    },
  ): AsyncGenerator<StelsApiResponse, void, unknown> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        context: options?.context,
        format: options?.format,
        keep_alive: options?.keep_alive,
        options:
          options?.temperature !== undefined ||
          options?.top_p !== undefined ||
          options?.top_k !== undefined ||
          options?.num_predict !== undefined ||
          options?.repeat_penalty !== undefined ||
          options?.seed !== undefined ||
          options?.stop !== undefined
            ? (() => {
                const opts: Record<string, unknown> = {};
                if (options.temperature !== undefined)
                  opts.temperature = options.temperature;
                if (options.top_p !== undefined) opts.top_p = options.top_p;
                if (options.top_k !== undefined) opts.top_k = options.top_k;
                if (options.num_predict !== undefined)
                  opts.num_predict = options.num_predict;
                if (options.repeat_penalty !== undefined)
                  opts.repeat_penalty = options.repeat_penalty;
                if (options.seed !== undefined) opts.seed = options.seed;
                if (options.stop !== undefined) opts.stop = options.stop;
                return Object.keys(opts).length > 0 ? opts : undefined;
              })()
            : undefined,
      }),
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
          if (line.trim()) {
            try {
              const data = JSON.parse(line) as StelsApiResponse;
              yield data;
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
   * Create a new model
   */
  async createModel(config: ModelConfig): Promise<void> {
    // Create modelfile content
    let modelfileContent = config.modelfile || "";

    // If no base model and no modelfile, we need at least FROM statement
    if (config.baseModel) {
      modelfileContent = `FROM ${config.baseModel}\n\n${modelfileContent}`;
    } else if (!modelfileContent.trim()) {
      throw new Error(
        "Either base model or modelfile content is required to create a model",
      );
    }

    if (config.systemPrompt) {
      modelfileContent += `\n\nSYSTEM """${config.systemPrompt}"""`;
    }

    if (config.template) {
      modelfileContent += `\n\nTEMPLATE """${config.template}"""`;
    }

    // Add parameters
    const params: string[] = [];
    if (config.parameters.temperature !== undefined) {
      params.push(`temperature ${config.parameters.temperature}`);
    }
    if (config.parameters.top_p !== undefined) {
      params.push(`top_p ${config.parameters.top_p}`);
    }
    if (config.parameters.top_k !== undefined) {
      params.push(`top_k ${config.parameters.top_k}`);
    }
    if (config.parameters.num_predict !== undefined) {
      params.push(`num_predict ${config.parameters.num_predict}`);
    }
    if (config.parameters.repeat_penalty !== undefined) {
      params.push(`repeat_penalty ${config.parameters.repeat_penalty}`);
    }
    if (config.parameters.seed !== undefined) {
      params.push(`seed ${config.parameters.seed}`);
    }
    if (config.parameters.num_ctx !== undefined) {
      params.push(`num_ctx ${config.parameters.num_ctx}`);
    }
    if (config.parameters.num_thread !== undefined) {
      params.push(`num_thread ${config.parameters.num_thread}`);
    }
    if (config.parameters.num_gpu !== undefined) {
      params.push(`num_gpu ${config.parameters.num_gpu}`);
    }
    if (config.parameters.use_mmap !== undefined) {
      params.push(`use_mmap ${config.parameters.use_mmap}`);
    }
    if (config.parameters.use_mlock !== undefined) {
      params.push(`use_mlock ${config.parameters.use_mlock}`);
    }
    if (config.parameters.numa !== undefined) {
      params.push(`numa ${config.parameters.numa}`);
    }

    if (params.length > 0) {
      modelfileContent += `\n\nPARAMETER ${params.join(" ")}`;
    }

    // API expects JSON, not FormData
    const response = await fetch(`${this.baseUrl}/api/create`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        name: config.name,
        modelfile: modelfileContent,
        stream: false,
      }),
    });

    if (!response.ok) {
      let errorMessage = `Failed to create model: ${response.statusText}`;
      try {
        const error = await response.json();
        errorMessage = error.error?.message || errorMessage;
      } catch {
        // Use default error message
      }
      throw new Error(errorMessage);
    }

    // Wait for model creation to complete (streaming response)
    const reader = response.body?.getReader();
    if (reader) {
      const decoder = new TextDecoder();
      let buffer = "";
      let success = false;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line);
                if (data.status === "success" || data.done) {
                  success = true;
                  return;
                }
                if (data.error) {
                  throw new Error(data.error);
                }
              } catch (parseError) {
                // Skip invalid JSON, but check if it's an error
                if (parseError instanceof Error && parseError.message) {
                  throw parseError;
                }
              }
            }
          }
        }

        if (!success) {
          throw new Error("Model creation did not complete successfully");
        }
      } finally {
        reader.releaseLock();
      }
    } else {
      // If no streaming, just check response
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
    }
  }

  /**
   * Delete a model
   */
  async deleteModel(modelName: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/delete`, {
      method: "DELETE",
      headers: this.getHeaders(),
      body: JSON.stringify({
        name: modelName,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error?.message || `Failed to delete model: ${response.statusText}`,
      );
    }
  }

  /**
   * Show model information
   */
  async showModel(modelName: string): Promise<{
    modelfile: string;
    parameters: string;
    template: string;
    system: string;
    details: {
      format: string;
      family: string;
      families: string[];
      parameter_size: string;
      quantization_level: string;
    };
    license?: string;
  }> {
    const response = await fetch(`${this.baseUrl}/api/show`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        name: modelName,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error?.message || `Failed to show model: ${response.statusText}`,
      );
    }

    return await response.json();
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

