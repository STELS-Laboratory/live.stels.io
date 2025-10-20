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
      console.log(
        "[SecurityWarning] User proceeded with logout after security notice",
      );
    } catch (error) {
      console.error("[SecurityWarning] Error during logout:", error);
    }
  };

  /**
   * Handle cancel logout
   */
  const handleCancelLogout = (): void => {
    setShowSecurityWarning(false);
    console.log("[SecurityWarning] User cancelled logout");
  };

  // Don't render if not visible
  if (!showSecurityWarning) {
    return <></>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/95 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4">
        <Card className="backdrop-blur-md bg-zinc-900/80 border border-zinc-800">
          <CardHeader className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-black" />
            </div>
            <CardTitle className="text-lg text-foreground">
              Security Notice
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              Important information before signing out
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Security Information */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <div className="p-1 rounded border border-blue-500/30 bg-blue-500/10">
                  <Shield className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-foreground text-xs font-bold">
                    Security Testing in Progress
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Our security team is currently testing session management
                    mechanisms to protect against unauthorized access and cyber
                    attacks. You may need to re-authenticate when you return.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={handleProceedWithLogout}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold h-9"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out & Continue
              </Button>

              <Button
                onClick={handleCancelLogout}
                variant="outline"
                className="w-full h-9"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Stay Logged In
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                This security testing ensures your account remains protected
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
