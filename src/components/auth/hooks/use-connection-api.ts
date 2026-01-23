/**
 * Connection API Hook
 * Handles connection, developer access management via RPC calls
 */

import { useCallback, useState } from "react";
import { useAuthStore } from "@/stores/modules/auth.store";
import { toast } from "@/stores";
import { WebfixApiClient } from "@/lib/webfix-api-client";

// ============================================
// Types
// ============================================

export interface ConnectionNodeParams {
  clientInfo?: {
    userAgent?: string;
    platform?: string;
    version?: string;
  };
}

export interface ConnectionNodeResponse {
  success?: boolean;
  nodeId?: string;
  serverTime?: number;
  error?: string;
}

export interface DeveloperRequest {
  id: string;
  githubUsername: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: number;
  respondedAt?: number;
}

export interface ListDeveloperRequestsResponse {
  success?: boolean;
  requests?: DeveloperRequest[];
  error?: string;
}

export interface ApproveDeveloperAccessParams {
  requestId: string;
  approved: boolean;
  reason?: string;
}

export interface ApproveDeveloperAccessResponse {
  success?: boolean;
  request?: DeveloperRequest;
  error?: string;
}

// ============================================
// Helper
// ============================================

function getApiClient(): WebfixApiClient | null {
  const connectionSession = useAuthStore.getState().connectionSession;
  if (!connectionSession) return null;

  const client = new WebfixApiClient(connectionSession.api);
  client.setSession(connectionSession.session);
  return client;
}

// ============================================
// Hook
// ============================================

export function useConnectionApi() {
  const connectionSession = useAuthStore((s) => s.connectionSession);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [developerRequests, setDeveloperRequests] = useState<DeveloperRequest[]>([]);

  // Connect to node
  const connectionNode = useCallback(
    async (params?: ConnectionNodeParams): Promise<ConnectionNodeResponse | null> => {
      if (!connectionSession) {
        setError("Not connected");
        toast.error("Not connected to server");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const client = new WebfixApiClient(connectionSession.api);
        // connectionNode doesn't require session

        const response = await client.request<ConnectionNodeResponse>(
          "connectionNode",
          params || {}
        );

        console.log("[ConnectionApi] connectionNode response:", response);

        if (response.success !== false && response.nodeId) {
          toast.success("Connected to node", `Node ID: ${response.nodeId}`);
          return response;
        }

        throw new Error(response.error || "Failed to connect to node");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to connect to node";
        setError(msg);
        toast.error("Connection failed", msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [connectionSession]
  );

  // List developer requests (owner only)
  const listDeveloperRequests = useCallback(async (): Promise<DeveloperRequest[]> => {
    const client = getApiClient();
    if (!client) {
      setError("Not connected");
      toast.error("Not connected to server");
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const response = await client.request<ListDeveloperRequestsResponse>(
        "listDeveloperRequests",
        {}
      );

      console.log("[ConnectionApi] listDeveloperRequests response:", response);

      const requests = response.requests || [];
      setDeveloperRequests(requests);
      return requests;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to list developer requests";
      setError(msg);
      toast.error("Failed to list developer requests", msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Approve or reject developer access (owner only)
  const approveDeveloperAccess = useCallback(
    async (params: ApproveDeveloperAccessParams): Promise<boolean> => {
      const client = getApiClient();
      if (!client) {
        setError("Not connected");
        toast.error("Not connected to server");
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await client.request<ApproveDeveloperAccessResponse>(
          "approveDeveloperAccess",
          params
        );

        console.log("[ConnectionApi] approveDeveloperAccess response:", response);

        if (response.success !== false) {
          const action = params.approved ? "approved" : "rejected";
          toast.success(
            `Developer access ${action}`,
            `Request ${params.requestId} has been ${action}`
          );

          // Update local state
          setDeveloperRequests((prev) =>
            prev.map((r) =>
              r.id === params.requestId
                ? { ...r, status: params.approved ? "approved" : "rejected" }
                : r
            )
          );

          return true;
        }

        throw new Error(response.error || "Failed to process developer access");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to process developer access";
        setError(msg);
        toast.error("Failed to process developer access", msg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    connectionNode,
    listDeveloperRequests,
    approveDeveloperAccess,
    developerRequests,
    loading,
    error,
  };
}
