/**
 * Single authentication page.
 * Full-screen: background, header, hero card, OAuth dialog.
 * Used when app state is AUTHENTICATING (and optionally as guest view).
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoginHero } from "./login-hero";
import { ProfessionalConnectionFlow } from "./professional-connection-flow";
import { useAuthStore } from "@/stores/modules/auth.store";
import { NETWORK_CONFIGS } from "@/stores/modules/network.store";
import { navigateTo } from "@/lib/router";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function AuthPage(): React.ReactElement {
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const { isAuthenticated, selectedNetwork } = useAuthStore();

  // OAuth callback from URL (session, username, avatar, developer)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const router = urlParams.get("router");

    const sessionParam = urlParams.get("session");
    const usernameParam = urlParams.get("username");
    const avatarParam = urlParams.get("avatar");
    const developerParam = urlParams.get("developer");

    if (sessionParam) {
      sessionStorage.setItem("github_oauth_session", sessionParam);
      if (usernameParam) sessionStorage.setItem("github_oauth_username", usernameParam);
      if (avatarParam) sessionStorage.setItem("github_oauth_avatar", avatarParam);
      if (developerParam !== null && developerParam !== undefined) {
        sessionStorage.setItem("github_oauth_developer", developerParam);
      }

      const savedNetworkId = sessionStorage.getItem("github_oauth_network_id");
      if (savedNetworkId) {
        const network = Object.values(NETWORK_CONFIGS).find((n) => n.id === savedNetworkId);
        if (network) useAuthStore.getState().selectNetwork(network);
        sessionStorage.removeItem("github_oauth_network_id");
      }

      setIsAuthDialogOpen(true);

      const url = new URL(window.location.href);
      url.pathname = "/";
      url.searchParams.delete("session");
      url.searchParams.delete("username");
      url.searchParams.delete("avatar");
      url.searchParams.delete("developer");
      if (router) url.searchParams.set("router", router);
      window.history.replaceState({}, "", url.toString());
      return;
    }

    if (code && state) {
      const storedState = sessionStorage.getItem("github_oauth_state");
      if (storedState && storedState === state) {
        sessionStorage.setItem("github_oauth_pending_code", code);
        sessionStorage.setItem("github_oauth_pending_state", state);
        setIsAuthDialogOpen(true);

        const url = new URL(window.location.href);
        if (url.pathname.includes("/auth/github/callback") || url.pathname.includes("/auth/callback")) {
          url.pathname = "/";
        }
        url.searchParams.delete("code");
        url.searchParams.delete("state");
        if (router) url.searchParams.set("router", router);
        window.history.replaceState({}, "", url.toString());
      } else {
        const url = new URL(window.location.href);
        if (url.pathname.includes("/auth/")) url.pathname = "/";
        url.searchParams.delete("code");
        url.searchParams.delete("state");
        if (router) url.searchParams.set("router", router);
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [selectedNetwork]);

  // After successful auth → welcome
  useEffect(() => {
    if (!isAuthenticated) return;

    const hasCallbackParams =
      window.location.pathname.includes("/auth/") ||
      window.location.search.includes("code") ||
      window.location.search.includes("state") ||
      window.location.search.includes("session=");

    if (hasCallbackParams) {
      const url = new URL(window.location.href);
      if (url.pathname.includes("/auth/")) url.pathname = "/";
      url.searchParams.delete("code");
      url.searchParams.delete("state");
      url.searchParams.delete("session");
      url.searchParams.delete("username");
      url.searchParams.delete("avatar");
      url.searchParams.delete("developer");
      url.searchParams.set("router", "welcome");
      window.history.replaceState({}, "", url.toString());
    }
    navigateTo("welcome");
  }, [isAuthenticated]);

  const handleOpenAuth = useCallback(() => setIsAuthDialogOpen(true), []);
  const handleAuthSuccess = useCallback(() => setIsAuthDialogOpen(false), []);

  return (
    <>
      <div className="relative flex min-h-svh w-full flex-col bg-background">
        {/* Modern gradient + orbs background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Base gradient mesh */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 120% 80% at 50% -20%, color-mix(in srgb, var(--primary) 7%, transparent) 0%, transparent 50%), " +
                "radial-gradient(ellipse 80% 60% at 100% 50%, color-mix(in srgb, var(--primary) 5%, transparent) 0%, transparent 45%), " +
                "radial-gradient(ellipse 60% 80% at 0% 100%, color-mix(in srgb, var(--chart-2) 5%, transparent) 0%, transparent 45%)",
            }}
          />
          {/* Soft animated orbs */}
          <div className="absolute -top-1/3 -left-1/4 h-[70vmax] w-[70vmax] rounded-full bg-primary/[0.07] blur-[100px] animate-auth-orb-slow" />
          <div className="absolute bottom-0 right-0 h-[55vmax] w-[55vmax] rounded-full bg-blue-500/[0.06] blur-[90px] animate-auth-orb-slower" />
          <div className="absolute top-1/2 left-1/2 h-[40vmax] w-[40vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/[0.05] blur-[80px] animate-auth-orb-slow" />
          <div className="absolute top-2/3 left-1/3 h-[30vmax] w-[30vmax] rounded-full bg-primary/[0.04] blur-[70px] animate-auth-orb-slower" />
          {/* Dot grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
              backgroundSize: "32px 32px",
            }}
          />
          {/* Top highlight line */}
          <div
            className="absolute inset-x-0 top-0 h-px opacity-20"
            style={{ background: "linear-gradient(90deg, transparent, var(--primary), transparent)" }}
          />
        </div>

        <header className="relative z-10 flex items-center justify-end p-4 sm:p-6">
          <ThemeToggle />
        </header>

        <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
          <LoginHero onOpenAuth={handleOpenAuth} />
        </main>
      </div>

      <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <DialogContent
          className="max-h-[90vh] max-w-4xl overflow-y-auto gap-0 p-0"
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
    </>
  );
}
