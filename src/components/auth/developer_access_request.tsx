/**
 * Developer Access Request Dialog
 * Shows when user tries to access Editor without developer permissions
 */

import { type ReactElement, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Code,
  Database,
  Loader2,
  Shield,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuthStore } from "@/stores/modules/auth.store.ts";
import { createSignedTransaction } from "@/lib/gliesereum";

/**
 * Request status type
 */
type RequestStatus = "idle" | "pending" | "success" | "error";

/**
 * Developer Access Request Dialog Props
 */
export interface DeveloperAccessRequestProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Developer Access Request Dialog Component
 */
export function DeveloperAccessRequestDialog({
  open,
  onOpenChange,
}: DeveloperAccessRequestProps): ReactElement {
  const { connectionSession, wallet } = useAuthStore();
  const [requestStatus, setRequestStatus] = useState<RequestStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Request developer access from node using signed transaction
   */
  const handleRequestAccess = async (): Promise<void> => {
    if (!connectionSession || !wallet) {
      setErrorMessage("No active connection or wallet");
      setRequestStatus("error");
      return;
    }

    setRequestStatus("pending");
    setErrorMessage(null);

    try {
      // Create developer request transaction data
      const requestData = {
        action: "DEVELOPER_REQUEST",
        timestamp: Date.now(),
        network: connectionSession.network,
        walletAddress: wallet.address,
      };

      // Create and sign transaction
      const signedTransaction = createSignedTransaction(
        wallet,
        wallet.address, // to self
        0, // amount
        1, // fee
        JSON.stringify(requestData), // data
      );

      // Send request to node
      const response = await fetch(connectionSession.api, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "stels-session": connectionSession.session,
        },
        body: JSON.stringify({
          webfix: "1.0",
          method: "requestDeveloperAccess",
          params: [],
          body: {
            transaction: signedTransaction,
            walletAddress: wallet.address,
            publicKey: wallet.publicKey,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      console.log("[DeveloperAccess] Response:", result);

      // Check if we received updated session with developer access
      if (result.raw && result.raw.session && result.raw.token) {
        const updatedSession = {
          session: result.raw.session,
          token: result.raw.token,
          network: result.raw.info.network,
          title: result.raw.info.title,
          nid: result.raw.info.nid,
          api: result.raw.info.api,
          socket: result.raw.info.connector.socket,
          developer: result.raw.info.developer,
        };

        console.log(
          "[DeveloperAccess] Developer access granted:",
          updatedSession.developer,
        );

        // Update auth store with new session
        useAuthStore.setState({
          connectionSession: updatedSession,
          isConnected: true,
          isAuthenticated: true,
        });

        // Update localStorage for WebSocket reconnection
        localStorage.setItem(
          "private-store",
          JSON.stringify({
            raw: {
              session: updatedSession.session,
              token: updatedSession.token,
              info: {
                network: updatedSession.network,
                title: updatedSession.title,
                nid: updatedSession.nid,
                api: updatedSession.api,
                connector: {
                  socket: updatedSession.socket,
                },
                developer: updatedSession.developer,
              },
            },
          }),
        );

        setRequestStatus("success");

        // Reload page to reinitialize WebSocket with new session
        setTimeout(() => {
          window.location.reload();
        }, 1500);

        return;
      }

      // If no session returned, request might be pending
      throw new Error("Developer access denied or request pending approval");
    } catch (error) {
      console.error("Failed to request developer access:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to request developer access",
      );
      setRequestStatus("error");
    }
  };

  /**
   * Handle dialog close - allow closing in idle, pending, and error states
   * Parent component (AMIEditor) handles navigation to welcome
   */
  const handleClose = (): void => {
    // Allow closing in idle, pending, and error states (not in success state)
    if (requestStatus !== "success") {
      onOpenChange(false);
      // Reset state after dialog closes
      setTimeout(() => {
        setRequestStatus("idle");
        setErrorMessage(null);
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md max-w-[calc(100vw-24px)] mx-3"
      >
        <DialogHeader className="px-3 sm:px-4 md:px-6">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-1.5 sm:gap-2 text-amber-700 dark:text-amber-400 text-sm sm:text-base">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                Developer Access Required
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-[10px] sm:text-xs md:text-sm leading-relaxed mt-1">
                You need developer permissions to access the Protocol Editor.
              </DialogDescription>
            </div>
            {requestStatus !== "success" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground flex-shrink-0"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 py-3 sm:py-4 px-3 sm:px-4 md:px-6">
          {/* Status: Idle */}
          {requestStatus === "idle" && (
            <>
              <Alert className="border-amber-500/30 bg-amber-500/10">
                <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />
                <AlertDescription className="text-amber-700 dark:text-amber-400 text-[10px] sm:text-xs md:text-sm leading-relaxed">
                  To work with protocols and scripts, you must be in the node's
                  developer list.
                </AlertDescription>
              </Alert>

              <div className="space-y-2 sm:space-y-3">
                <div className="bg-card/10 border border-border rounded p-2.5 sm:p-3 md:p-4">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-muted rounded flex items-center justify-center flex-shrink-0">
                      <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-card-foreground font-mono text-xs sm:text-sm font-bold">
                      PROTOCOL REGISTRY
                    </span>
                  </div>
                  <p className="text-muted-foreground text-[10px] sm:text-xs leading-relaxed">
                    Create and manage distributed execution protocols
                  </p>
                </div>

                <div className="bg-card/10 border border-border rounded p-2.5 sm:p-3 md:p-4">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-muted rounded flex items-center justify-center flex-shrink-0">
                      <Code className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 dark:text-green-500" />
                    </div>
                    <span className="text-card-foreground font-mono text-xs sm:text-sm font-bold">
                      CODE EDITOR
                    </span>
                  </div>
                  <p className="text-muted-foreground text-[10px] sm:text-xs leading-relaxed">
                    Write and deploy workers across the heterogeneous network
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 h-9 sm:h-10 text-xs sm:text-sm"
                >
                  Back to Home
                </Button>
                <Button
                  onClick={handleRequestAccess}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 dark:text-black font-semibold h-9 sm:h-10 text-xs sm:text-sm"
                >
                  Request Developer Access
                </Button>
              </div>
            </>
          )}

          {/* Status: Pending */}
          {requestStatus === "pending" && (
            <>
              <div className="flex flex-col items-center justify-center py-4 sm:py-6">
                <Loader2 className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-primary animate-spin mb-3 sm:mb-4" />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Sending request to node...
                </p>
              </div>
            </>
          )}

          {/* Status: Success */}
          {requestStatus === "success" && (
            <>
              <Alert className="border-green-500/30 bg-green-500/10">
                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                <AlertDescription className="text-green-700 dark:text-green-600 text-[10px] sm:text-xs md:text-sm leading-relaxed">
                  <strong>Access Granted!</strong>
                  <br />
                  Your developer permissions have been activated. The
                  application will reload to apply new session.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col items-center justify-center py-3 sm:py-4">
                <CheckCircle className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-emerald-500 mb-2 sm:mb-3" />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Reloading application...
                </p>
              </div>
            </>
          )}

          {/* Status: Error */}
          {requestStatus === "error" && (
            <>
              <Alert className="border-red-500/30 bg-red-500/10">
                <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
                <AlertDescription className="text-red-700 dark:text-red-400 text-[10px] sm:text-xs md:text-sm leading-relaxed">
                  <strong>Request Failed</strong>
                  <br />
                  {errorMessage || "An unknown error occurred"}
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 h-9 sm:h-10 text-xs sm:text-sm"
                >
                  Back to Hub
                </Button>
                <Button
                  onClick={handleRequestAccess}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 dark:text-black h-9 sm:h-10 text-xs sm:text-sm"
                >
                  Try Again
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Footer info */}
        {requestStatus === "idle" && (
          <div className="pt-3 sm:pt-4 border-t border-border px-3 sm:px-4 md:px-6">
            <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
              <strong>Note:</strong>{" "}
              Developer access enables you to create and manage distributed
              protocols, deploy workers across the heterogeneous network, and
              build autonomous web agents. This request will be reviewed by the
              node administrator.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
