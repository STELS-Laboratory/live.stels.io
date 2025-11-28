/**
 * Auth components type definitions
 */

/**
 * Developer access request types
 */
export type RequestStatus = "idle" | "pending" | "success" | "error";

export interface DeveloperAccessRequestProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * Wallet confirmation props
 */
export interface WalletConfirmationProps {
	wallet: {
		address: string;
		publicKey: string;
	};
	onConfirm: () => void;
	onCancel: () => void;
}

/**
 * Wallet creator props
 */
export interface WalletCreatorProps {
	onWalletCreated: (wallet: { address: string; publicKey: string; privateKey: string }) => void;
	onCancel: () => void;
}

/**
 * Wallet type selector props
 */
export interface WalletTypeSelectorProps {
	onSelectType: (type: "create" | "import") => void;
}

/**
 * Network setup props
 */
export interface NetworkSetupProps {
	onNetworkSelected: (network: { id: string; name: string; api: string; socket: string }) => void;
	onCancel: () => void;
}

/**
 * Connection process props
 */
export interface ConnectionProcessProps {
	onComplete: () => void;
	onError: (error: string) => void;
}

/**
 * Network selector compact props
 */
export interface NetworkSelectorCompactProps {
	onNetworkChange?: (network: { id: string; name: string; api: string; socket: string }) => void;
}

/**
 * Storage scan dialog props
 */
export interface StorageScanDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onComplete: () => void;
}

/**
 * Lottie animation props
 */
export interface LottieAnimationProps {
	src: string;
	className?: string;
	loop?: boolean;
	autoplay?: boolean;
}

/**
 * Security warning extensions types
 */
export interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface WindowWithPWA extends Window {
	beforeinstallprompt?: BeforeInstallPromptEvent;
}

