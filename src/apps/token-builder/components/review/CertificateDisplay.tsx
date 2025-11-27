/**
 * Certificate Display Component
 * Shows created certificate with export options
 */

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Coins, Download, Loader2, Upload } from "lucide-react";
import { useTokenBuilderStore } from "../../store";
import { useExportCertificate } from "../../hooks/use-export-certificate";
import { useTokenToast } from "../../hooks/use-token-toast";
import { usePublishCertificate } from "../../hooks/use-publish-certificate";
import { useAuthStore } from "@/stores/modules/auth.store";
import { VALIDATION_MESSAGES } from "../../utils";

/**
 * Certificate Display - shows created certificate
 */
export const CertificateDisplay = React.memo(
  function CertificateDisplay(): React.ReactElement | null {
    const certificate = useTokenBuilderStore((state) => state.certificate);
    const resetBuilder = useTokenBuilderStore((state) => state.resetBuilder);

    const { exportCert } = useExportCertificate();
    const { showSuccess, showError, showCertificateExported } = useTokenToast();
    const { publish, isPublishing, publishResult } = usePublishCertificate();

    const isConnected = useAuthStore((state) => state.isConnected);
    const connectionSession = useAuthStore((state) => state.connectionSession);

    const [isPublished, setIsPublished] = useState(false);
    const [autoPublishAttempted, setAutoPublishAttempted] = useState(false);

    // Auto-publish certificate immediately after creation
    useEffect(() => {
      if (
        certificate && isConnected && !isPublished && !autoPublishAttempted &&
        !isPublishing
      ) {

        setAutoPublishAttempted(true);

        publish(certificate)
          .then((result) => {
            if (result.success) {
              setIsPublished(true);
              showSuccess(
                "Token Published!",
                `Token ${certificate.token.metadata.symbol} published to ${certificate.network.name}`,
              );
            } else {

              // Don't show error to user - they can manually publish
            }
          })
          .catch(() => {
            // Don't show error to user - they can manually publish
          });
      }
    }, [
      certificate,
      isConnected,
      isPublished,
      autoPublishAttempted,
      isPublishing,
      publish,
      showSuccess,
    ]);

    // Don't show if no certificate
    if (!certificate) return null;

    /**
     * Export certificate to JSON file
     */
    const handleExport = (): void => {
      if (exportCert(certificate)) {
        showCertificateExported();
      } else {
        showError(VALIDATION_MESSAGES.EXPORT_FAILED);
      }
    };

    /**
     * Create another token
     * Exports current certificate and resets wizard
     */
    const handleCreateAnother = (): void => {
      // Auto-export current certificate
      if (exportCert(certificate)) {
        resetBuilder();

        setTimeout(() => {
          showSuccess(
            "Ready to create new token",
            "Previous certificate exported successfully",
          );
        }, 100);
      } else {
        showError(VALIDATION_MESSAGES.EXPORT_FAILED);
      }
    };

    /**
     * Publish certificate to the network
     * Sends via WebFix setAsset method
     */
    const handlePublish = async (): Promise<void> => {
      try {
        const result = await publish(certificate);

        if (result.success) {
          setIsPublished(true);
          showSuccess(
            "Token Published!",
            `Token ${certificate.token.metadata.symbol} published to ${certificate.network.name}`,
          );
        } else {
          showError(result.message);
        }
      } catch {

        showError(
          error instanceof Error
            ? error.message
            : "Failed to publish certificate",
        );
      }
    };

    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-start gap-3 mb-2">
                {/* Token Icon */}
                {certificate.token.metadata.icon && (
                  <div className="w-12 h-12 border border-green-500/30 rounded overflow-hidden bg-background flex items-center justify-center flex-shrink-0">
                    <img
                      src={certificate.token.metadata.icon}
                      alt={certificate.token.metadata.symbol}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-xs font-semibold text-green-600 mb-1">
                    ✓ Genesis-Compliant Certificate Created!
                  </p>
                  <div className="text-xs font-mono text-muted-foreground space-y-1">
                    <div>
                      Token: {certificate.token.metadata.name}{" "}
                      ({certificate.token.metadata.symbol})
                    </div>
                    <div>ID: {certificate.token.id.substring(0, 40)}...</div>
                    <div>
                      Network: {certificate.network.name}{" "}
                      (chain:{certificate.network.chain_id})
                    </div>
                    <div>Protocol: {certificate.protocol.tx_version}</div>
                    <div>
                      Created:{" "}
                      {new Date(certificate.token.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {/* Publish to Network Button */}
                {isConnected && !isPublished && (
                  <Button
                    onClick={handlePublish}
                    disabled={isPublishing}
                    size="sm"
                    className="h-8 text-xs w-full bg-amber-500 hover:bg-amber-600 text-black font-bold"
                  >
                    {isPublishing
                      ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Publishing to Network...
                        </>
                      )
                      : (
                        <>
                          <Upload className="w-3 h-3 mr-1" />
                          Publish to {connectionSession?.network || "Network"}
                        </>
                      )}
                  </Button>
                )}

                {/* Published Status */}
                {isPublished && publishResult?.success && (
                  <div className="p-2 bg-green-500/10 border border-green-500/30 rounded">
                    <div className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500" />
                      <span className="text-xs font-semibold text-green-600 dark:text-green-500">
                        Published to {certificate.network.name}
                      </span>
                    </div>
                    {publishResult.txId && (
                      <div className="text-xs font-mono text-muted-foreground mt-1">
                        TX: {publishResult.txId.substring(0, 40)}...
                      </div>
                    )}
                  </div>
                )}

                {/* Connection Warning */}
                {!isConnected && (
                  <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded">
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      ℹ️ Connect wallet to publish certificate to the network
                    </p>
                  </div>
                )}

                {/* Export and Create Another Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleExport}
                    size="sm"
                    className="h-7 text-xs flex-1"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Export
                  </Button>
                  <Button
                    onClick={handleCreateAnother}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs flex-1"
                  >
                    <Coins className="w-3 h-3 mr-1" />
                    Create Another
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  },
);

export default CertificateDisplay;
