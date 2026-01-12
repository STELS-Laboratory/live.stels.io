/**
 * GitHub Authentication Component
 * Handles GitHub OAuth flow for user authentication
 */

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Github, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/modules/auth.store";

interface GitHubAuthProps {
  onSuccess?: () => void;
  onError?: () => void;
}

/**
 * Normalize backend URL for GitHub OAuth callback
 * GitHub requires exact match, so we normalize localhost/127.0.0.1/10.0.0.206 to 10.0.0.241
 * Or use explicit callback URL from environment if provided
 */
function normalizeCallbackUrl(backendUrl: string): string {
  // Check if explicit callback URL is configured
  const explicitCallbackUrl = import.meta.env.VITE_GITHUB_CALLBACK_URL;
  if (explicitCallbackUrl) {
    console.log("[GitHub Auth] Using explicit callback URL:", explicitCallbackUrl);
    return explicitCallbackUrl;
  }

  // Parse backend URL
  const url = new URL(backendUrl);

  // If backend URL already uses 10.0.0.241, use it as-is
  if (url.hostname === "10.0.0.241") {
    const callbackUrl = `${backendUrl}/auth/github/callback`;
    console.log("[GitHub Auth] Backend already uses 10.0.0.241, callback URL:", callbackUrl);
    return callbackUrl;
  }

  // For other local development IPs, normalize to 10.0.0.241
  // GitHub OAuth App must have this exact callback URL registered
  const localhostIPs = [
    "127.0.0.1",
    "0.0.0.0",
    "localhost",
  ];

  if (localhostIPs.includes(url.hostname)) {
    // Normalize to 10.0.0.241 for GitHub OAuth callback
    const callbackUrl = `http://10.0.0.241:${url.port || "8088"}/auth/github/callback`;
    console.log("[GitHub Auth] Normalized localhost to 10.0.0.241, callback URL:", callbackUrl);
    return callbackUrl;
  }

  // For other URLs, use as-is
  const callbackUrl = `${backendUrl}/auth/github/callback`;
  console.log("[GitHub Auth] Using backend URL as-is, callback URL:", callbackUrl);
  return callbackUrl;
}

/**
 * Get GitHub OAuth URL
 * Callback URL must be on the backend (8088) where GITHUB_CLIENT_SECRET is stored
 * Backend will handle code exchange and redirect back to client
 */
function getGitHubOAuthUrl(backendUrl: string): string {
  // Normalize callback URL to match GitHub OAuth App settings
  const redirectUri = normalizeCallbackUrl(backendUrl);

  // Get client ID from environment
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID || "";

  if (!clientId) {
    throw new Error(
      "GitHub Client ID is not configured. Please set VITE_GITHUB_CLIENT_ID environment variable.",
    );
  }

  // Generate state for CSRF protection
  // Include client origin so backend can redirect back
  const clientOrigin = window.location.origin;
  const state = btoa(JSON.stringify({
    timestamp: Date.now(),
    random: Math.random().toString(36).substring(7),
    clientOrigin: clientOrigin, // Backend will use this to redirect back
  }));

  // Store state in sessionStorage for verification
  sessionStorage.setItem("github_oauth_state", state);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read:user",
    state: state,
  });

  const oauthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
  console.log("[GitHub Auth] OAuth URL generated:", {
    backendUrl,
    redirectUri,
    clientId: clientId.substring(0, 8) + "...", // Log only first 8 chars for security
    oauthUrl: oauthUrl.substring(0, 100) + "...", // Log partial URL
  });

  return oauthUrl;
}

/**
 * GitHub Authentication Component
 */
