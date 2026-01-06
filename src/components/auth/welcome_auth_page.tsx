import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowRight, Lock } from "lucide-react";
import { ProfessionalConnectionFlow } from "./professional_connection_flow";
import { useAuthStore } from "@/stores/modules/auth.store";
import { navigateTo } from "@/lib/router";
import { UnifiedHeader } from "@/components/main/unified_header";

/**
 * Welcome Page
 * Shows authentication for non-authenticated users
 * Shows dashboard for authenticated users
 */
export function WelcomeAuthPage(): React.ReactElement {
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const {
    isAuthenticated,
    selectedNetwork,
  } = useAuthStore();

  // Global GitHub OAuth callback handler
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const router = urlParams.get("router");

    // If we have GitHub OAuth callback parameters, open dialog and process
    if (code && state) {
      // Verify state
      const storedState = sessionStorage.getItem("github_oauth_state");
      if (storedState && storedState === state) {
        // Store as pending if selectedNetwork is not ready
        if (!selectedNetwork) {
          sessionStorage.setItem("github_oauth_pending_code", code);
          sessionStorage.setItem("github_oauth_pending_state", state);
        } else {
          sessionStorage.setItem("github_oauth_pending_code", code);
          sessionStorage.setItem("github_oauth_pending_state", state);
        }

        // Open auth dialog to process callback
        setIsAuthDialogOpen(true);

        // Clean URL parameters (keep router if present)
        const url = new URL(window.location.href);
        url.searchParams.delete("code");
        url.searchParams.delete("state");
        if (router) {
          url.searchParams.set("router", router);
        }
        window.history.replaceState({}, "", url.toString());
      } else {
        // Invalid state - clean URL
        const url = new URL(window.location.href);
        url.searchParams.delete("code");
        url.searchParams.delete("state");
        if (router) {
          url.searchParams.set("router", router);
        }
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [selectedNetwork]);

  // Clean URL after successful authentication (only redirect from callback)
  useEffect(() => {
    if (isAuthenticated) {
      // Check if we're on the callback path
      const isOnCallbackPath = window.location.pathname.includes(
        "/auth/github/callback",
      );

      if (
        isOnCallbackPath || window.location.search.includes("code") ||
        window.location.search.includes("state")
      ) {
        // Clean URL parameters after OAuth callback
        const url = new URL(window.location.href);
        url.searchParams.delete("code");
        url.searchParams.delete("state");
        url.searchParams.set("router", "welcome");
        window.history.replaceState({}, "", url.toString());

        // Navigate to welcome to show dashboard
        navigateTo("welcome");
      }
      // Don't auto-redirect if user is already on welcome - let them see the dashboard
    }
  }, [isAuthenticated]);

  const handleOpenAuth = useCallback((): void => {
    setIsAuthDialogOpen(true);
  }, []);

  const handleAuthSuccess = useCallback((): void => {
    // Close dialog on successful authentication
    setIsAuthDialogOpen(false);
  }, []);

  // If authenticated, show welcome message
  if (isAuthenticated) {
    return (
      <div className="h-screen w-full bg-background flex flex-col">
        <UnifiedHeader />

        {/* Welcome Content */}
        <main className="flex-1 overflow-y-auto flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground">
              Welcome Stels
            </h1>
          </div>
        </main>
      </div>
    );
  }

  // If not authenticated, show login page
  return (
    <div className="h-screen w-full bg-background flex items-center justify-center">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-4xl font-bold text-foreground">
          Welcome
        </h1>
        <p className="text-muted-foreground">
          Click the button below to authenticate
        </p>
        <Button
          onClick={handleOpenAuth}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          aria-label="Private Access"
        >
          <Lock className="h-4 w-4 mr-2" />
          Private Access
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Authentication Dialog */}
      <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0"
          showCloseButton={true}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Authentication</DialogTitle>
            <DialogDescription>
              Complete the authentication process to access STELS Web 5
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 sm:p-6 md:p-8">
            <ProfessionalConnectionFlow onSuccess={handleAuthSuccess} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
