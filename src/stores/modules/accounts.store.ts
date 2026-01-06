import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { AccountRequest } from "@/lib/api-types";
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

        // Send account to server
        sendAccountToServer: async (
          account: AccountRequest,
          session: string,
          apiUrl: string,
        ): Promise<boolean> => {
          // Remove undefined/null optional fields before sending
          const accountForSending: AccountRequest = {
            nid: account.nid,
            connection: account.connection,
            exchange: account.exchange,
            note: account.note,
            apiKey: account.apiKey,
            secret: account.secret,
            status: account.status,
            ...(account.password && { password: account.password }),
            ...(account.protocol && { protocol: account.protocol }),
            ...(account.viewers && account.viewers.length > 0 &&
              { viewers: account.viewers }),
            ...(account.workers && account.workers.length > 0 &&
              { workers: account.workers }),
            ...(account.id && { id: account.id }),
          };

          // Send to server using WebfixApiClient
          const { WebfixApiClient } = await import("@/lib/webfix-api-client");
          const client = new WebfixApiClient(apiUrl);
          client.setSession(session);

          await client.request("setAccount", accountForSending, ["gliesereum"]);

          return true;
        },

        // Fetch accounts from server
        fetchAccountsFromServer: async (
          address: string,
          session: string,
          apiUrl: string,
        ): Promise<void> => {
          try {
            // Send to server using WebfixApiClient
            const { WebfixApiClient } = await import("@/lib/webfix-api-client");
            const client = new WebfixApiClient(apiUrl);
            client.setSession(session);

            const result = await client.request<AccountValue[]>(
              "listAccounts",
              { address },
              ["gliesereum"],
            );

            // Process the accounts from server
            // Server returns AccountValue[] where each item has channel, module, widget, raw fields
            // Module can be "balance" or other values, but not "account"
            // Credentials (apiKey, secret, password) are deleted for non-owners
            if (Array.isArray(result) && result.length > 0) {
              // Clear existing accounts and load from server
              set({ accounts: [] });

              // Add each account from server
              const fetchedAccounts: StoredAccount[] = result
                .filter((item: unknown): item is AccountValue => {
                  // Type guard: check if item matches AccountValue structure
                  return (
                    typeof item === "object" &&
                    item !== null &&
                    "raw" in item &&
                    typeof item.raw === "object" &&
                    item.raw !== null &&
                    "nid" in item.raw &&
                    "exchange" in item.raw &&
                    "address" in item.raw
                  );
                })
                .map((item: AccountValue) => {
                  const raw = item.raw;
                  const accountId = raw.nid || generateAccountId();

                  // Construct AccountRequest from raw data
                  // Note: apiKey/secret/password may be undefined for viewers
                  const accountRequest: AccountRequest = {
                    id: accountId,
                    nid: raw.nid,
                    connection: raw.connection ?? true,
                    exchange: raw.exchange,
                    note: raw.note || "",
                    apiKey: raw.apiKey || "", // Empty string if redacted (viewer)
                    secret: raw.secret || "", // Empty string if redacted (viewer)
                    status: raw.status || "active",
                    password: raw.password || undefined, // Only include if present
                    viewers: Array.isArray(raw.viewers)
                      ? raw.viewers
                      : undefined,
                    protocol: raw.protocol,
                    workers: Array.isArray(raw.workers)
                      ? raw.workers
                      : undefined,
                  };

                  // Create StoredAccount structure
                  // Server may return publicKey and signature in the response
                  // Store full raw data for detailed view
                  return {
                    id: accountId,
                    account: accountRequest,
                    publicKey: raw.publicKey || "", // Use from server response if available
                    signature: raw.signature || "", // Use from server response if available
                    address: raw.address || address, // Use raw address or fallback to request address
                    createdAt: raw.timestamp || item.timestamp || Date.now(),
                    updatedAt: Date.now(),
                    rawData: raw as AccountRawData, // Store full raw data
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
