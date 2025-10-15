import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AccountRequest, SignedAccountRequest } from '@/lib/api-types';
import { sign, deterministicStringify, type Wallet } from '@/lib/gliesereum';

/**
 * Account with signature information
 */
export interface StoredAccount extends SignedAccountRequest {
	id: string;
	createdAt: number;
	updatedAt: number;
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

					console.log('[Accounts] Account added:', accountId);
					return storedAccount;
				},

				// Update existing account
				updateAccount: (id: string, updates: Partial<AccountRequest>, wallet: Wallet): boolean => {
					const { accounts } = get();
					const accountIndex = accounts.findIndex((acc) => acc.id === id);

					if (accountIndex === -1) {
						console.error('[Accounts] Account not found:', id);
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
					console.log('[Accounts] Account updated:', id);
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
					console.log('[Accounts] Account removed:', id);
				},

				// Set active account
				setActiveAccount: (id: string): void => {
					const { accounts } = get();
					const account = accounts.find((acc) => acc.id === id);
					if (account) {
						set({ activeAccountId: id });
						console.log('[Accounts] Active account set:', id);
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

					console.log('[Accounts] Transaction signed');
					return signedTransaction;
				},

				// Send account to server
				sendAccountToServer: async (account: AccountRequest, wallet: Wallet, session: string, apiUrl: string): Promise<boolean> => {
					try {
						// Sign the account data
						const dataString = deterministicStringify(account);
						const signature = sign(dataString, wallet.privateKey);

						// Create the WebFix payload
						const payload: SetAccountPayload = {
							webfix: "1.0",
							method: "setAccount",
							params: ["gliesereum"],
							body: {
								account: account,
								publicKey: wallet.publicKey,
								address: wallet.address,
								signature: signature,
							},
						};

						console.log('[Accounts] Sending account to server:', payload);

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
						console.log('[Accounts] Server response:', result);

						return true;
					} catch (error) {
						console.error('[Accounts] Failed to send account to server:', error);
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

						console.log('[Accounts] Fetching accounts from server:', payload);

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
						console.log('[Accounts] Server response:', result);

						// Process the accounts from server
						// Server returns array of objects with 'raw' field containing account data
						if (Array.isArray(result) && result.length > 0) {
							// Clear existing accounts and load from server
							set({ accounts: [] });

							// Add each account from server
							const fetchedAccounts: StoredAccount[] = result
								.filter((item) => item.raw) // Only items with raw data
								.map((item) => {
									const rawAccount = item.raw;
									const accountId = rawAccount.nid || generateAccountId();
									
									// Construct AccountRequest from raw data
									const accountRequest: AccountRequest = {
										id: accountId,
										nid: rawAccount.nid,
										connection: rawAccount.connection ?? true,
										exchange: rawAccount.exchange,
										note: rawAccount.note || '',
										apiKey: rawAccount.apiKey || '',
										secret: rawAccount.secret || '',
										status: 'active', // Default status
										password: rawAccount.password || '',
										viewers: rawAccount.viewers || [],
										protocol: rawAccount.protocol,
										workers: rawAccount.workers,
									};

									// Create StoredAccount structure
									return {
										id: accountId,
										account: accountRequest,
										publicKey: rawAccount.publicKey,
										signature: rawAccount.signature,
										address: rawAccount.address,
										createdAt: rawAccount.timestamp || Date.now(),
										updatedAt: Date.now(),
									};
								});

							set({ 
								accounts: fetchedAccounts,
								activeAccountId: fetchedAccounts.length > 0 ? fetchedAccounts[0].id : null,
							});

							console.log('[Accounts] Loaded', fetchedAccounts.length, 'accounts from server');
						} else {
							console.log('[Accounts] No accounts found on server');
							set({ accounts: [], activeAccountId: null });
						}
					} catch (error) {
						console.error('[Accounts] Failed to fetch accounts from server:', error);
						// Don't throw - we don't want to break the app if server is unavailable
					}
				},

				// Clear all accounts
				clearAllAccounts: (): void => {
					set({
						accounts: [],
						activeAccountId: null,
					});
					console.log('[Accounts] All accounts cleared');
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
						console.log('[Accounts] Store hydrated from localStorage');
					}
				},
			}
		),
		{
			name: 'accounts_store_01',
		}
	)
);