export function GitHubAuth({
  onSuccess,
  onError,
}: GitHubAuthProps): React.ReactElement {
  const { selectedNetwork, connectWithGitHub, isConnecting, connectionError } =
    useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Check if GitHub Client ID is configured
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID || "";
  const isClientIdConfigured = Boolean(clientId);

  // Define handleGitHubAuth before useEffect to avoid initialization error
  const handleGitHubAuth = useCallback(async (code: string): Promise<void> => {
    if (!selectedNetwork) {
      setError("Please select a network first");
      return;
    }

    setError(null);
    setIsRedirecting(false);

    try {
      const success = await connectWithGitHub(code);
      if (success) {
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(connectionError || "GitHub authentication failed");
        if (onError) {
          onError();
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : "Unknown error occurred";
      setError(errorMessage);
      if (onError) {
        onError();
      }
    }
  }, [selectedNetwork, connectWithGitHub, connectionError, onSuccess, onError]);

  // Check if we're returning from backend redirect after GitHub OAuth
  // Flow: Client → GitHub → Backend callback (8088) → Backend redirects to Client
  // Backend processes callback, exchanges code for token using SECRET, then redirects back
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const errorParam = urlParams.get("error");
    const sessionParam = urlParams.get("session"); // Backend might pass session if secure
    const successParam = urlParams.get("success");

    // Handle errors immediately, even without selectedNetwork
    if (errorParam) {
      setError(`GitHub authentication error: ${errorParam}`);
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
      if (onError) {
        onError();
      }
      return;
    }

    // If we have code and state, we need to process OAuth callback
    // But we need selectedNetwork to proceed
    if (code && state) {
      // Verify state first (before checking selectedNetwork)
      const storedState = sessionStorage.getItem("github_oauth_state");
      if (!storedState || storedState !== state) {
        setError("Invalid state parameter. Possible CSRF attack.");
        // Clean URL
        const url = new URL(window.location.href);
        url.searchParams.delete("code");
        url.searchParams.delete("state");
        window.history.replaceState({}, "", url.toString());
        if (onError) {
          onError();
        }
        return;
      }

      // If selectedNetwork is not ready yet, wait for it
      // This can happen if user returns from GitHub before component fully mounts
      if (!selectedNetwork) {
        // Store code and state in sessionStorage to process later
        // They will be processed when selectedNetwork becomes available
        sessionStorage.setItem("github_oauth_pending_code", code);
        sessionStorage.setItem("github_oauth_pending_state", state);
        return;
      }

      // Clear state from storage
      sessionStorage.removeItem("github_oauth_state");
      sessionStorage.removeItem("github_oauth_pending_code");
      sessionStorage.removeItem("github_oauth_pending_state");

      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete("code");
      url.searchParams.delete("state");
      window.history.replaceState({}, "", url.toString());

      // Exchange code via API (backend might have already done this, but we call githubAuth to get session)
      handleGitHubAuth(code);
    }

    // If backend redirected with session token (if backend implements secure session passing)
    if (sessionParam && successParam === "true") {
      // Backend already authenticated and created session
      // Store session and mark as connected
      // Note: This requires backend to implement secure session passing
      // For now, we'll use the code exchange flow above
    }
  }, [onError, handleGitHubAuth, selectedNetwork]);

  // Process pending OAuth callback when selectedNetwork becomes available
  useEffect(() => {
    if (!selectedNetwork) {
      return;
    }

    // Check if there's a pending OAuth callback
    const pendingCode = sessionStorage.getItem("github_oauth_pending_code");
    const pendingState = sessionStorage.getItem("github_oauth_pending_state");

    if (pendingCode && pendingState) {
      // Verify state
      const storedState = sessionStorage.getItem("github_oauth_state");
      if (storedState && storedState === pendingState) {
        // Clear pending data
        sessionStorage.removeItem("github_oauth_state");
        sessionStorage.removeItem("github_oauth_pending_code");
        sessionStorage.removeItem("github_oauth_pending_state");

        // Process the callback
        handleGitHubAuth(pendingCode);
      } else {
        // Invalid state, clear pending data
        sessionStorage.removeItem("github_oauth_pending_code");
        sessionStorage.removeItem("github_oauth_pending_state");
        setError("Invalid state parameter. Please try again.");
      }
    }
  }, [selectedNetwork, handleGitHubAuth]);

  const handleGitHubLogin = useCallback((): void => {
    if (!selectedNetwork) {
      setError("Please select a network first");
      return;
    }

    try {
      setIsRedirecting(true);
      setError(null);
      // Use backend URL for callback
      const backendUrl = selectedNetwork.api.replace(/\/$/, ""); // Remove trailing slash
      const oauthUrl = getGitHubOAuthUrl(backendUrl);
      window.location.href = oauthUrl;
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : "Failed to initiate GitHub login";
      setError(errorMessage);
      setIsRedirecting(false);
      if (onError) {
        onError();
      }
    }
  }, [onError, selectedNetwork]);

  const displayError = error || connectionError;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center space-y-2">
        <div className="flex justify-center mb-2">
          <Github className="h-12 w-12 text-foreground" />
        </div>
        <CardTitle className="text-2xl font-bold">
          Sign in with GitHub
        </CardTitle>
        <CardDescription>
          Authenticate using your GitHub account to access STELS Web 5
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <div>{displayError}</div>
              {displayError.includes("VITE_GITHUB_CLIENT_ID") && (
                <div className="text-xs mt-2 space-y-1">
                  <p className="font-semibold">To fix this:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>
                      Create a{" "}
                      <code className="bg-muted px-1 py-0.5 rounded text-xs">
                        .env
                      </code>{" "}
                      file in the project root
                    </li>
                    <li>
                      Add:{" "}
                      <code className="bg-muted px-1 py-0.5 rounded text-xs">
                        VITE_GITHUB_CLIENT_ID=your_client_id_here
                      </code>
                    </li>
                    <li>Restart the development server</li>
                  </ol>
                  <p className="text-xs mt-2">
                    Get your Client ID from{" "}
                    <a
                      href="https://github.com/settings/developers"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-primary hover:text-primary/80"
                    >
                      GitHub Developer Settings
                    </a>
                  </p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {selectedNetwork && (
          <div className="text-sm text-muted-foreground text-center">
            Connecting to:{" "}
            <span className="font-semibold text-foreground">
              {selectedNetwork.name}
            </span>
          </div>
        )}

        <Button
          onClick={handleGitHubLogin}
          disabled={isConnecting || isRedirecting || !selectedNetwork ||
            !isClientIdConfigured}
          className="w-full h-12 text-base font-semibold"
          size="lg"
        >
          {isRedirecting
            ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Redirecting to GitHub...
              </>
            )
            : isConnecting
            ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting...
              </>
            )
            : (
              <>
                <Github className="mr-2 h-5 w-5" />
                Continue with GitHub
              </>
            )}
        </Button>

        {!isClientIdConfigured && !displayError && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <div className="font-semibold">
                GitHub Client ID is not configured
              </div>
              <div className="text-xs space-y-1">
                <p>To enable GitHub authentication:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>
                    Create a{" "}
                    <code className="bg-muted px-1 py-0.5 rounded">.env</code>
                    {" "}
                    file in the project root
                  </li>
                  <li>
                    Add:{" "}
                    <code className="bg-muted px-1 py-0.5 rounded">
                      VITE_GITHUB_CLIENT_ID=your_client_id
                    </code>
                  </li>
                  <li>Restart the development server</li>
                </ol>
                <p className="mt-2 font-semibold">
                  Important: GitHub OAuth App Configuration
                </p>
                <p className="text-xs">
                  In your GitHub OAuth App settings, set:
                  <br />
                  <code className="bg-muted px-1 py-0.5 rounded">
                    Authorization callback URL:
                    http://10.0.0.241:8088/auth/github/callback
                  </code>
                  <br />
                  <small className="text-muted-foreground">
                    (For local development, use localhost even if backend uses
                    IP address)
                  </small>
                  <br />
                  <small className="text-muted-foreground">
                    Or set{" "}
                    <code className="bg-muted px-1 py-0.5 rounded">
                      VITE_GITHUB_CALLBACK_URL
                    </code>{" "}
                    in .env to override
                  </small>
                </p>
                <p className="mt-2">
                  Get your Client ID from{" "}
                  <a
                    href="https://github.com/settings/developers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-primary hover:text-primary/80"
                  >
                    GitHub Developer Settings
                  </a>
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>
            By continuing, you agree to authenticate using your GitHub account.
          </p>
          <p>
            We only request read access to your user profile.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
