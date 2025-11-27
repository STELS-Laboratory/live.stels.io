import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AccountRequest, SignedAccountRequest, ProtocolData } from '@/lib/api-types';
import { sign, verify, deterministicStringify, getUncompressedPublicKey, getAddressFromPublicKey, type Wallet } from '@/lib/gliesereum';

/**
 * Server response format for account list
 */
interface AccountValue {
	channel: string;
	module: string;
	widget: string;
	raw: {
		address: string;
		nid: string;
		exchange: string;
		signature?: string;
		publicKey?: string;
		apiKey?: string; // Only present for account owners, deleted for viewers
		secret?: string; // Only present for account owners, deleted for viewers
		password?: string; // Only present for account owners, deleted for viewers
		note?: string;
		viewers?: string[];
		workers?: string[];
		protocol?: ProtocolData;
		connection?: boolean;
		status?: "active" | "learn" | "stopped";
		timestamp?: number;
		wallet?: unknown; // Balance data from exchange
		[id: string]: unknown; // Allow other fields
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
	rawData?: AccountRawData; // Full raw data from server for detailed view
}

/**
 * Transaction signing request
 */
export interface TransactionRequest {
	to: string;
	amount: number;
	fee: number;
	data?: string;
}

/**
 * Signed transaction result
 */
export interface SignedTransaction {
	from: string;
	to: string;
	amount: number;
	fee: number;
	timestamp: number;
	data?: string;
	signature: string;
	publicKey: string;
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
	addAccount: (account: AccountRequest, wallet: Wallet) => StoredAccount;
	updateAccount: (id: string, account: Partial<AccountRequest>, wallet: Wallet) => boolean;
	removeAccount: (id: string) => void;
	setActiveAccount: (id: string) => void;
	getAccount: (id: string) => StoredAccount | undefined;
	getActiveAccount: () => StoredAccount | undefined;
	signTransaction: (request: TransactionRequest, wallet: Wallet) => SignedTransaction;
	sendAccountToServer: (account: AccountRequest, wallet: Wallet, session: string, apiUrl: string) => Promise<boolean>;
	fetchAccountsFromServer: (address: string, session: string, apiUrl: string) => Promise<void>;
	clearAllAccounts: () => void;
}

/**
 * Combined accounts store type
 */
export type AccountsStore = AccountsState & AccountsActions;

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

