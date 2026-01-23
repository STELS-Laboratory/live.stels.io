import { useCallback, useState } from "react";
import { useAuthStore } from "@/stores/modules/auth.store";
import { useAccountsStore } from "@/stores/modules/accounts.store";
import type { ListAccountsOptions, SetAccountPayload } from "@/lib/api-types";
import { toast } from "@/stores";
import { WebfixApiClient } from "@/lib/webfix-api-client";

// ============================================
// Types for new Account API methods
// ============================================

export interface ConnectAccountParams {
  userId: string;
  name: string;
  type: "exchange" | "iot_hub" | "drone_controller" | "social_network" | "email" | "webhook" | "database" | "cloud" | "custom";
  provider: string;
  credentials: {
    apiKey?: string;
    apiSecret?: string;
    accessToken?: string;
    refreshToken?: string;
    username?: string;
    password?: string;
    privateKey?: string;
    certificate?: string;
    connectionString?: string;
    webhookSecret?: string;
    customFields?: Record<string, string>;
  };
  permissions?: string[];
  metadata?: Record<string, unknown>;
}

export interface ConnectAccountResponse {
  success: boolean;
  account?: {
    id: string;
    name: string;
    type: string;
    provider: string;
    status: string;
    permissions: string[];
    createdAt: number;
  };
  error?: string;
}

export interface ValidateAccountParams {
  accountId: string;
}

export interface ValidateAccountResponse {
  success: boolean;
  valid?: boolean;
  status?: string;
  message?: string;
  error?: string;
}

export interface DisconnectAccountParams {
  accountId: string;
}

export interface DisconnectAccountResponse {
  success: boolean;
  deleted?: boolean;
  error?: string;
}

export interface SyncAccountBalanceParams {
  accountId: string;
  force?: boolean;
}

export interface SyncAccountBalanceResponse {
  success: boolean;
  accountId?: string;
  balance?: Record<string, { free: number; used: number; total: number }>;
  timestamp?: number;
  cached?: boolean;
  error?: string;
}

// ============================================
// Helper functions
// ============================================

function getAddressFromSession(): string | undefined {
  try {
    const raw = localStorage.getItem("private-store");
    if (!raw) return undefined;
    const data = JSON.parse(raw) as { raw?: { info?: { address?: string }; address?: string } };
    return data?.raw?.info?.address ?? data?.raw?.address;
  } catch {
    return undefined;
  }
}

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

