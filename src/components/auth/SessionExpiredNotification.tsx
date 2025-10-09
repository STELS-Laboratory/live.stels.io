import React, { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/stores/modules/auth.store";
import { useWebSocketStore } from "@/hooks/useWebSocketStore";
import { AlertTriangle, LogOut, RefreshCw, Shield } from "lucide-react";

/**
 * Session expired notification component
 * Shows when WebSocket session becomes invalid and requires re-authentication
 */
export const SessionExpiredNotification: React.FC = (): React.ReactElement => {
  const { sessionExpired } = useWebSocketStore();
  const { resetAuth, connectionError } = useAuthStore();
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isHandling, setIsHandling] = useState<boolean>(false);

  // Show notification when session is expired
  useEffect(() => {
    if (sessionExpired && !isVisible) {
      setIsVisible(true);
      // Auto-hide after 5 seconds if user doesn't interact
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [sessionExpired, isVisible]);

  /**
   * Handle re-authentication
   */
  const handleReAuthenticate = async (): Promise<void> => {
    setIsHandling(true);
    try {
      // Clear session expired state
      useWebSocketStore.setState({ sessionExpired: false });

      // Reset auth state to show auth flow
      await resetAuth();

      console.log("[SessionExpired] Re-authentication initiated");
    } catch (error) {
      console.error("[SessionExpired] Error during re-authentication:", error);
    } finally {
      setIsHandling(false);
      setIsVisible(false);
    }
  };

  /**
   * Handle manual logout
   */
  const handleLogout = async (): Promise<void> => {
    setIsHandling(true);
    try {
      // Clear session expired state
      useWebSocketStore.setState({ sessionExpired: false });

      // Reset auth state completely
      await resetAuth();

      console.log("[SessionExpired] Manual logout completed");
    } catch (error) {
      console.error("[SessionExpired] Error during logout:", error);
    } finally {
      setIsHandling(false);
      setIsVisible(false);
    }
  };

  // Don't render if not visible or not expired
  if (!isVisible || !sessionExpired) {
    return <></>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95">
      <div className="w-full max-w-md mx-4">
        <Card className="border bg-card">
          <CardHeader className="text-center">
            <div className="relative mx-auto mb-3 p-2 border-2 border-amber-500/30 bg-amber-500/10 inline-flex">
              <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 border-t border-l border-amber-500/50" />
              <Shield className="h-5 w-5 text-amber-500" />
            </div>
            <CardTitle className="text-lg text-foreground">
              Security Session Test
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              Your session has been terminated for security testing
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Security Information */}
            <Alert className="border-blue-500/30 bg-blue-500/5">
              <Shield className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-muted-foreground text-xs">
                <strong className="text-foreground">Security Notice:</strong>
                {" "}
                Our team is testing session security mechanisms to protect
                against unauthorized access and cyber attacks. Please
                re-authenticate to continue.
              </AlertDescription>
            </Alert>

            {connectionError && (
              <Alert className="border-red-500/30 bg-red-500/10">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-500 text-xs">
                  {connectionError}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Button
                onClick={handleReAuthenticate}
                disabled={isHandling}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold h-9"
              >
                {isHandling
                  ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  )
                  : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Re-authenticate & Continue
                    </>
                  )}
              </Button>

              <Button
                onClick={handleLogout}
                disabled={isHandling}
                variant="outline"
                className="w-full h-9"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>

            <div className="text-center space-y-1">
              <p className="text-xs text-muted-foreground">
                This notification will auto-dismiss in a few seconds
              </p>
              <p className="text-xs text-muted-foreground">
                Security testing ensures your data remains protected
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
