import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { WalletCard } from "@/components/wallet/WalletCard";
import { WalletSetup } from "@/components/wallet/WalletSetup";
import { SendTransaction } from "@/components/wallet/SendTransaction";
import { TransactionList } from "@/components/wallet/TransactionList";
import { WalletAccounts } from "@/components/wallet/WalletAccounts";
import { useWalletStore } from "@/stores/modules/wallet.store";
import { type Transaction } from "@/lib/gliesereum";

/**
 * GliesereumWallet component for creating and managing cryptocurrency wallets
 * Features a beautiful card design as the main focus
 */
export default function GliesereumWallet() {
	const {
		currentWallet,
		isUnlocked,
		unlockWallet,
		lockWallet,
		logoutWallet,
		exportPrivateKey,
		transactions,
		clearError,
	} = useWalletStore();

	const [showPrivateKey, setShowPrivateKey] = useState(false);
	const [privateKey, setPrivateKey] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<
		"overview" | "send" | "transactions" | "accounts"
	>("overview");

	// Clear errors on component mount
	useEffect(() => {
		clearError();
	}, [clearError]);

	const handleExportPrivateKey = () => {
		const key = exportPrivateKey();
		if (key) {
			setPrivateKey(key);
			setShowPrivateKey(true);
		}
	};

	const handleClosePrivateKey = () => {
		setShowPrivateKey(false);
		setPrivateKey(null);
	};

	const handleTransactionSent = (transaction: Transaction) => {
		// Simulate transaction confirmation after 3 seconds
		setTimeout(() => {
			// In a real app, this would be updated based on blockchain confirmation
			console.log("Transaction confirmed:", transaction.hash);
		}, 3000);
	};

	const handleWalletCreated = () => {
		// Auto-unlock the wallet when created
		unlockWallet();
	};

	// If no wallet exists, show setup
	if (!currentWallet) {
		return (
			<div className="p-4">
				<div className="container mx-auto max-w-4xl">
					{/* Header */}
					<div className="text-center mb-8">
						<h1 className="text-3xl font-bold text-zinc-100 mb-2">
							Stels Network - Gliesereum Wallet
						</h1>
						<p className="text-zinc-400">
							Secure cryptocurrency wallet with beautiful card design
						</p>
					</div>

					{/* Setup Component */}
					<WalletSetup onWalletCreated={handleWalletCreated} />
				</div>
			</div>
		);
	}

	return (
		<div className="p-4">
			<div className="container mx-auto max-w-6xl">
				{/* Header */}
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-zinc-100 mb-2">
						Gliesereum Wallet
					</h1>
					<p className="text-zinc-400">
						Your secure cryptocurrency wallet
					</p>
				</div>

				{/* Main Content Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Left Column - Wallet Card (Main Focus) */}
					<div className="lg:col-span-1">
						<div className="sticky top-4">
							<WalletCard
								wallet={currentWallet}
								onExport={handleExportPrivateKey}
								onLock={isUnlocked ? lockWallet : unlockWallet}
							/>

							{/* Quick Stats */}
							<Card className="mt-6 bg-zinc-900/80 border-zinc-700/50">
								<CardHeader className="pb-3">
									<CardTitle className="text-zinc-100 text-lg">
										Quick Stats
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									<div className="flex justify-between items-center">
										<span className="text-zinc-400">Status</span>
										<Badge
											variant="secondary"
											className={isUnlocked
												? "bg-green-500/20 text-green-300 border-green-500/30"
												: "bg-red-500/20 text-red-300 border-red-500/30"}
										>
											{isUnlocked ? "Unlocked" : "Locked"}
										</Badge>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-zinc-400">Transactions</span>
										<span className="text-zinc-100 font-medium">
											{transactions.length}
										</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-zinc-400">Balance</span>
										<span className="text-zinc-100 font-medium">
											∞ GRH (TestNet)
										</span>
									</div>
								</CardContent>
							</Card>

							{/* Logout Button */}
							<Card className="mt-6 bg-zinc-900/80 border-zinc-700/50">
								<CardContent className="p-4">
									<Button
										onClick={logoutWallet}
										variant="outline"
										className="w-full bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20 hover:text-red-200"
									>
										Logout Wallet
									</Button>
								</CardContent>
							</Card>
						</div>
					</div>

					{/* Right Column - Actions and Transactions */}
					<div className="lg:col-span-2 space-y-6">
						{/* Tab Navigation */}
						<Card className="bg-zinc-900/80 border-zinc-700/50">
							<CardContent className="p-0">
								<div className="flex border-b border-zinc-700/50">
									<button
										onClick={() => setActiveTab("overview")}
										className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
											activeTab === "overview"
												? "text-amber-400 border-b-2 border-amber-400"
												: "text-zinc-400 hover:text-zinc-300"
										}`}
									>
										Overview
									</button>
									<button
										onClick={() => setActiveTab("send")}
										className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
											activeTab === "send"
												? "text-amber-400 border-b-2 border-amber-400"
												: "text-zinc-400 hover:text-zinc-300"
										}`}
									>
										Send
									</button>
									<button
										onClick={() => setActiveTab("transactions")}
										className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
											activeTab === "transactions"
												? "text-amber-400 border-b-2 border-amber-400"
												: "text-zinc-400 hover:text-zinc-300"
										}`}
									>
										Transactions
									</button>
									<button
										onClick={() => setActiveTab("accounts")}
										className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
											activeTab === "accounts"
												? "text-amber-400 border-b-2 border-amber-400"
												: "text-zinc-400 hover:text-zinc-300"
										}`}
									>
										Accounts
									</button>
								</div>
							</CardContent>
						</Card>

						{/* Tab Content */}
						{activeTab === "overview" && (
							<div className="space-y-6">
								{/* Wallet Information */}
								<Card className="bg-zinc-900/80 border-zinc-700/50">
									<CardHeader>
										<CardTitle className="text-zinc-100">
											Wallet Information
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="space-y-2">
												<label className="text-xs text-zinc-400 uppercase tracking-wider">
													Address
												</label>
												<div className="font-mono text-sm text-zinc-300 bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50 break-all">
													{currentWallet.address}
												</div>
											</div>
											<div className="space-y-2">
												<label className="text-xs text-zinc-400 uppercase tracking-wider">
													Card Number
												</label>
												<div className="font-mono text-sm text-zinc-300 bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
													{currentWallet.number}
												</div>
											</div>
										</div>

										<Separator className="bg-zinc-700/50" />

										<div className="space-y-2">
											<label className="text-xs text-zinc-400 uppercase tracking-wider">
												Public Key
											</label>
											<div className="font-mono text-xs text-zinc-400 bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50 break-all">
												{currentWallet.publicKey}
											</div>
										</div>
									</CardContent>
								</Card>

								{/* Recent Transactions Preview */}
								<Card className="bg-zinc-900/80 border-zinc-700/50">
									<CardHeader>
										<CardTitle className="text-zinc-100">
											Recent Transactions
										</CardTitle>
									</CardHeader>
									<CardContent>
										{transactions.length > 0
											? (
												<div className="space-y-3">
													{transactions.slice(0, 3).map((tx) => (
														<div
															key={tx.hash}
															className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/30"
														>
															<div className="flex items-center gap-3">
																<div className="w-2 h-2 rounded-full bg-amber-400" />
																<div>
																	<div className="text-sm text-zinc-300">
																		{tx.amount.toFixed(8)} GRH
																	</div>
																	<div className="text-xs text-zinc-500">
																		{new Date(tx.timestamp)
																			.toLocaleDateString()}
																	</div>
																</div>
															</div>
															<Badge
																variant="secondary"
																className={tx.status === "confirmed"
																	? "bg-green-500/20 text-green-300 border-green-500/30"
																	: tx.status === "pending"
																	? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
																	: "bg-red-500/20 text-red-300 border-red-500/30"}
															>
																{tx.status}
															</Badge>
														</div>
													))}
													{transactions.length > 3 && (
														<Button
															variant="outline"
															onClick={() => setActiveTab("transactions")}
															className="w-full bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/50"
														>
															View All Transactions
														</Button>
													)}
												</div>
											)
											: (
												<div className="text-center text-zinc-400 py-8">
													<div className="text-4xl mb-4">📭</div>
													<p>No transactions yet</p>
												</div>
											)}
									</CardContent>
								</Card>
							</div>
						)}

						{activeTab === "send" && (
							<SendTransaction onTransactionSent={handleTransactionSent} />
						)}

						{activeTab === "transactions" && (
							<TransactionList transactions={transactions} />
						)}

						{activeTab === "accounts" && <WalletAccounts />}
					</div>
				</div>
			</div>

			{/* Private Key Modal */}
			{showPrivateKey && privateKey && (
				<div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
					<Card className="bg-zinc-900/80 border-zinc-700/50 max-w-md w-full">
						<CardHeader>
							<CardTitle className="text-zinc-100 text-center">
								Private Key
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
								<div className="flex items-start gap-2">
									<div className="text-red-400 text-sm">⚠️</div>
									<div className="text-xs text-red-300">
										<strong>Security Warning:</strong>{" "}
										Never share this private key with anyone. Anyone with this
										key can access your wallet and funds.
									</div>
								</div>
							</div>

							<div className="space-y-2">
								<label className="text-xs text-zinc-400 uppercase tracking-wider">
									Private Key
								</label>
								<div className="font-mono text-xs text-zinc-300 bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50 break-all">
									{privateKey}
								</div>
							</div>

							<div className="flex gap-3">
								<Button
									onClick={() => navigator.clipboard.writeText(privateKey)}
									className="flex-1 bg-amber-500 hover:bg-amber-600 text-zinc-900"
								>
									Copy to Clipboard
								</Button>
								<Button
									variant="outline"
									onClick={handleClosePrivateKey}
									className="flex-1 bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/50"
								>
									Close
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
}
