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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4">
        <Card className="border-amber-500/20 bg-zinc-900/95 backdrop-blur-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <CardTitle className="text-xl text-white">
              Security Notice
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Important information before signing out
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Security Information */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-blue-400 text-sm font-medium">
                    Security Testing in Progress
                  </p>
                  <p className="text-blue-300 text-xs leading-relaxed">
                    Our security team is currently testing session management
                    mechanisms to protect against unauthorized access and cyber
                    attacks. You may need to re-authenticate when you return.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleProceedWithLogout}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-medium"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out & Continue
              </Button>

              <Button
                onClick={handleCancelLogout}
                variant="outline"
                className="w-full border-zinc-700 hover:bg-zinc-800 text-zinc-300"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Stay Logged In
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-zinc-500">
                This security testing ensures your account remains protected
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

