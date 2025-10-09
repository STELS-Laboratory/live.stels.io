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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4">
        <Card className="border-amber-500/20 bg-card/95 backdrop-blur-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
            <CardTitle className="text-2xl text-foreground">
              Session Expired
            </CardTitle>
            <CardDescription className="text-muted-foreground text-base">
              Your session has been terminated
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Security Information */}
            <div className="bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/30 rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <Shield className="h-6 w-6 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-3">
                  <p className="text-blue-600 dark:text-blue-400 text-base font-medium">
                    Security Testing Notice
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed">
                    Our security team is currently testing session management
                    mechanisms to protect against unauthorized access and cyber
                    attacks. This testing ensures your account remains secure.
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed">
                    Please click "OK" to proceed with re-authentication.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button
                onClick={handleOkClick}
                className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-600 text-black dark:text-black font-medium px-8 py-3 text-base"
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
