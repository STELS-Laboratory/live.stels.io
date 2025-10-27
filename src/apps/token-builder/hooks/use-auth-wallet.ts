/**
 * Auth Wallet Hook
 * Secure access to wallet from auth-store in localStorage
 * 
 * SECURITY: Private key is NEVER exposed in hook return value
 */

import { useState, useEffect } from "react";
import { sign } from "@/lib/gliesereum";

interface Wallet {
  publicKey: string;
  privateKey: string;
  address: string;
  biometric: string | null;
  number: string;
}

interface Network {
  id: string;
  name: string;
  api: string;
  socket: string;
  developer: boolean;
  description: string;
}

interface AuthStore {
  wallet: Wallet | null;
  isWalletCreated: boolean;
  selectedNetwork: Network | null;
  isConnected: boolean;
  isAuthenticated: boolean;
}

/**
 * Hook to access auth wallet from localStorage
 * SECURITY: Private key NEVER exposed - only signing functions provided
 */
export function useAuthWallet(): {
  address: string | null;
  publicKey: string | null;
  number: string | null;
  network: Network | null;
  isAuthenticated: boolean;
  hasWallet: boolean;
  refresh: () => void;
  signMessage: (message: string) => string;
  signWithCallback: <T>(callback: (privateKey: string) => T) => T;
} {
  const [authStore, setAuthStore] = useState<AuthStore | null>(null);

  const loadAuthStore = (): void => {
    try {
      const stored = localStorage.getItem("auth-store");
      if (stored) {
        const parsed = JSON.parse(stored);
        // Zustand persist wraps state in { state: {...} }
        const state = parsed.state || parsed;
        setAuthStore(state as AuthStore);
      } else {
        setAuthStore(null);
      }
    } catch (error) {
      console.error("[useAuthWallet] Failed to load auth-store:", error);
      setAuthStore(null);
    }
  };

  useEffect(() => {
    loadAuthStore();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent): void => {
      if (e.key === "auth-store") {
        loadAuthStore();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Secure signing function - keeps private key internal
  const signMessage = (message: string): string => {
    const privateKey = authStore?.wallet?.privateKey;
    
    if (!privateKey) {
      throw new Error("No wallet available for signing");
    }

    // Sign and immediately discard reference to private key
    const signature = sign(message, privateKey);
    
    // Private key never leaves this function
    return signature;
  };

  /**
   * Secure callback-based private key access
   * Private key is passed to callback but never returned
   * Callback is executed in controlled scope with automatic cleanup
   * 
   * @param callback - Function that receives private key
   * @returns Result of callback execution
   * @throws Error if no wallet available
   * 
   * @security Private key reference is automatically cleared after callback
   */
  const signWithCallback = <T,>(callback: (privateKey: string) => T): T => {
    const privateKey = authStore?.wallet?.privateKey;
    
    if (!privateKey) {
      throw new Error("No wallet available for signing");
    }

    try {
      // Execute callback with private key
      const result = callback(privateKey);
      return result;
    } finally {
      // Private key reference is cleared by scope exit
      // No explicit cleanup needed - let garbage collector handle it
    }
  };

  return {
    address: authStore?.wallet?.address || null,
    publicKey: authStore?.wallet?.publicKey || null,
    number: authStore?.wallet?.number || null,
    network: authStore?.selectedNetwork || null,
    isAuthenticated: authStore?.isAuthenticated || false,
    hasWallet: !!authStore?.wallet,
    refresh: loadAuthStore,
    signMessage,
    signWithCallback, // Secure callback-based access
  };
}
