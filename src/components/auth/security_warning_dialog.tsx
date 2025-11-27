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
import { AlertTriangle, LogOut, RefreshCw, Shield } from "lucide-react";

/**
 * Security warning dialog component
 * Shows before user logout to inform about security testing
 */
export const SecurityWarningDialog: React.FC = (): React.ReactElement => {
  const { showSecurityWarning, setShowSecurityWarning, resetAuth } =
    useAuthStore();

  /**
   * Handle proceed with logout after showing warning
   */
  const handleProceedWithLogout = async (): Promise<void> => {
    try {
      setShowSecurityWarning(false);
      await resetAuth();

    } catch {
			// Error handled silently
		}
  };

  /**
   * Handle cancel logout
   */
  const handleCancelLogout = (): void => {
    setShowSecurityWarning(false);

  };

  // Don't render if not visible
  if (!showSecurityWarning) {
    return <></>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-3 sm:p-4">
      <div className="w-full max-w-md">
        <Card className="backdrop-blur-md bg-card/80 border border-border">
          <CardHeader className="text-center px-3 sm:px-4 md:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2 sm:mb-3 bg-primary rounded flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
            </div>
            <CardTitle className="text-base sm:text-lg text-foreground">
              Security Notice
            </CardTitle>
            <CardDescription className="text-muted-foreground text-[10px] sm:text-xs mt-1 sm:mt-1.5">
              Important information before signing out
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-2.5 sm:space-y-3 px-3 sm:px-4 md:px-6 pb-4 sm:pb-5 md:pb-6">
            {/* Security Information */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2.5 sm:p-3">
              <div className="flex items-start gap-2">
                <div className="p-1 rounded border border-blue-500/30 bg-blue-500/10 flex-shrink-0">
                  <Shield className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-foreground text-[11px] sm:text-xs font-bold">
                    Session Management Notice
                  </p>
                  <p className="text-muted-foreground text-[10px] sm:text-xs leading-relaxed">
                    Signing out will terminate your current session and clear
                    all authentication data. Your wallet and private keys are
                    stored locally and will not be affected. You will need to
                    re-authenticate with your private key when you return.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={handleProceedWithLogout}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold h-9 sm:h-10 text-xs sm:text-sm"
              >
                <LogOut className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Sign Out & Continue
              </Button>

              <Button
                onClick={handleCancelLogout}
                variant="outline"
                className="w-full h-9 sm:h-10 text-xs sm:text-sm"
              >
                <RefreshCw className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Stay Logged In
              </Button>
            </div>

            <div className="text-center">
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Your wallet data remains secure and encrypted in local storage
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
