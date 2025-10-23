import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	SimpleDropdown,
	SimpleDropdownItem,
	SimpleDropdownSeparator,
} from "@/components/ui/simple-dropdown";
import {
	AlertCircle,
	CheckCircle,
	ChevronDown,
	LogOut,
	Network,
	Shield,
} from "lucide-react";
import { useAuthStore } from "@/stores/modules/auth.store";
import { motion } from "framer-motion";

/**
 * Simple connection status component using custom dropdown
 */
export function ConnectionStatusSimple(): React.ReactElement {
	const {
		connectionSession,
		wallet,
		isConnected,
		disconnectFromNode,
		resetAuth,
	} = useAuthStore();

	const handleDisconnect = async (): Promise<void> => {
		await disconnectFromNode();
	};

	const handleLogout = async (): Promise<void> => {
		await resetAuth();
	};

	const getNetworkIcon = () => {
		if (!connectionSession) {
			return <AlertCircle className="h-4 w-4 text-destructive" />;
		}

		switch (connectionSession.network) {
			case "testnet":
				return <Shield className="h-4 w-4 text-primary" />;
			case "mainnet":
				return <Network className="h-4 w-4 text-accent-foreground" />;
			case "localnet":
				return <Network className="h-4 w-4 text-secondary-foreground" />;
			default:
				return <Network className="h-4 w-4 text-muted-foreground" />;
		}
	};

	const getNetworkColor = () => {
		if (!connectionSession) {
			return "bg-destructive/20 text-destructive border-destructive/30";
		}

		switch (connectionSession.network) {
			case "testnet":
				return "bg-primary/20 text-primary border-primary/30";
			case "mainnet":
				return "bg-accent text-accent-foreground border-accent-foreground/30";
			case "localnet":
				return "bg-secondary text-secondary-foreground border-secondary-foreground/30";
			default:
				return "bg-muted/20 text-muted-foreground border-border";
		}
	};

	if (!isConnected || !connectionSession || !wallet) {
		return (
			<div className="flex items-center gap-2">
				<AlertCircle className="h-4 w-4 text-destructive" />
				<span className="text-sm text-destructive">Not Connected</span>
			</div>
		);
	}

	return (
		<SimpleDropdown
			trigger={
				<motion.div whileTap={{ scale: 0.96 }}>
					<Button
						variant="ghost"
						size="sm"
						className="h-8 gap-2"
					>
						<motion.div
							animate={{
								scale: [1, 1.1, 1],
							}}
							transition={{
								duration: 2,
								repeat: Infinity,
								ease: "easeInOut",
							}}
						>
							{getNetworkIcon()}
						</motion.div>
						<div className="flex items-center gap-2">
							<span className="text-sm font-medium">
								{connectionSession.network}
							</span>
							<Badge
								variant="outline"
								className={`text-xs rounded ${getNetworkColor()}`}
							>
								{isConnected
									? (
										<>
											<CheckCircle className="h-3 w-3 mr-1" />
											Connected
										</>
									)
									: (
										<>
											<AlertCircle className="h-3 w-3 mr-1" />
											Disconnected
										</>
									)}
							</Badge>
						</div>
						<ChevronDown className="h-3 w-3" />
					</Button>
				</motion.div>
			}
			align="end"
			className="w-80 bg-card border-border"
		>
			<motion.div
				className="p-3 space-y-3"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3, delay: 0.1 }}
			>
				<motion.div
					className="space-y-2 p-3 bg-muted/50 border border-border rounded"
					initial={{ y: -5, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ duration: 0.3, delay: 0.15 }}
				>
					<div className="flex items-center gap-2">
						{getNetworkIcon()}
						<span className="font-medium">Network</span>
					</div>
					<div className="text-sm text-muted-foreground">
						{connectionSession.title} ({connectionSession.network})
					</div>
					<div className="text-xs font-mono text-muted-foreground">
						{connectionSession.api}
					</div>
				</motion.div>

				<motion.div
					className="space-y-2 p-3 bg-muted/50 border border-border rounded"
					initial={{ y: -5, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ duration: 0.3, delay: 0.2 }}
				>
					<div className="flex items-center gap-2">
						<Shield className="h-4 w-4 text-amber-500" />
						<span className="font-medium">Wallet</span>
					</div>
					<div className="text-xs font-mono text-muted-foreground break-all">
						{wallet.address}
					</div>
					<div className="text-xs text-muted-foreground">
						Card: {wallet.number}
					</div>
				</motion.div>

				{connectionSession.developer && (
					<motion.div
						className="flex items-center gap-2"
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ duration: 0.3, delay: 0.25 }}
					>
						<Badge
							variant="outline"
							className="text-xs rounded bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400"
						>
							Developer
						</Badge>
					</motion.div>
				)}
			</motion.div>

			<SimpleDropdownSeparator className="bg-border" />

			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3, delay: 0.3 }}
			>
				<SimpleDropdownItem
					onClick={handleDisconnect}
					className="text-orange-700 dark:text-orange-400 hover:text-orange-300"
				>
					<Network className="h-4 w-4 mr-2" />
					Disconnect
				</SimpleDropdownItem>

				<SimpleDropdownItem
					onClick={handleLogout}
					className="text-red-700 dark:text-red-400 hover:text-red-800 dark:text-red-300"
				>
					<LogOut className="h-4 w-4 mr-2" />
					Logout
				</SimpleDropdownItem>
			</motion.div>
		</SimpleDropdown>
	);
}
