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
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
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
   * Handle dialog close - only allow closing on error state
   * Parent component (AMIEditor) handles navigation to welcome
   */
  const handleClose = (): void => {
    // Dialog can only be closed on error state
    if (requestStatus === "error") {
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
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <Shield className="w-5 h-5" />
            Developer Access Required
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            You need developer permissions to access the Protocol Editor. This
            dialog cannot be closed until access is granted or an error occurs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status: Idle */}
          {requestStatus === "idle" && (
            <>
              <Alert className="border-amber-500/30 bg-amber-500/10">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
                  To work with protocols and scripts, you must be in the node's
                  developer list.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="bg-card/50 border border-border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                      <Database className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                    </div>
                    <span className="text-card-foreground font-mono text-sm font-bold">
                      PROTOCOL REGISTRY
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Create and manage distributed execution protocols
                  </p>
                </div>

                <div className="bg-card/50 border border-border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                      <Code className="w-4 h-4 text-green-700 dark:text-green-600" />
                    </div>
                    <span className="text-card-foreground font-mono text-sm font-bold">
                      CODE EDITOR
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Write and deploy workers across the heterogeneous network
                  </p>
                </div>
              </div>

              <Button
                onClick={handleRequestAccess}
                className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 dark:text-black font-semibold"
              >
                Request Developer Access
              </Button>
            </>
          )}

          {/* Status: Pending */}
          {requestStatus === "pending" && (
            <>
              <div className="flex flex-col items-center justify-center py-6">
                <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
                <p className="text-sm text-muted-foreground">
                  Sending request to node...
                </p>
              </div>
            </>
          )}

          {/* Status: Success */}
          {requestStatus === "success" && (
            <>
              <Alert className="border-green-500/30 bg-green-500/10">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700 dark:text-green-600 text-sm">
                  <strong>Access Granted!</strong>
                  <br />
                  Your developer permissions have been activated. The
                  application will reload to apply new session.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col items-center justify-center py-4">
                <CheckCircle className="w-16 h-16 text-green-500 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Reloading application...
                </p>
              </div>
            </>
          )}

          {/* Status: Error */}
          {requestStatus === "error" && (
            <>
              <Alert className="border-red-500/30 bg-red-500/10">
                <XCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-700 dark:text-red-400 text-sm">
                  <strong>Request Failed</strong>
                  <br />
                  {errorMessage || "An unknown error occurred"}
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Back to Hub
                </Button>
                <Button
                  onClick={handleRequestAccess}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 dark:text-black"
                >
                  Try Again
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Footer info */}
        {requestStatus === "idle" && (
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
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
