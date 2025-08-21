import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { 
	createWallet, 
	importWallet, 
	// sign,
	// verify,
	validateAddress,
	type Wallet,
	type Transaction 
} from '@/lib/gliesereum'

/**
 * Wallet state interface
 */
export interface WalletState {
	// Current wallet
	currentWallet: Wallet | null
	
	// Wallet operations
	createNewWallet: () => void
	importExistingWallet: (privateKey: string) => Promise<boolean>
	exportPrivateKey: () => string | null
	validateWalletAddress: (address: string) => boolean
	
	// Transaction management
	transactions: Transaction[]
	addTransaction: (transaction: Transaction) => void
	updateTransactionStatus: (hash: string, status: Transaction['status']) => void
	
	// Security
	isUnlocked: boolean
	unlockWallet: (biometric?: string) => void
	lockWallet: () => void
	logoutWallet: () => void
	
	// UI state
	isLoading: boolean
	error: string | null
	setError: (error: string | null) => void
	clearError: () => void
}

/**
 * Zustand store for wallet state management
 */
export const useWalletStore = create<WalletState>()(
	devtools(
		persist(
			(set, get) => ({
				// Initial state
				currentWallet: null,
				transactions: [],
				isUnlocked: false,
				isLoading: false,
				error: null,
				
				// Wallet operations
				createNewWallet: () => {
					set({ isLoading: true, error: null })
					try {
						const wallet = createWallet()
						set({ 
							currentWallet: wallet,
							isUnlocked: true,
							isLoading: false 
						})
					} catch (error) {
						set({ 
							error: error instanceof Error ? error.message : 'Failed to create wallet',
							isLoading: false 
						})
					}
				},
				
				importExistingWallet: async (privateKey: string): Promise<boolean> => {
					set({ isLoading: true, error: null })
					try {
						const wallet = importWallet(privateKey)
						set({ 
							currentWallet: wallet,
							isUnlocked: true,
							isLoading: false 
						})
						return true
					} catch (error) {
						set({ 
							error: error instanceof Error ? error.message : 'Invalid private key',
							isLoading: false 
						})
						return false
					}
				},
				
				exportPrivateKey: (): string | null => {
					const { currentWallet, isUnlocked } = get()
					if (!currentWallet || !isUnlocked) {
						return null
					}
					return currentWallet.privateKey
				},
				
				validateWalletAddress: (address: string): boolean => {
					return validateAddress(address)
				},
				
				// Transaction management
				addTransaction: (transaction: Transaction) => {
					const { transactions } = get()
					set({ transactions: [transaction, ...transactions] })
				},
				
				updateTransactionStatus: (hash: string, status: Transaction['status']) => {
					const { transactions } = get()
					const updatedTransactions = transactions.map(tx => 
						tx.hash === hash ? { ...tx, status } : tx
					)
					set({ transactions: updatedTransactions })
				},
				
				// Security
				unlockWallet: () => {
					const { currentWallet } = get()
					if (currentWallet) {
						set({ isUnlocked: true })
					}
				},
				
				lockWallet: () => {
					set({ isUnlocked: false })
				},
				
				logoutWallet: () => {
					set({ 
						currentWallet: null,
						isUnlocked: false,
						transactions: [],
						isLoading: false,
						error: null
					})
				},
				
				// UI state
				setError: (error: string | null) => set({ error }),
				clearError: () => set({ error: null }),
			}),
			{
				name: 'gliesereum_wallet',
				partialize: (state) => ({
					currentWallet: state.currentWallet,
					transactions: state.transactions,
					// Don't persist sensitive data like isUnlocked
				})
			}
		)
	)
)
