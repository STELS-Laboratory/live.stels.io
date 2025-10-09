import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/stores/modules/auth.store";
import { AlertTriangle, Shield } from "lucide-react";

/**
 * Session expired modal component
 * Blocks the entire application until user acknowledges the message
 */
export const SessionExpiredModal: React.FC = (): React.ReactElement => {
  const { showSessionExpiredModal, setShowSessionExpiredModal, resetAuth } =
    useAuthStore();

  /**
   * Handle OK button click - proceed with logout
   */
  const handleOkClick = async (): Promise<void> => {
    try {
      setShowSessionExpiredModal(false);
      await resetAuth();
      console.log("[SessionExpiredModal] User acknowledged session expiration");
    } catch (error) {
      console.error("[SessionExpiredModal] Error during logout:", error);
    }
  };

  // Don't render if not visible
  if (!showSessionExpiredModal) {
    return <></>;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95">
      <div className="w-full max-w-lg mx-4">
        <Card className="border bg-card">
          <CardHeader className="text-center">
            <div className="relative mx-auto mb-4 p-3 border-2 border-amber-500/30 bg-amber-500/10 inline-flex">
              <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-amber-500/50" />
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <CardTitle className="text-xl text-foreground">
              Session Expired
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              Your session has been terminated
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Security Information */}
            <div className="relative bg-blue-500/5 border border-blue-500/30 p-4">
              <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-t border-l border-blue-500/50" />
              <div className="flex items-start gap-3">
                <div className="p-1.5 border border-blue-500/30 bg-blue-500/10">
                  <Shield className="h-4 w-4 text-blue-500" />
                </div>
                <div className="space-y-2">
                  <p className="text-foreground text-xs font-bold">
                    Security Testing Notice
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Our security team is currently testing session management
                    mechanisms to protect against unauthorized access and cyber
                    attacks. This testing ensures your account remains secure.
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Please click "OK" to proceed with re-authentication.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button
                onClick={handleOkClick}
                className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-8 h-10"
              >
                OK
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                This message will not disappear until you click OK
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
