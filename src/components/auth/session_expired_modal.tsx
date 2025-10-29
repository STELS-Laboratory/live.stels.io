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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-sm p-3 sm:p-4">
      <div className="w-full max-w-lg">
        <Card className="backdrop-blur-md bg-card/80 border border-border">
          <CardHeader className="text-center px-3 sm:px-4 md:px-6 pt-4 sm:pt-5 md:pt-6 pb-3 sm:pb-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-3 sm:mb-4 bg-primary rounded flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-lg sm:text-xl md:text-2xl text-foreground">
              Session Expired
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs sm:text-sm mt-1.5 sm:mt-2">
              Your session has been terminated
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-4 md:px-6 pb-4 sm:pb-5 md:pb-6">
            {/* Security Information */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2.5 sm:p-3 md:p-4">
              <div className="flex items-start gap-2 sm:gap-2.5 md:gap-3">
                <div className="p-1 sm:p-1.5 rounded border border-blue-500/30 bg-blue-500/10 flex-shrink-0">
                  <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <p className="text-foreground text-[11px] sm:text-xs font-bold">
                    Session Security Notice
                  </p>
                  <p className="text-muted-foreground text-[10px] sm:text-xs leading-relaxed">
                    Your session has expired due to inactivity or network
                    connection changes. This automatic timeout protects your
                    account from unauthorized access.
                  </p>
                  <p className="text-muted-foreground text-[10px] sm:text-xs leading-relaxed">
                    Your wallet and private keys are safely stored locally.
                    Please click "OK" to re-authenticate and continue working
                    securely.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button
                onClick={handleOkClick}
                className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-6 sm:px-8 h-9 sm:h-10 text-xs sm:text-sm"
              >
                OK
              </Button>
            </div>

            <div className="text-center">
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                This message will not disappear until you click OK
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