export function useAccountsApi() {
  const connectionSession = useAuthStore((s) => s.connectionSession);
  const fetchAccountsFromServer = useAccountsStore(
    (s) => s.fetchAccountsFromServer,
  );
  const sendAccountToServer = useAccountsStore((s) => s.sendAccountToServer);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // List accounts
  const listAccounts = useCallback(
    async (overrides?: ListAccountsOptions) => {
      if (!connectionSession) {
        setError("Not connected");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const address = overrides?.address ?? getAddressFromSession();
        await fetchAccountsFromServer(connectionSession.session, connectionSession.api, {
          address,
          params: overrides?.params,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load accounts";
        setError(msg);
        toast.error("Load accounts failed", msg);
      } finally {
        setLoading(false);
      }
    },
    [connectionSession, fetchAccountsFromServer],
  );

  // Set account (existing method)
  const setAccount = useCallback(
    async (payload: SetAccountPayload, omitSecrets?: boolean) => {
      if (!connectionSession) {
        setError("Not connected");
        return false;
      }
      setLoading(true);
      setError(null);
      try {
        await sendAccountToServer(
          payload,
          connectionSession.session,
          connectionSession.api,
          { omitSecrets },
        );
        toast.success("Account saved", payload.nid);
        await listAccounts();
        return true;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to save account";
        setError(msg);
        toast.error("Save account failed", msg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [connectionSession, sendAccountToServer, listAccounts],
  );

  // Connect account (new method)
  const connectAccount = useCallback(
    async (params: ConnectAccountParams): Promise<ConnectAccountResponse | null> => {
      const client = getApiClient();
      if (!client) {
        setError("Not connected");
        toast.error("Not connected to server");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await client.request<ConnectAccountResponse>(
          "connectAccount",
          params
        );

        console.log("[AccountsApi] connectAccount response:", response);

        if (response.success && response.account) {
          toast.success("Account connected", `${response.account.name} has been connected`);
          await listAccounts();
          return response;
        }

        throw new Error(response.error || "Failed to connect account");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to connect account";
        setError(msg);
        toast.error("Connect account failed", msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [listAccounts],
  );

  // Validate account (new method)
  const validateAccount = useCallback(
    async (params: ValidateAccountParams): Promise<ValidateAccountResponse | null> => {
      const client = getApiClient();
      if (!client) {
        setError("Not connected");
        toast.error("Not connected to server");
        return null;
      }

      setValidating(true);
      setError(null);

      try {
        const response = await client.request<ValidateAccountResponse>(
          "validateAccount",
          params
        );

        console.log("[AccountsApi] validateAccount response:", response);

        if (response.valid) {
          toast.success("Account valid", response.message || "Account credentials are valid");
        } else {
          toast.error("Account invalid", response.message || "Account validation failed");
        }

        return response;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to validate account";
        setError(msg);
        toast.error("Validate account failed", msg);
        return null;
      } finally {
        setValidating(false);
      }
    },
    [],
  );

  // Disconnect account (new method)
  const disconnectAccount = useCallback(
    async (params: DisconnectAccountParams): Promise<boolean> => {
      const client = getApiClient();
      if (!client) {
        setError("Not connected");
        toast.error("Not connected to server");
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await client.request<DisconnectAccountResponse>(
          "disconnectAccount",
          params
        );

        console.log("[AccountsApi] disconnectAccount response:", response);

        if (response.success || response.deleted) {
          toast.success("Account disconnected", "Account has been removed");
          await listAccounts();
          return true;
        }

        throw new Error(response.error || "Failed to disconnect account");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to disconnect account";
        setError(msg);
        toast.error("Disconnect account failed", msg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [listAccounts],
  );

  // Sync account balance (new method)
  const syncAccountBalance = useCallback(
    async (params: SyncAccountBalanceParams): Promise<SyncAccountBalanceResponse | null> => {
      const client = getApiClient();
      if (!client) {
        setError("Not connected");
        toast.error("Not connected to server");
        return null;
      }

      setSyncing(true);
      setError(null);

      try {
        const response = await client.request<SyncAccountBalanceResponse>(
          "syncAccountBalance",
          params
        );

        console.log("[AccountsApi] syncAccountBalance response:", response);

        if (response.success) {
          const cached = response.cached ? " (cached)" : "";
          toast.success("Balance synced", `Account balance updated${cached}`);
          return response;
        }

        throw new Error(response.error || "Failed to sync balance");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to sync balance";
        setError(msg);
        toast.error("Sync balance failed", msg);
        return null;
      } finally {
        setSyncing(false);
      }
    },
    [],
  );

  // Link agent to account (new canonical name for connectAccountToAgent)
  const linkAgentToAccount = useCallback(
    async (params: { agentId: string; accountId: string; scopes?: string[] }): Promise<boolean> => {
      const client = getApiClient();
      if (!client) {
        setError("Not connected");
        toast.error("Not connected to server");
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await client.request<{ success: boolean; error?: string }>(
          "linkAgentToAccount",
          params
        );

        console.log("[AccountsApi] linkAgentToAccount response:", response);

        if (response.success !== false) {
          toast.success("Agent linked", `Agent ${params.agentId} linked to account`);
          return true;
        }

        throw new Error(response.error || "Failed to link agent to account");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to link agent to account";
        setError(msg);
        toast.error("Link agent failed", msg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Unlink agent from account (new canonical name for disconnectAccountFromAgent)
  const unlinkAgentFromAccount = useCallback(
    async (params: { agentId: string; accountId: string }): Promise<boolean> => {
      const client = getApiClient();
      if (!client) {
        setError("Not connected");
        toast.error("Not connected to server");
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await client.request<{ success: boolean; error?: string }>(
          "unlinkAgentFromAccount",
          params
        );

        console.log("[AccountsApi] unlinkAgentFromAccount response:", response);

        if (response.success !== false) {
          toast.success("Agent unlinked", `Agent ${params.agentId} unlinked from account`);
          return true;
        }

        throw new Error(response.error || "Failed to unlink agent from account");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to unlink agent from account";
        setError(msg);
        toast.error("Unlink agent failed", msg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    // Existing methods
    listAccounts,
    setAccount,
    // New methods
    connectAccount,
    validateAccount,
    disconnectAccount,
    syncAccountBalance,
    linkAgentToAccount,
    unlinkAgentFromAccount,
    // State
    loading,
    error,
    validating,
    syncing,
  };
}
