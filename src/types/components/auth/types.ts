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
 * Network setup props
 */
export interface NetworkSetupProps {
  onNetworkSelected: (
    network: { id: string; name: string; api: string; socket: string },
  ) => void;
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
  onNetworkChange?: (
    network: { id: string; name: string; api: string; socket: string },
  ) => void;
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
