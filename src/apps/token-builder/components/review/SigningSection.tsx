/**
 * Signing Section Component
 * Handles certificate signing with secure key management
 */

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Check, Lock } from "lucide-react";
import { useAuthWallet } from "../../hooks/use-auth-wallet";
import { useTokenBuilderStore } from "../../store";
import { useRateLimit } from "../../hooks/use-rate-limit";
import { useTokenToast } from "../../hooks/use-token-toast";
import {
  formatTimeRemaining,
  RATE_LIMITS,
  VALIDATION_MESSAGES,
} from "../../utils";

interface SigningSectionProps {
  hasErrors: boolean;
}

/**
 * Signing Section - handles certificate signing
 */
export const SigningSection = React.memo(function SigningSection({
  hasErrors,
}: SigningSectionProps): React.ReactElement | null {
  const { address, hasWallet, network, signWithCallback } = useAuthWallet();
  const certificate = useTokenBuilderStore((state) => state.certificate);
  const signSchema = useTokenBuilderStore((state) => state.signSchema);

  const { showCertificateCreated, showSigningError, showRateLimitError } =
    useTokenToast();
  const { canExecute, getRemainingTime, markExecuted } = useRateLimit(
    RATE_LIMITS.SIGNING_COOLDOWN_MS,
  );

  const [signing, setSigning] = useState(false);
  const [useAuthKey, setUseAuthKey] = useState(true);
  const manualKeyRef = useRef<string>("");

  // Clear manual key on unmount
  useEffect(() => {
    return () => {
      manualKeyRef.current = "";
    };
  }, []);

  // Don't show if certificate already created
  if (certificate) return null;

  // Don't show if there are validation errors
  if (hasErrors) return null;

  /**
   * Handle certificate signing
   * Uses secure callback-based key access
   */
  const handleSign = async (): Promise<void> => {
    // Rate limiting check
    if (!canExecute()) {
      const seconds = formatTimeRemaining(getRemainingTime());
      showRateLimitError(seconds);
      return;
    }

    setSigning(true);

    try {
      if (useAuthKey) {
        // Use wallet key via secure callback
        await signWithCallback(async (privateKey) => {
          await signSchema(privateKey);
        });
      } else {
        // Use manual key
        const manualKey = manualKeyRef.current;
        if (!manualKey) {
          showSigningError("Please enter your private key");
          return;
        }

        await signSchema(manualKey);

        // Clear manual key immediately
        manualKeyRef.current = "";
      }

      markExecuted();
      showCertificateCreated();
    } catch (error) {
      showSigningError(error instanceof Error ? error : String(error));
    } finally {
      setSigning(false);
      // Ensure manual key is cleared
      manualKeyRef.current = "";
    }
  };

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <Lock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <p className="text-xs font-semibold text-foreground">
              Sign Certificate
            </p>

            {/* Wallet Info */}
            {hasWallet && (
              <div className="p-2 bg-green-500/10 border border-green-500/30 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <Check className="w-3 h-3 text-green-500" />
                  <span className="text-xs font-semibold text-green-600 dark:text-green-500">
                    Wallet Connected
                  </span>
                </div>
                <div className="text-xs font-mono text-muted-foreground space-y-0.5">
                  <div>Address: {address}</div>
                  <div>Network: {network?.name || "Unknown"}</div>
                </div>
              </div>
            )}

            {/* Key Source Selection */}
            <div className="space-y-2">
              {hasWallet && (
                <label className="flex items-center gap-2 cursor-pointer p-2 bg-muted/30 rounded border border-border">
                  <input
                    type="radio"
                    checked={useAuthKey}
                    onChange={() => setUseAuthKey(true)}
                    className="w-3.5 h-3.5"
                  />
                  <div className="flex-1">
                    <span className="text-xs text-foreground font-medium">
                      Use connected wallet
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      Sign with {address?.substring(0, 12)}...
                    </p>
                  </div>
                </label>
              )}

              <label className="flex items-center gap-2 cursor-pointer p-2 bg-muted/30 rounded border border-border">
                <input
                  type="radio"
                  checked={!useAuthKey}
                  onChange={() => setUseAuthKey(false)}
                  className="w-3.5 h-3.5"
                />
                <div className="flex-1">
                  <span className="text-xs text-foreground font-medium">
                    Use manual private key
                  </span>
                  <p className="text-[10px] text-muted-foreground">
                    Enter private key manually
                  </p>
                </div>
              </label>
            </div>

            {/* Manual Key Input */}
            {!useAuthKey && (
              <Input
                type="password"
                onChange={(e) => {
                  manualKeyRef.current = e.target.value;
                }}
                placeholder="Enter private key..."
                className="h-8 text-xs font-mono"
              />
            )}

            {/* Sign Button */}
            <Button
              onClick={handleSign}
              disabled={signing || (useAuthKey && !hasWallet)}
              size="sm"
              className="h-7 text-xs w-full bg-amber-500 hover:bg-amber-600 text-black font-bold"
            >
              {signing ? "Signing..." : "Sign & Create Certificate"}
            </Button>

            {/* Warning if no wallet */}
            {!hasWallet && (
              <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  ℹ️ {VALIDATION_MESSAGES.NO_WALLET}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default SigningSection;
