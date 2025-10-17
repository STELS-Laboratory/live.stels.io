import React, { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs.tsx";
import {
	AlertCircle,
	CheckCircle,
	Edit,
	FileSignature,
	Key,
	Network,
	Plus,
	Shield,
	Trash2,
	Wallet,
} from "lucide-react";
import { useAuthStore } from "@/stores/modules/auth.store.ts";
import { useAccountsStore } from "@/stores/modules/accounts.store.ts";
import AddAccountDialog from "./AddAccountDialog";
import SignTransactionDialog from "./SignTransactionDialog";

/**
 * Modern Wallet component with account management and transaction signing
 */
export default function GliesereumWallet(): React.ReactElement {
	const {
		wallet,
		connectionSession,
		isConnected,
		resetAuth,
		setShowSecurityWarning,
	} = useAuthStore();

	const {
		accounts,
		activeAccountId,
		setActiveAccount,
		removeAccount,
		fetchAccountsFromServer,
	} = useAccountsStore();

	const [showPrivateKey, setShowPrivateKey] = useState(false);
	const [privateKey, setPrivateKey] = useState<string | null>(null);
	const [showAddAccountDialog, setShowAddAccountDialog] = useState(false);
	const [showSignTransactionDialog, setShowSignTransactionDialog] = useState(
		false,
	);
	const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

	// Fetch accounts from server on wallet connection
	useEffect(() => {
		if (wallet && connectionSession && isConnected) {
			const loadAccounts = async (): Promise<void> => {
				setIsLoadingAccounts(true);
				try {
					await fetchAccountsFromServer(
						wallet.address,
						connectionSession.session,
						connectionSession.api,
					);
				} catch (error) {
					console.error("[Wallet] Failed to load accounts:", error);
				} finally {
					setIsLoadingAccounts(false);
				}
			};

			loadAccounts();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		wallet?.address,
		connectionSession?.session,
		connectionSession?.api,
		isConnected,
		fetchAccountsFromServer,
	]);

	// If no Wallet or not connected, show connection status
	if (!wallet || !isConnected || !connectionSession) {
		return (
			<div className="p-4">
				<div className="container mx-auto max-w-2xl">
					<Card className="bg-card/80 border-border/50">
						<CardHeader className="text-center">
							<CardTitle className="flex items-center justify-center gap-2">
								<AlertCircle className="h-5 w-5 text-red-500" />
								Wallet Not Connected
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<Alert variant="destructive">
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>
									You need to connect your wallet and authenticate with the
									network first.
								</AlertDescription>
							</Alert>
							<Button
								onClick={resetAuth}
								className="w-full"
							>
								<Network className="h-4 w-4 mr-2" />
								Go to Authentication
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	const handleShowPrivateKey = (): void => {
		if (!wallet) return;
		setPrivateKey(wallet.privateKey);
		setShowPrivateKey(true);
	};

	const handleClosePrivateKey = (): void => {
		setShowPrivateKey(false);
		setPrivateKey(null);
	};

	const handleDisconnect = (): void => {
		setShowSecurityWarning(true);
	};

	const handleRemoveAccount = (id: string): void => {
		if (window.confirm("Are you sure you want to remove this account?")) {
			removeAccount(id);
		}
	};

	const getNetworkIcon = () => {
		if (!connectionSession) {
			return <AlertCircle className="h-4 w-4 text-red-500" />;
		}

		switch (connectionSession.network) {
			case "testnet":
				return <Shield className="h-4 w-4 text-blue-500" />;
			case "mainnet":
				return <Network className="h-4 w-4 text-green-500" />;
			case "localnet":
				return <Network className="h-4 w-4 text-purple-500" />;
			default:
				return <Network className="h-4 w-4 text-muted-foreground" />;
		}
	};

	const getNetworkColor = () => {
		if (!connectionSession) {
			return "bg-red-500/20 text-red-400 border-red-500/30";
		}

		switch (connectionSession.network) {
			case "testnet":
				return "bg-blue-500/20 text-blue-400 border-blue-500/30";
			case "mainnet":
				return "bg-green-500/20 text-green-400 border-green-500/30";
			case "localnet":
				return "bg-purple-500/20 text-purple-400 border-purple-500/30";
			default:
				return "bg-zinc-500/20 text-muted-foreground border-zinc-500/30";
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "active":
				return "bg-green-500/20 text-green-400 border-green-500/30";
			case "learn":
				return "bg-blue-500/20 text-blue-400 border-blue-500/30";
			case "stopped":
				return "bg-red-500/20 text-red-400 border-red-500/30";
			default:
				return "bg-zinc-500/20 text-muted-foreground border-zinc-500/30";
		}
	};

	return (
		<div className="p-4">
			<div className="container mx-auto max-w-6xl">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-foreground mb-2">
						Gliesereum Wallet
					</h1>
					<p className="text-muted-foreground">
						Your secure cryptocurrency wallet on {connectionSession.title}
					</p>
				</div>

				<Tabs defaultValue="wallet" className="space-y-6">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="wallet">Wallet</TabsTrigger>
						<TabsTrigger value="accounts">
							Accounts
							{accounts.length > 0 && (
								<Badge variant="secondary" className="ml-2 text-xs">
									{accounts.length}
								</Badge>
							)}
						</TabsTrigger>
						<TabsTrigger value="transactions">Transactions</TabsTrigger>
					</TabsList>

					{/* Wallet Tab */}
					<TabsContent value="wallet" className="space-y-6">
						{/* Balance Card */}
						<div className="bg-card p-6 border">
							<div className="text-muted-foreground text-xl">
								Balance
							</div>
							<div className="text-right font-bold ml-2 text-xl text-amber-800">
								TST
							</div>
							<div className="text-6xl text-right font-bold font-mono text-zinc-700">
								0.0000
							</div>
							<div className="text-green-500 text-right">
								Price: 0.00$
							</div>
						</div>

						{/* Wallet Card */}
						<Card className="bg-card/80 border-border/50">
							<CardHeader className="text-center">
								<CardTitle className="flex items-center justify-center gap-2">
									<Wallet className="h-5 w-5 text-amber-500" />
									Wallet Connected
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<label className="text-xs text-muted-foreground uppercase tracking-wider">
										Address
									</label>
									<div className="font-mono text-sm text-card-foreground bg-muted/50 rounded-lg p-3 border border-border/50 break-all">
										{wallet.address}
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-xs text-muted-foreground uppercase tracking-wider">
										Card Number
									</label>
									<div className="font-mono text-sm text-card-foreground bg-muted/50 rounded-lg p-3 border border-border/50">
										{wallet.number}
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-xs text-muted-foreground uppercase tracking-wider">
										Public Key
									</label>
									<div className="font-mono text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 border border-border/50 break-all">
										{wallet.publicKey}
									</div>
								</div>

								<Separator className="bg-secondary/50" />

								<div className="flex gap-2">
									<Button
										onClick={handleShowPrivateKey}
										variant="outline"
										size="sm"
										className="flex-1"
									>
										<Key className="h-4 w-4 mr-2" />
										View Key
									</Button>
								</div>
							</CardContent>
						</Card>

						{/* Network Status */}
						<Card className="bg-card/80 border-border/50">
							<CardHeader>
								<CardTitle className="text-foreground text-lg">
									Network Status
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">Network</span>
									<Badge className={`text-xs ${getNetworkColor()}`}>
										{getNetworkIcon()}
										<span className="ml-1">{connectionSession.network}</span>
									</Badge>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">Status</span>
									<Badge className="bg-green-500/20 text-green-400 border-green-500/30">
										<CheckCircle className="h-3 w-3 mr-1" />
										Connected
									</Badge>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">API</span>
									<span className="text-xs text-muted-foreground font-mono">
										{connectionSession.api}
									</span>
								</div>
								{connectionSession.developer && (
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">Mode</span>
										<Badge variant="outline" className="text-xs">
											Developer
										</Badge>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Disconnect Button */}
						<Card className="bg-card/80 border-border/50">
							<CardContent className="p-4">
								<Button
									onClick={handleDisconnect}
									variant="outline"
									className="w-full bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20 hover:text-red-200"
								>
									Disconnect Wallet
								</Button>
							</CardContent>
						</Card>
					</TabsContent>

					{/* Accounts Tab */}
					<TabsContent value="accounts" className="space-y-4">
						<div className="flex justify-between items-center">
							<h2 className="text-xl font-semibold text-foreground">
								Exchange Accounts
							</h2>
							<Button
								onClick={() => setShowAddAccountDialog(true)}
								size="sm"
								className="bg-amber-500 hover:bg-amber-600 text-zinc-900"
							>
								<Plus className="h-4 w-4 mr-2" />
								Add Account
							</Button>
						</div>

						{isLoadingAccounts
							? (
								<Card className="bg-card/80 border-border/50">
									<CardContent className="p-8 text-center">
										<div className="flex flex-col items-center gap-4">
											<div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full">
											</div>
											<p className="text-muted-foreground">
												Loading accounts from server...
											</p>
										</div>
									</CardContent>
								</Card>
							)
							: accounts.length === 0
							? (
								<Card className="bg-card/80 border-border/50">
									<CardContent className="p-8 text-center">
										<p className="text-muted-foreground mb-4">
											No exchange accounts configured yet.
										</p>
										<Button
											onClick={() => setShowAddAccountDialog(true)}
											variant="outline"
										>
											<Plus className="h-4 w-4 mr-2" />
											Add Your First Account
										</Button>
									</CardContent>
								</Card>
							)
							: (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{accounts.map((account) => {
										// Determine user role
										const isOwner = wallet &&
											account.address === wallet.address;
										const isViewer = wallet &&
											account.account.viewers?.includes(wallet.address);

										return (
											<Card
												key={account.id}
												className={`bg-card/80 border-border/50 cursor-pointer transition-all hover:border-amber-500/50 ${
													activeAccountId === account.id
														? "border-amber-500"
														: ""
												}`}
												onClick={() => setActiveAccount(account.id)}
											>
												<CardHeader>
													<CardTitle className="flex items-center justify-between">
														<div className="flex items-center gap-2">
															<span className="text-base capitalize">
																{account.account.exchange}
															</span>
															{isOwner && (
																<Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
																	Owner
																</Badge>
															)}
															{isViewer && !isOwner && (
																<Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
																	Viewer
																</Badge>
															)}
														</div>
														<Badge
															className={getStatusColor(account.account.status)}
														>
															{account.account.status}
														</Badge>
													</CardTitle>
												</CardHeader>
												<CardContent className="space-y-3">
													<div className="space-y-1">
														<label className="text-xs text-muted-foreground">
															Node ID
														</label>
														<div className="text-sm font-mono text-card-foreground truncate">
															{account.account.nid}
														</div>
													</div>

													<div className="space-y-1">
														<label className="text-xs text-muted-foreground">
															Owner Address
														</label>
														<div className="text-xs font-mono text-card-foreground truncate">
															{account.address}
														</div>
													</div>

													{account.account.note && (
														<div className="space-y-1">
															<label className="text-xs text-muted-foreground">
																Note
															</label>
															<div className="text-sm text-card-foreground">
																{account.account.note}
															</div>
														</div>
													)}

													{account.account.protocol && (
														<div className="space-y-1">
															<label className="text-xs text-muted-foreground">
																Strategy
															</label>
															<div className="text-sm text-card-foreground">
																{account.account.protocol.strategy}
															</div>
														</div>
													)}

													{account.account.viewers &&
														account.account.viewers.length > 0 && (
														<div className="space-y-1">
															<label className="text-xs text-muted-foreground">
																Viewers ({account.account.viewers.length})
															</label>
															<div className="text-xs font-mono text-card-foreground">
																{account.account.viewers.slice(0, 2).map((
																	viewer,
																	idx,
																) => (
																	<div key={idx} className="truncate">
																		{viewer}
																	</div>
																))}
																{account.account.viewers.length > 2 && (
																	<div className="text-xs text-muted-foreground">
																		+{account.account.viewers.length - 2} more
																	</div>
																)}
															</div>
														</div>
													)}

													<Separator className="bg-secondary/50" />

													<div className="flex gap-2">
														<Button
															variant="outline"
															size="sm"
															className="flex-1"
															disabled={!isOwner}
															onClick={(e) => {
																e.stopPropagation();
																// TODO: Implement edit functionality
															}}
														>
															<Edit className="h-3 w-3 mr-1" />
															Edit
														</Button>
														<Button
															variant="outline"
															size="sm"
															className="flex-1 text-red-400 hover:text-red-300"
															disabled={!isOwner}
															onClick={(e) => {
																e.stopPropagation();
																handleRemoveAccount(account.id);
															}}
														>
															<Trash2 className="h-3 w-3 mr-1" />
															Remove
														</Button>
													</div>

													<div className="text-xs text-muted-foreground text-center">
														Created:{" "}
														{new Date(account.createdAt).toLocaleDateString()}
													</div>
												</CardContent>
											</Card>
										);
									})}
								</div>
							)}
					</TabsContent>

					{/* Transactions Tab */}
					<TabsContent value="transactions" className="space-y-4">
						<div className="flex justify-between items-center">
							<h2 className="text-xl font-semibold text-foreground">
								Sign Transaction
							</h2>
							<Button
								onClick={() => setShowSignTransactionDialog(true)}
								size="sm"
								className="bg-amber-500 hover:bg-amber-600 text-zinc-900"
							>
								<FileSignature className="h-4 w-4 mr-2" />
								New Transaction
							</Button>
						</div>

						<Card className="bg-card/80 border-border/50">
							<CardContent className="p-8 text-center">
								<FileSignature className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
								<p className="text-muted-foreground mb-4">
									Sign transactions with your wallet's private key.
								</p>
								<Button
									onClick={() => setShowSignTransactionDialog(true)}
									variant="outline"
								>
									<FileSignature className="h-4 w-4 mr-2" />
									Create Signed Transaction
								</Button>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				{/* Private Key Modal */}
				{showPrivateKey && privateKey && (
					<div className="fixed inset-0 bg-black/80 dark:bg-black/80 flex items-center justify-center p-4 z-50">
						<Card className="bg-card/80 border-border/50 max-w-md w-full">
							<CardHeader>
								<CardTitle className="text-foreground text-center">
									Private Key
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<Alert variant="destructive">
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>
										<strong>Security Warning:</strong>{" "}
										Never share this private key with anyone. Anyone with this
										key can access your wallet and funds.
									</AlertDescription>
								</Alert>

								<div className="space-y-2">
									<label className="text-xs text-muted-foreground uppercase tracking-wider">
										Private Key
									</label>
									<div className="font-mono text-xs text-card-foreground bg-muted/50 rounded-lg p-3 border border-border/50 break-all">
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
										className="flex-1 bg-muted/50 border-border/50 text-card-foreground hover:bg-secondary/50"
									>
										Close
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				)}

				{/* Add Account Dialog */}
				<AddAccountDialog
					open={showAddAccountDialog}
					onOpenChange={setShowAddAccountDialog}
				/>

				{/* Sign Transaction Dialog */}
				<SignTransactionDialog
					open={showSignTransactionDialog}
					onOpenChange={setShowSignTransactionDialog}
				/>
			</div>
		</div>
	);
}
