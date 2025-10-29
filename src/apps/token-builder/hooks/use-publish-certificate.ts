/**
 * Hook for publishing token certificates to the STELS network
 * Sends signed certificates via WebFix protocol
 */

import { useState, useCallback } from "react";
import { useAuthStore } from "@/stores/modules/auth.store";
import type { TokenGenesisCertificate } from "../types";

interface PublishResult {
  success: boolean;
  message: string;
  txId?: string;
}

interface PublishState {
  isPublishing: boolean;
  publishResult: PublishResult | null;
  publishError: string | null;
}

/**
 * WebFix setAsset request format
 */
interface SetAssetRequest {
  webfix: string;
  method: string;
  body: {
    genesis: TokenGenesisCertificate;
    publicKey: string;
    signature: string;
    address: string;
    domain?: string; // Sign domain for verification
  };
}

/**
 * Hook for publishing certificates to the network
 * @returns Publishing state and publish function
 */
export function usePublishCertificate(): PublishState & {
  publish: (certificate: TokenGenesisCertificate) => Promise<PublishResult>;
  reset: () => void;
} {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const connectionSession = useAuthStore((state) => state.connectionSession);
  const isConnected = useAuthStore((state) => state.isConnected);

  /**
   * Publish certificate to the network
   */
  const publish = useCallback(
    async (certificate: TokenGenesisCertificate): Promise<PublishResult> => {
      setIsPublishing(true);
      setPublishError(null);
      setPublishResult(null);

      try {
        // Validate connection
        if (!isConnected || !connectionSession) {
          throw new Error("Not connected to network. Please connect wallet first.");
        }

        // Validate certificate
        if (!certificate.signatures || !certificate.signatures.signers || certificate.signatures.signers.length === 0) {
          throw new Error("Certificate has no signatures");
        }

        const mainSignature = certificate.signatures.signers[0];
        if (!mainSignature) {
          throw new Error("Invalid certificate signature");
        }

        // Prepare WebFix setAsset request
        // CRITICAL: Use issuer.public_key (uncompressed), not signature.kid (compressed)!
        // CRITICAL: Include domain explicitly for server verification
        const domain = certificate.protocol.sign_domains.token.join(":");
        
        const request: SetAssetRequest = {
          webfix: "1.0",
          method: "setAsset",
          body: {
            genesis: certificate,
            publicKey: certificate.token.issuer.public_key, // Uncompressed format (130 chars)
            signature: mainSignature.sig,
            address: certificate.token.issuer.address,
            domain: domain, // Explicitly include domain for server verification
          },
        };

        console.log("[PublishCertificate] Sending setAsset request:", {
          method: request.method,
          tokenId: certificate.token.id,
          network: certificate.network.name,
          apiUrl: connectionSession.api,
        });
        
        console.log("[PublishCertificate] ═══════════════════════════════════════");
        console.log("[PublishCertificate] Request body.publicKey:", request.body.publicKey);
        console.log("[PublishCertificate] Request body.publicKey length:", request.body.publicKey.length);
        console.log("[PublishCertificate] Request body.signature:", request.body.signature);
        console.log("[PublishCertificate] Request body.address:", request.body.address);
        console.log("[PublishCertificate] Request body.domain:", request.body.domain);
        console.log("[PublishCertificate] genesis.protocol.sign_domains.token:", certificate.protocol.sign_domains.token);
        console.log("[PublishCertificate] genesis.token.issuer.public_key:", certificate.token.issuer.public_key);
        console.log("[PublishCertificate] genesis.signatures.signers[0].kid:", certificate.signatures.signers[0].kid);
        console.log("[PublishCertificate] genesis.signatures.signers[0].sig:", certificate.signatures.signers[0].sig);
        console.log("[PublishCertificate] All three public keys match:", 
          request.body.publicKey === certificate.token.issuer.public_key &&
          certificate.token.issuer.public_key === certificate.signatures.signers[0].kid
        );
        console.log("[PublishCertificate] Signatures match:", 
          request.body.signature === certificate.signatures.signers[0].sig
        );
        console.log("[PublishCertificate] ═══════════════════════════════════════");

        // Send to server with session header
        const response = await fetch(connectionSession.api, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Stels-Session": connectionSession.session,
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Server responded with status ${response.status}: ${errorText}`,
          );
        }

        const result = await response.json();
        console.log("[PublishCertificate] Server response:", result);

        // Check for errors in response
        if (result.error) {
          throw new Error(result.error);
        }

        // Success
        const successResult: PublishResult = {
          success: true,
          message: "Token certificate published successfully",
          txId: result.txId || result.id || certificate.token.id,
        };

        setPublishResult(successResult);
        return successResult;
      } catch (error) {
        console.error("[PublishCertificate] Failed to publish:", error);

        const errorMessage =
          error instanceof Error ? error.message : "Failed to publish certificate";
        setPublishError(errorMessage);

        const failureResult: PublishResult = {
          success: false,
          message: errorMessage,
        };

        setPublishResult(failureResult);
        return failureResult;
      } finally {
        setIsPublishing(false);
      }
    },
    [isConnected, connectionSession],
  );

  /**
   * Reset publishing state
   */
  const reset = useCallback(() => {
    setIsPublishing(false);
    setPublishResult(null);
    setPublishError(null);
  }, []);

  return {
    isPublishing,
    publishResult,
    publishError,
    publish,
    reset,
  };
}

