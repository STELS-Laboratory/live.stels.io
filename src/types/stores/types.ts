/**
 * Store-related type definitions
 */

import type {
  AccountRequest,
  ProtocolData,
  SignedAccountRequest,
} from "@/lib/api-types";

/**
 * Server response format for account list
 */
export interface AccountValue {
  channel: string;
  module: string;
  widget: string;
  raw: {
    address: string;
    nid: string;
    exchange: string;
    signature?: string;
    publicKey?: string;
    apiKey?: string;
    secret?: string;
    password?: string;
    note?: string;
    viewers?: string[];
    workers?: string[];
    protocol?: ProtocolData;
    connection?: boolean;
    status?: "active" | "learn" | "stopped";
    timestamp?: number;
    wallet?: unknown;
    [id: string]: unknown;
  };
  timestamp: number;
}

/**
 * Full raw account data from server
 */
export interface AccountRawData {
  address: string;
  nid: string;
  exchange: string;
  signature?: string;
  publicKey?: string;
  apiKey?: string;
  secret?: string;
  password?: string;
  note?: string;
  viewers?: string[];
  workers?: string[];
  protocol?: ProtocolData;
  connection?: boolean;
  status?: "active" | "learn" | "stopped";
  timestamp?: number;
  wallet?: {
    info?: {
      retCode?: string;
      retMsg?: string;
      result?: {
        list?: Array<{
          accountType?: string;
          totalEquity?: string;
          totalWalletBalance?: string;
          coin?: Array<{
            coin: string;
            equity?: string;
            walletBalance?: string;
            usdValue?: string;
            free?: string;
            used?: string;
            total?: string;
            [customKey: string]: unknown;
          }>;
          [customKey: string]: unknown;
        }>;
      };
      [customKey: string]: unknown;
    };
    timestamp?: number;
    datetime?: string;
    [crypto: string]: {
      free?: number;
      used?: number;
      total?: number;
      debt?: number;
    } | unknown;
  };
  [id: string]: unknown;
}

/**
 * Account with signature information
 */
export interface StoredAccount extends SignedAccountRequest {
  id: string;
  createdAt: number;
  updatedAt: number;
  rawData?: AccountRawData;
}

/**
 * Accounts state interface
 */
export interface AccountsState {
  accounts: StoredAccount[];
  activeAccountId: string | null;
  _hasHydrated: boolean;
}

/**
 * WebFix payload for setAccount
 */
export interface SetAccountPayload {
  webfix: string;
  method: string;
  params: string[];
  body: SignedAccountRequest;
}

/**
 * Accounts actions interface
 */
export interface AccountsActions {
  addAccount: (account: AccountRequest) => StoredAccount;
  updateAccount: (id: string, account: Partial<AccountRequest>) => boolean;
  removeAccount: (id: string) => void;
  setActiveAccount: (id: string) => void;
  getAccount: (id: string) => StoredAccount | undefined;
  getActiveAccount: () => StoredAccount | undefined;
  sendAccountToServer: (
    account: AccountRequest,
    session: string,
    apiUrl: string,
  ) => Promise<boolean>;
  fetchAccountsFromServer: (
    address: string,
    session: string,
    apiUrl: string,
  ) => Promise<void>;
  clearAllAccounts: () => void;
}

/**
 * Combined accounts store type
 */
export type AccountsStore = AccountsState & AccountsActions;
