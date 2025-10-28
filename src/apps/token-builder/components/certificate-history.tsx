/**
 * Certificate History Component
 * Display history of created token certificates
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Download, FileJson, Trash2, X } from "lucide-react";
import { exportCertificate } from "../signing";
import type { TokenGenesisCertificate } from "../types";
import { useTokenBuilderStore } from "../store";

interface CertificateHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Certificate History Modal
 * Shows list of previously created certificates
 */
export function CertificateHistory({
  isOpen,
  onClose,
}: CertificateHistoryProps): React.ReactElement | null {
  const certificateHistory = useTokenBuilderStore(
    (state) => state.certificateHistory,
  );

  // Filter only genesis-compliant certificates (new format)
  const genesisCompliantHistory = certificateHistory.filter(
    (cert) => cert.token !== undefined,
  );

  if (!isOpen) return null;

  /**
   * Export certificate by index
   */
  const handleExport = (cert: TokenGenesisCertificate): void => {
    const json = exportCertificate(cert, "json");
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `token-${cert.token.metadata.symbol}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Clear all history
   */
  const handleClearHistory = (): void => {
    // Clear history without confirmation - user can recreate tokens if needed
    useTokenBuilderStore.setState({ certificateHistory: [] });
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl h-[85vh] flex flex-col bg-card border border-border rounded shadow-xl overflow-hidden">
        {/* Header */}
        <div className="border-b border-border bg-muted/20 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-500/20 rounded">
                <Clock className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Certificate History
                </h2>
                <p className="text-xs text-muted-foreground">
                  {genesisCompliantHistory.length} token
                  {genesisCompliantHistory.length === 1 ? "" : "s"} created
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {genesisCompliantHistory.length === 0
            ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <FileJson className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  No genesis-compliant certificates created yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create your first token to see it here
                </p>
              </div>
            )
            : (
              <div className="space-y-3">
                {genesisCompliantHistory.map((cert) => (
                  <Card
                    key={cert.token.id}
                    className="border-border hover:bg-muted/30 transition-colors"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        {/* Token Icon */}
                        <div className="w-12 h-12 border border-border rounded overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                          {cert.token.metadata.icon
                            ? (
                              <img
                                src={cert.token.metadata.icon}
                                alt={cert.token.metadata.symbol}
                                className="w-full h-full object-contain"
                              />
                            )
                            : (
                              <FileJson className="w-6 h-6 text-muted-foreground" />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-sm font-semibold text-foreground">
                              {cert.token.metadata.name}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {cert.token.metadata.symbol}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-blue-500/10 border-blue-500/30 text-blue-600"
                            >
                              {cert.token.standard}
                            </Badge>
                          </div>

                          <div className="text-xs font-mono text-muted-foreground space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">ID:</span>
                              <span className="truncate">
                                {cert.token.id.substring(0, 48)}...
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                Network:
                              </span>
                              <span>
                                {cert.network.name}{" "}
                                (chain:{cert.network.chain_id})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                Created:
                              </span>
                              <span>
                                {new Date(cert.token.created_at)
                                  .toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                Supply:
                              </span>
                              <span>
                                {cert.token.economics.supply.initial}
                              </span>
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleExport(cert)}
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs flex-shrink-0"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Export
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-muted/20 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div>
            {genesisCompliantHistory.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearHistory}
                className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-500/10"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear History
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-7 text-xs"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CertificateHistory;
