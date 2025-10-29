import { useEffect, useState } from "react";
import { AlertTriangle, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/stores";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  performSecurityCheck,
  type SecurityCheckResult,
} from "@/lib/pwa-security";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface WindowWithPWA extends Window {
  deferredPrompt: BeforeInstallPromptEvent | null;
}

/**
 * Security Warning for Browser Extensions
 *
 * Displays warning when browser extensions are detected
 * Recommends installing as standalone PWA for maximum security
 */
export function SecurityWarningExtensions(): React.ReactElement {
  const [securityCheck, setSecurityCheck] = useState<
    SecurityCheckResult | null
  >(null);
  const [showWarning, setShowWarning] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const isDismissed =
      localStorage.getItem("security-warning-dismissed") === "true";
    if (isDismissed) {
      setDismissed(true);
      return;
    }

    // Perform security check
    const check = performSecurityCheck();
    setSecurityCheck(check);

    // Show warning if not in standalone mode and extensions detected
    if (!check.isStandalone && check.suspiciousExtensions.length > 0) {
      setShowWarning(true);
    }
  }, []);

  const handleDismiss = (): void => {
    setShowWarning(false);
    setDismissed(true);
    localStorage.setItem("security-warning-dismissed", "true");
  };

  const handleInstall = (): void => {
    // Trigger browser install prompt if available
    const installPrompt = (window as unknown as WindowWithPWA).deferredPrompt;
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("[PWA] User accepted install");
        }
        (window as unknown as WindowWithPWA).deferredPrompt = null;
      });
    } else {
      toast.info(
        "How to Install STELS Web 5",
        "Desktop: Click the install icon in your browser's address bar • " +
          "Android: Open menu → 'Add to Home screen' • " +
          "iOS: Tap Share → 'Add to Home Screen'",
      );
    }
  };

  if (dismissed || !showWarning || !securityCheck) {
    return <></>;
  }

  return (
    <Dialog open={showWarning} onOpenChange={setShowWarning}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Security Notice
          </DialogTitle>
          <div className="space-y-4 pt-4">
            <div className="rounded bg-amber-500/10 p-4 border border-amber-500/20">
              <p className="text-sm">
                <strong>Browser Extensions Detected</strong>
              </p>
              <p className="text-xs mt-2">
                Browser extensions can potentially access and intercept
                sensitive data including private keys, passwords, and
                transaction details. For maximum security when handling
                cryptocurrency, we recommend using standalone app mode.
              </p>
            </div>

            {securityCheck.suspiciousExtensions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium">Detected:</p>
                <ul className="space-y-1">
                  {securityCheck.suspiciousExtensions.map((ext, idx) => (
                    <li
                      key={idx}
                      className="text-xs  flex items-center gap-2"
                    >
                      <span className="w-1 h-1 rounded-full bg-amber-500" />
                      {ext}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded bg-green-500/10 p-4 border border-green-500/20">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5  mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium ">
                    Recommended: Install as Standalone App
                  </p>
                  <p className="text-xs ">
                    Installing STELS as a standalone Progressive Web App (PWA)
                    provides enhanced security. Browser extensions cannot access
                    or modify the app in standalone mode, creating an isolated
                    environment for your cryptocurrency operations.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleInstall}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-zinc-950"
              >
                <Shield className="h-4 w-4 mr-2" />
                Install App
              </Button>
              <Button
                onClick={handleDismiss}
                variant="outline"
                className="px-3"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-xs  text-center">
              You can also disable extensions manually for this site
            </p>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
