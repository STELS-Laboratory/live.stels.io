import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type {
  AccountRequest,
  ListAccountsOptions,
  SetAccountPayload,
} from "@/lib/api-types";
import type {
  AccountRawData,
  AccountsActions,
  AccountsState,
  AccountsStore,
  AccountValue,
  StoredAccount,
} from "@/types/stores/types";

export type {
  AccountRawData,
  AccountsActions,
  AccountsState,
  AccountsStore,
  StoredAccount,
};

/**
 * Generate unique account ID
 */
function generateAccountId(): string {
  return `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Accounts store
 */
export const useAccountsStore = create<AccountsStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        accounts: [],
        activeAccountId: null,
        _hasHydrated: false,

        // Add new account
        addAccount: (account: AccountRequest): StoredAccount => {
          const accountId = generateAccountId();
          const accountWithId: AccountRequest = {
            ...account,
            id: accountId,
          };

          const storedAccount: StoredAccount = {
            account: accountWithId,
            publicKey: "",
            signature: "",
            address: "",
            id: accountId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          set((state) => ({
            accounts: [...state.accounts, storedAccount],
            activeAccountId: state.activeAccountId || accountId,
          }));

          return storedAccount;
        },

        // Update existing account
        updateAccount: (
          id: string,
          updates: Partial<AccountRequest>,
        ): boolean => {
          const { accounts } = get();
          const accountIndex = accounts.findIndex((acc) => acc.id === id);

          if (accountIndex === -1) {
            return false;
          }

          const existingAccount = accounts[accountIndex];
          const updatedAccount: AccountRequest = {
            ...existingAccount.account,
            ...updates,
            id: id,
          };

          const updatedStoredAccount: StoredAccount = {
            ...existingAccount,
            account: updatedAccount,
            updatedAt: Date.now(),
          };

          const newAccounts = [...accounts];
          newAccounts[accountIndex] = updatedStoredAccount;

          set({ accounts: newAccounts });

          return true;
        },

        // Remove account
        removeAccount: (id: string): void => {
          set((state) => {
            const newAccounts = state.accounts.filter((acc) => acc.id !== id);
            const newActiveId = state.activeAccountId === id
              ? (newAccounts.length > 0 ? newAccounts[0].id : null)
              : state.activeAccountId;

            return {
              accounts: newAccounts,
              activeAccountId: newActiveId,
            };
          });
        },

        // Set active account
        setActiveAccount: (id: string): void => {
          const { accounts } = get();
          const account = accounts.find((acc) => acc.id === id);
          if (account) {
            set({ activeAccountId: id });
          }
        },

        // Get account by ID
        getAccount: (id: string): StoredAccount | undefined => {
          const { accounts } = get();
          return accounts.find((acc) => acc.id === id);
        },

        // Get active account
        getActiveAccount: (): StoredAccount | undefined => {
          const { accounts, activeAccountId } = get();
          if (!activeAccountId) return undefined;
          return accounts.find((acc) => acc.id === activeAccountId);
        },

        // Send account to server (OpenAPI SetAccountParams)
        sendAccountToServer: async (
          payload: SetAccountPayload,
          session: string,
          apiUrl: string,
          options?: { omitSecrets?: boolean },
        ): Promise<boolean> => {
          const body: Record<string, unknown> = {
            nid: payload.nid,
            exchange: payload.exchange,
            note: payload.note,
            ...(options?.omitSecrets
              ? {}
              : { apiKey: payload.apiKey, secret: payload.secret }),
            ...(payload.password && { password: payload.password }),
            ...(payload.protocol && { protocol: payload.protocol }),
            ...(payload.viewers &&
              payload.viewers.length > 0 && { viewers: payload.viewers }),
          };

          const { WebfixApiClient } = await import("@/lib/webfix-api-client");
          const client = new WebfixApiClient(apiUrl);
          client.setSession(session);

          await client.request("setAccount", body, ["gliesereum"]);

          return true;
        },

        // Fetch accounts from server (supports Gliesereum { address } or standard {})
        fetchAccountsFromServer: async (
          session: string,
          apiUrl: string,
          options?: ListAccountsOptions,
        ): Promise<void> => {
          try {
            const body = options?.address ? { address: options.address } : {};
            const params = options?.address
              ? (options.params ?? ["gliesereum"])
              : (options?.params ?? []);

            const { WebfixApiClient } = await import("@/lib/webfix-api-client");
            const client = new WebfixApiClient(apiUrl);
            client.setSession(session);

            const result = await client.request<AccountValue[]>(
              "listAccounts",
              body,
              params,
            );

            // Process the accounts from server
            // Server returns AccountValue[] where each item has channel, module, widget, raw fields
            if (Array.isArray(result) && result.length > 0) {
              set({ accounts: [] });

              const fetchedAccounts: StoredAccount[] = result
                .filter((item: unknown): item is AccountValue => {
                  return (
                    typeof item === "object" &&
                    item !== null &&
                    "raw" in item &&
                    typeof item.raw === "object" &&
                    item.raw !== null &&
                    "nid" in item.raw &&
                    "exchange" in item.raw
                  );
                })
                .map((item: AccountValue) => {
                  const raw = item.raw;
                  const accountId = raw.nid || generateAccountId();
                  const addressFallback =
                    (raw as Record<string, unknown>).address ??
                    options?.address ??
                    "";

                  const accountRequest: AccountRequest = {
                    id: accountId,
                    nid: raw.nid,
                    connection: raw.connection ?? true,
                    exchange: raw.exchange,
                    note: raw.note || "",
                    apiKey: typeof raw.apiKey === "string" ? raw.apiKey : "",
                    secret: typeof raw.secret === "string" ? raw.secret : "",
                    status: raw.status || "active",
                    password: raw.password || undefined,
                    viewers: Array.isArray(raw.viewers)
                      ? raw.viewers
                      : undefined,
                    protocol: raw.protocol,
                    workers: Array.isArray(raw.workers)
                      ? raw.workers
                      : undefined,
                  };

                  const rawData: AccountRawData = {
                    ...raw,
                    channel: item.channel,
                    module: item.module,
                    widget: item.widget,
                  } as AccountRawData;

                  return {
                    id: accountId,
                    account: accountRequest,
                    publicKey:
                      typeof raw.publicKey === "string" ? raw.publicKey : "",
                    signature:
                      typeof raw.signature === "string" ? raw.signature : "",
                    address: String(addressFallback),
                    createdAt: raw.timestamp || item.timestamp || Date.now(),
                    updatedAt: Date.now(),
                    rawData,
                  };
                });

              set({
                accounts: fetchedAccounts,
                activeAccountId: fetchedAccounts.length > 0
                  ? fetchedAccounts[0].id
                  : null,
              });
            } else {
              set({ accounts: [], activeAccountId: null });
            }
          } catch {
            // Don't throw - we don't want to break the app if server is unavailable
          }
        },

        // Clear all accounts
        clearAllAccounts: (): void => {
          set({
            accounts: [],
            activeAccountId: null,
          });
        },
      }),
      {
        name: "accounts-store",
        partialize: (state) => ({
          accounts: state.accounts,
          activeAccountId: state.activeAccountId,
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            state._hasHydrated = true;
          }
        },
      },
    ),
    {
      name: "accounts_store_01",
    },
  ),
);
