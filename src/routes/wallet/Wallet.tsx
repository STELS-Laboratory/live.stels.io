import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	AlertCircle,
	CheckCircle,
	History,
	Key,
	Network,
	Send,
	Settings,
	Shield,
	Wallet,
} from "lucide-react";
import { useAuthStore } from "@/stores/modules/auth.store";
import { AuthTestPanel } from "@/components/auth/AuthTestPanel";

/**
 * Modern wallet component using the new authentication system
 */
export default function GliesereumWallet(): React.ReactElement {
	const {
		wallet,
		connectionSession,
		isConnected,
		disconnectFromNode,
		resetAuth,
	} = useAuthStore();

	const [showPrivateKey, setShowPrivateKey] = useState(false);
	const [privateKey, setPrivateKey] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<string>("overview");

	// If no wallet or not connected, show connection status
	if (!wallet || !isConnected || !connectionSession) {
		return (
			<div className="p-4">
				<div className="container mx-auto max-w-2xl">
					<Card className="bg-zinc-900/80 border-zinc-700/50">
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

	const handleDisconnect = async (): Promise<void> => {
		await disconnectFromNode();
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
				return <Network className="h-4 w-4 text-zinc-500" />;
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
				return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
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
					<p className="text-zinc-400">
						Your secure cryptocurrency wallet on {connectionSession.title}
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Left Column - Wallet Info */}
					<div className="lg:col-span-1 space-y-6">
						{/* Wallet Card */}
						<Card className="bg-zinc-900/80 border-zinc-700/50">
							<CardHeader className="text-center">
								<CardTitle className="flex items-center justify-center gap-2">
									<Wallet className="h-5 w-5 text-amber-500" />
									Wallet Connected
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<label className="text-xs text-zinc-400 uppercase tracking-wider">
										Address
									</label>
									<div className="font-mono text-sm text-zinc-300 bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50 break-all">
										{wallet.address}
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-xs text-zinc-400 uppercase tracking-wider">
										Card Number
									</label>
									<div className="font-mono text-sm text-zinc-300 bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
										{wallet.number}
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-xs text-zinc-400 uppercase tracking-wider">
										Public Key
									</label>
									<div className="font-mono text-xs text-zinc-400 bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50 break-all">
										{wallet.publicKey}
									</div>
								</div>

								<Separator className="bg-zinc-700/50" />

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
						<Card className="bg-zinc-900/80 border-zinc-700/50">
							<CardHeader>
								<CardTitle className="text-zinc-100 text-lg">
									Network Status
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-zinc-400">Network</span>
									<Badge className={`text-xs ${getNetworkColor()}`}>
										{getNetworkIcon()}
										<span className="ml-1">{connectionSession.network}</span>
									</Badge>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-zinc-400">Status</span>
									<Badge className="bg-green-500/20 text-green-400 border-green-500/30">
										<CheckCircle className="h-3 w-3 mr-1" />
										Connected
									</Badge>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-zinc-400">API</span>
									<span className="text-xs text-zinc-400 font-mono">
										{connectionSession.api}
									</span>
								</div>
								{connectionSession.developer && (
									<div className="flex items-center justify-between">
										<span className="text-zinc-400">Mode</span>
										<Badge variant="outline" className="text-xs">
											Developer
										</Badge>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Disconnect Button */}
						<Card className="bg-zinc-900/80 border-zinc-700/50">
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
					</div>

					{/* Right Column - Wallet Functions */}
					<div className="lg:col-span-2">
						<Tabs
							value={activeTab}
							onValueChange={setActiveTab}
							className="w-full"
						>
							<TabsList className="grid w-full grid-cols-4">
								<TabsTrigger
									value="overview"
									className="flex items-center gap-2"
								>
									<Wallet className="h-4 w-4" />
									Overview
								</TabsTrigger>
								<TabsTrigger value="send" className="flex items-center gap-2">
									<Send className="h-4 w-4" />
									Send
								</TabsTrigger>
								<TabsTrigger
									value="history"
									className="flex items-center gap-2"
								>
									<History className="h-4 w-4" />
									History
								</TabsTrigger>
								<TabsTrigger
									value="settings"
									className="flex items-center gap-2"
								>
									<Settings className="h-4 w-4" />
									Settings
								</TabsTrigger>
							</TabsList>

							<TabsContent value="overview" className="mt-6">
								<Card className="bg-zinc-900/80 border-zinc-700/50">
									<CardHeader>
										<CardTitle className="text-zinc-100">
											Wallet Overview
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/30">
												<div className="text-sm text-zinc-400">Balance</div>
												<div className="text-2xl font-bold text-amber-400">
													∞ TST
												</div>
												<div className="text-xs text-zinc-500">
													Test Network
												</div>
											</div>
											<div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/30">
												<div className="text-sm text-zinc-400">
													Transactions
												</div>
												<div className="text-2xl font-bold text-zinc-300">
													0
												</div>
												<div className="text-xs text-zinc-500">
													No transactions yet
												</div>
											</div>
										</div>

										<Alert>
											<CheckCircle className="h-4 w-4" />
											<AlertDescription>
												Your wallet is connected and ready to use. You can send
												transactions and manage your account.
											</AlertDescription>
										</Alert>
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="send" className="mt-6">
								<Card className="bg-zinc-900/80 border-zinc-700/50">
									<CardHeader>
										<CardTitle className="text-zinc-100">
											Send Transaction
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<Alert>
											<AlertCircle className="h-4 w-4" />
											<AlertDescription>
												Transaction sending functionality will be implemented
												here. For now, you can use the authentication system to
												connect to the network.
											</AlertDescription>
										</Alert>
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="history" className="mt-6">
								<Card className="bg-zinc-900/80 border-zinc-700/50">
									<CardHeader>
										<CardTitle className="text-zinc-100">
											Transaction History
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="text-center text-zinc-400 py-8">
											<div className="text-4xl mb-4">📭</div>
											<p>No transactions yet</p>
										</div>
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="settings" className="mt-6">
								<div className="space-y-6">
									<Card className="bg-zinc-900/80 border-zinc-700/50">
										<CardHeader>
											<CardTitle className="text-zinc-100">
												Wallet Settings
											</CardTitle>
										</CardHeader>
										<CardContent className="space-y-4">
											<div className="space-y-4">
												<div className="flex items-center justify-between">
													<span className="text-zinc-400">Network</span>
													<Badge className={`text-xs ${getNetworkColor()}`}>
														{connectionSession.network}
													</Badge>
												</div>
												<div className="flex items-center justify-between">
													<span className="text-zinc-400">Developer Mode</span>
													<Badge variant="outline" className="text-xs">
														{connectionSession.developer
															? "Enabled"
															: "Disabled"}
													</Badge>
												</div>
											</div>
										</CardContent>
									</Card>

									{/* Debug Panel - only show in development */}
									{connectionSession.developer && <AuthTestPanel />}
								</div>
							</TabsContent>
						</Tabs>
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
								<Alert variant="destructive">
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>
										<strong>Security Warning:</strong>{" "}
										Never share this private key with anyone. Anyone with this
										key can access your wallet and funds.
									</AlertDescription>
								</Alert>

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
		</div>
	);
}
