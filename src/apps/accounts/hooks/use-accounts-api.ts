import { useCallback, useState } from "react";
import { useAuthStore } from "@/stores/modules/auth.store";
import { useAccountsStore } from "@/stores/modules/accounts.store";
import type { ListAccountsOptions, SetAccountPayload } from "@/lib/api-types";
import { toast } from "@/stores";

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

export function useAccountsApi() {
  const connectionSession = useAuthStore((s) => s.connectionSession);
  const fetchAccountsFromServer = useAccountsStore(
    (s) => s.fetchAccountsFromServer,
  );
  const sendAccountToServer = useAccountsStore((s) => s.sendAccountToServer);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return { listAccounts, setAccount, loading, error };
}