				// Add new account with signature
				addAccount: (account: AccountRequest, wallet: Wallet): StoredAccount => {
					const accountId = generateAccountId();
					const accountWithId: AccountRequest = {
						...account,
						id: accountId,
					};

					// Sign the account data
					const dataString = deterministicStringify(accountWithId);
					const signature = sign(dataString, wallet.privateKey);

					const storedAccount: StoredAccount = {
						account: accountWithId,
						publicKey: wallet.publicKey,
						signature: signature,
						address: wallet.address,
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
				updateAccount: (id: string, updates: Partial<AccountRequest>, wallet: Wallet): boolean => {
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

					// Re-sign the updated account
					const dataString = deterministicStringify(updatedAccount);
					const signature = sign(dataString, wallet.privateKey);

					const updatedStoredAccount: StoredAccount = {
						...existingAccount,
						account: updatedAccount,
						signature: signature,
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

				// Sign a transaction
				signTransaction: (request: TransactionRequest, wallet: Wallet): SignedTransaction => {
					const transaction = {
						from: wallet.address,
						to: request.to,
						amount: request.amount,
						fee: request.fee,
						timestamp: Date.now(),
						data: request.data,
					};

					const dataString = deterministicStringify(transaction);
					const signature = sign(dataString, wallet.privateKey);

					const signedTransaction: SignedTransaction = {
						...transaction,
						signature: signature,
						publicKey: wallet.publicKey,
					};

					return signedTransaction;
				},

				// Send account to server
				sendAccountToServer: async (account: AccountRequest, wallet: Wallet, session: string, apiUrl: string): Promise<boolean> => {
					try {
						// CRITICAL: Remove undefined/null optional fields before signing
						// Per gls-det-1 spec: missing keys are NOT serialized (absence, not null)
						// Server may not include these fields, causing signature mismatch
						const accountForSigning: AccountRequest = {
							nid: account.nid,
							connection: account.connection,
							exchange: account.exchange,
							note: account.note,
							apiKey: account.apiKey,
							secret: account.secret,
							status: account.status,
							...(account.password && { password: account.password }),
							...(account.protocol && { protocol: account.protocol }),
							...(account.viewers && account.viewers.length > 0 && { viewers: account.viewers }),
							...(account.workers && account.workers.length > 0 && { workers: account.workers }),
							...(account.id && { id: account.id }),
						};

						// CRITICAL: According to original example, use COMPRESSED public key (66 chars)
						// Example: "publicKey": "03892f1c484b14f551c61fa997bb647fdfe84fabb48bc868696b07813e700ab631"
						// Server checks: getAddress(hexToUint8Array(publicKey)) === address
						// Server verifies: verify(dataString, signature, publicKey)
						const dataString = deterministicStringify(accountForSigning);
						const signature = sign(dataString, wallet.privateKey);

						// LOCAL VERIFICATION: Verify signature before sending

						const isValidCompressed = verify(dataString, signature, wallet.publicKey);
						const isValidUncompressed = verify(dataString, signature, getUncompressedPublicKey(wallet.privateKey));

						// Verify address matches publicKey (server does this check)
						const addressFromCompressed = getAddressFromPublicKey(wallet.publicKey);
						getAddressFromPublicKey(getUncompressedPublicKey(wallet.privateKey));

						if (!isValidCompressed && !isValidUncompressed) {
							throw new Error('Local signature verification failed for both compressed and uncompressed keys');
						}

						// CRITICAL: Original example uses COMPRESSED public key (66 chars)
						// Server code shows: getAddress(hexToUint8Array(publicKey)) and verify(dataString, signature, publicKey)
						// Both functions should work with compressed key
						// If compressed works locally AND address matches, use compressed (as per original example)
						// Otherwise fallback to uncompressed
						const uncompressedPublicKey = getUncompressedPublicKey(wallet.privateKey);
						
						// Try compressed first (matches original example)
						const publicKeyToUse = isValidCompressed && addressFromCompressed === wallet.address
							? wallet.publicKey // Use compressed (66 chars) as in original example
							: uncompressedPublicKey; // Fallback to uncompressed if compressed doesn't work

						// Re-verify with selected key format
						const finalVerification = verify(dataString, signature, publicKeyToUse);
						const finalAddress = getAddressFromPublicKey(publicKeyToUse);

						if (!finalVerification || finalAddress !== wallet.address) {

							throw new Error('Selected public key format failed verification');
						}

						// Create the WebFix payload
						// Use accountForSigning (without undefined fields) for consistency
						const payload: SetAccountPayload = {
							webfix: "1.0",
							method: "setAccount",
							params: ["gliesereum"],
							body: {
								account: accountForSigning, // Use cleaned account (same as what we signed)
								publicKey: publicKeyToUse,
								address: wallet.address,
								signature: signature,
							},
						};

						// CRITICAL: Simulate what server will do to verify signature

						// What server will see
						const serverAccountString = deterministicStringify(accountForSigning);

						if (serverAccountString !== dataString) {
							// String mismatch detected
						}

						// Send to server with session header
						const response = await fetch(apiUrl, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								'Stels-Session': session,
							},
							body: JSON.stringify(payload),
						});

						if (!response.ok) {
							const errorText = await response.text();

							throw new Error(`Server responded with status: ${response.status}: ${errorText}`);
						}

						await response.json();

						return true;
					} catch {

						throw error;
					}
				},

				// Fetch accounts from server
				fetchAccountsFromServer: async (address: string, session: string, apiUrl: string): Promise<void> => {
					try {
						// Create the WebFix payload
						const payload = {
							webfix: "1.0",
							method: "listAccounts",
							params: ["gliesereum"],
							body: {
								address: address,
							},
						};

						// Send to server with session header
						const response = await fetch(apiUrl, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								'Stels-Session': session,
							},
							body: JSON.stringify(payload),
						});

						if (!response.ok) {
							throw new Error(`Server responded with status: ${response.status}`);
						}

						const result = await response.json();

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
										typeof item === 'object' &&
										item !== null &&
										'raw' in item &&
										typeof item.raw === 'object' &&
										item.raw !== null &&
										'nid' in item.raw &&
										'exchange' in item.raw &&
										'address' in item.raw
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
										note: raw.note || '',
										apiKey: raw.apiKey || '', // Empty string if redacted (viewer)
										secret: raw.secret || '', // Empty string if redacted (viewer)
										status: raw.status || 'active',
										password: raw.password || undefined, // Only include if present
										viewers: Array.isArray(raw.viewers) ? raw.viewers : undefined,
										protocol: raw.protocol,
										workers: Array.isArray(raw.workers) ? raw.workers : undefined,
									};

									// Create StoredAccount structure
									// Server may return publicKey and signature in the response
									// Store full raw data for detailed view
									return {
										id: accountId,
										account: accountRequest,
										publicKey: raw.publicKey || '', // Use from server response if available
										signature: raw.signature || '', // Use from server response if available
										address: raw.address || address, // Use raw address or fallback to request address
										createdAt: raw.timestamp || item.timestamp || Date.now(),
										updatedAt: Date.now(),
										rawData: raw as AccountRawData, // Store full raw data
									};
								});

							set({ 
								accounts: fetchedAccounts,
								activeAccountId: fetchedAccounts.length > 0 ? fetchedAccounts[0].id : null,
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
				name: 'accounts-store',
				partialize: (state) => ({
					accounts: state.accounts,
					activeAccountId: state.activeAccountId,
				}),
				onRehydrateStorage: () => (state) => {
					if (state) {
						state._hasHydrated = true;

					}
				},
			}
		),
		{
			name: 'accounts_store_01',
		}
	)
);
