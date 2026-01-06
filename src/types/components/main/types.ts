/**
 * Main components type definitions
 */

/**
 * Chunk error boundary types
 */
export interface ChunkErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export interface ChunkErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isChunkError?: boolean;
}

/**
 * App launcher types
 */
export interface LaunchStep {
  label: string;
  progress: number;
}

/**
 * App tabs types
 */
export interface DevTool {
  key: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
}

/**
 * Route loader props
 */
export interface RouteLoaderProps {
  children: React.ReactNode;
}

/**
 * Splash screen props
 */
export interface SplashScreenProps {
  onComplete?: () => void;
  duration?: number;
  updateApp?: boolean;
}

/**
 * Upgrade screen props
 */
export interface UpgradeScreenProps {
  onComplete?: () => void;
  endDate?: Date;
}
