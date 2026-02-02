/**
 * Store-related type definitions
 */

import type {
  AccountRequest,
  ListAccountsOptions,
  ProtocolData,
  SetAccountPayload,
  SignedAccountRequest,
} from "@/lib/api-types";

/** Encrypted credential from API (apiKey/secret when credentialsEncrypted) */
export interface EncryptedCredential {
  data: string;
  iv: string;
  salt: string;
  version: number;
}

/** Coin row from wallet.info.result.list[].coin[] (Bybit-style) */
export interface WalletCoinRow {
  coin: string;
  equity?: string | number;
  walletBalance?: string | number;
  usdValue?: string | number;
  unrealisedPnl?: string | number;
  cumRealisedPnl?: string | number;
  locked?: string | number;
  borrowAmount?: string | number;
  marginCollateral?: boolean;
  availableToWithdraw?: string;
  [k: string]: unknown;
}

/** Account summary from wallet.info.result.list[] (Bybit UNIFIED etc.) */
export interface WalletAccountSummary {
  accountType?: string;
  totalEquity?: string | number;
  totalWalletBalance?: string | number;
  totalAvailableBalance?: string | number;
  totalMarginBalance?: string | number;
  totalPerpUPL?: string | number;
  totalInitialMargin?: string | number;
  totalMaintenanceMargin?: string | number;
  accountIMRate?: string | number;
  accountMMRate?: string | number;
  accountLTV?: string | number;
  coin?: WalletCoinRow[];
  [k: string]: unknown;
}

/** wallet.info.result */
export interface WalletInfoResult {
  list?: WalletAccountSummary[];
  [k: string]: unknown;
}

/** wallet.info (retCode, retMsg, result, time) */
export interface WalletInfo {
  retCode?: string;
  retMsg?: string;
  result?: WalletInfoResult;
  time?: string;
  retExtInfo?: Record<string, unknown>;
}

/** Per-coin balance: wallet.BTC, wallet.SOL, ... */
export interface WalletCoinBalance {
  free?: number;
  used?: number;
  total?: number;
  debt?: number;
}

/**
 * wallet object from listAccounts raw (Bybit-style and similar)
 */
export interface AccountWalletData {
  info?: WalletInfo;
  timestamp?: number;
  datetime?: string;
  /** Per-coin: { free, used, total, debt } */
  free?: Record<string, number>;
  used?: Record<string, number>;
  total?: Record<string, number>;
  debt?: Record<string, number>;
  /** Dynamic keys: BTC, SOL, USDT, … → WalletCoinBalance */
  [crypto: string]: WalletCoinBalance | Record<string, number> | WalletInfo | number | string | undefined;
}

/**
 * Server response format for account list (listAccounts API)
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
    /** Plain string or encrypted { data, iv, salt, version } when credentialsEncrypted */
    apiKey?: string | EncryptedCredential;
    secret?: string | EncryptedCredential;
    password?: string;
    note?: string;
    viewers?: string[];
    workers?: string[];
    protocol?: ProtocolData;
    connection?: boolean;
    status?: "active" | "learn" | "stopped";
    timestamp?: number;
    credentialsEncrypted?: boolean;
    wallet?: AccountWalletData;
    [id: string]: unknown;
  };
  timestamp: number;
}

/**
 * Full raw account data from server (raw + channel/module/widget merged on fetch)
 */
export interface AccountRawData {
  address: string;
  nid: string;
  exchange: string;
  signature?: string;
  publicKey?: string;
  apiKey?: string | EncryptedCredential;
  secret?: string | EncryptedCredential;
  password?: string;
  note?: string;
  viewers?: string[];
  workers?: string[];
  protocol?: ProtocolData;
  connection?: boolean;
  status?: "active" | "learn" | "stopped";
  timestamp?: number;
  credentialsEncrypted?: boolean;
  /** From item: channel, module, widget */
  channel?: string;
  module?: string;
  widget?: string;
  wallet?: AccountWalletData;
  /** Normalized wallet in unified Bybit-like format (from backend) */
  normalizedWallet?: AccountWalletData;
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
    payload: SetAccountPayload,
    session: string,
    apiUrl: string,
    options?: { omitSecrets?: boolean },
  ) => Promise<boolean>;
  fetchAccountsFromServer: (
    session: string,
    apiUrl: string,
    options?: ListAccountsOptions,
  ) => Promise<void>;
  clearAllAccounts: () => void;
}

/**
 * Combined accounts store type
 */
export type AccountsStore = AccountsState & AccountsActions;
