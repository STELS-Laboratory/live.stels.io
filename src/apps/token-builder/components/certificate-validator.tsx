/**
 * Certificate Validator Component
 * Load and validate existing token certificates
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  Bug,
  Check,
  CheckCircle,
  FileJson,
  Shield,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  detectCertificateType,
  exportCertificate,
  verifyTokenCertificate,
} from "../signing";
import { recreateSignatureVerificationData } from "../utils/signature-debugger";
import type { TokenGenesisCertificate } from "../types";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "@/hooks/use_theme";

interface CertificateValidatorProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Certificate Validator Component
 */
export function CertificateValidator({
  isOpen,
  onClose,
}: CertificateValidatorProps): React.ReactElement | null {
  const { resolvedTheme } = useTheme();

  const [jsonInput, setJsonInput] = useState("");
  const [certificate, setCertificate] = useState<
    TokenGenesisCertificate | null
  >(
    null,
  );
  const [validating, setValidating] = useState(false);
  const [skipCrypto, setSkipCrypto] = useState(false);
  const [validationResult, setValidationResult] = useState<
    {
      valid: boolean;
      errors: string[];
      type?: "token" | "genesis" | "unknown";
      skippedCrypto?: boolean;
    } | null
  >(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [debugData, setDebugData] = useState<
    {
      canonical: string;
      domain: string;
      message: string;
      publicKey: string;
      signature: string;
    } | null
  >(null);

  if (!isOpen) return null;

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInput(content);
      handleParse(content);
    };
    reader.readAsText(file);
  };

  // Parse JSON
  const handleParse = (json: string): void => {
    try {
      const parsed = JSON.parse(json);
      setCertificate(parsed);
      setValidationResult(null);
    } catch {
      setCertificate(null);
      setValidationResult({
        valid: false,
        errors: ["Invalid JSON format"],
      });
    }
  };

  // Detect certificate type
  // Validate certificate
  const handleValidate = async (): Promise<void> => {
    if (!certificate) {
      setValidationResult({
        valid: false,
        errors: ["No certificate loaded"],
      });
      return;
    }

    setValidating(true);
    const errors: string[] = [];

    try {
      // Detect certificate type using centralized function
      const certType = detectCertificateType(
        certificate as Record<string, unknown>,
      );

      // Handle genesis.json (network genesis document)
      if (certType === "genesis") {
        // Genesis documents have different structure validation
        const genesisErrors: string[] = [];

        const cert = certificate as Record<string, unknown>;

        // Validate genesis-specific fields
        if (!cert.genesis) genesisErrors.push("Missing genesis data");
        if (!cert.network) genesisErrors.push("Missing network configuration");
        if (!cert.protocol) {
          genesisErrors.push("Missing protocol configuration");
        }
        if (!cert.content) genesisErrors.push("Missing content hash");
        if (!cert.signatures) genesisErrors.push("Missing signatures");

        // Check genesis.id format
        if (cert.genesis && typeof cert.genesis === "object") {
          const genesisObj = cert.genesis as Record<string, unknown>;
          if (!genesisObj.id) {
            genesisErrors.push("Genesis: Missing ID");
          } else if (
            typeof genesisObj.id === "string" &&
            !genesisObj.id.startsWith("genesis:")
          ) {
            genesisErrors.push("Genesis: ID must start with 'genesis:'");
          }
        }

        setValidationResult({
          valid: genesisErrors.length === 0,
          errors: genesisErrors,
          type: "genesis",
        });
        setValidating(false);
        return;
      }

      // Handle unknown type
      if (certType === "unknown") {
        setValidationResult({
          valid: false,
          errors: [
            "Unknown certificate format",
            "Expected: Token Certificate (token.id) or Genesis Document (genesis.id)",
          ],
          type: "unknown",
        });
        setValidating(false);
        return;
      }

      // Basic structure validation for token certificates (NEW genesis-compliant structure)
      if (!certificate.token) errors.push("Missing token data");
      if (!certificate.network) errors.push("Missing network configuration");
      if (!certificate.protocol) errors.push("Missing protocol configuration");
      if (
        !certificate.signatures || !certificate.signatures.signers ||
        certificate.signatures.signers.length === 0
      ) {
        errors.push("Missing signatures");
      }

      // Token data validation
      if (certificate.token) {
        if (!certificate.token.id) errors.push("Token: Missing ID");
        if (!certificate.token.created_at) {
          errors.push("Token: Missing creation timestamp");
        }
        if (!certificate.token.issuer) {
          errors.push("Token: Missing issuer information");
        }
        if (!certificate.token.standard) {
          errors.push("Token: Missing token standard");
        }
        if (!certificate.token.metadata) {
          errors.push("Token: Missing metadata");
        } else {
          if (!certificate.token.metadata.name) {
            errors.push("Token: Missing token name");
          }
          if (!certificate.token.metadata.symbol) {
            errors.push("Token: Missing token symbol");
          }
        }
        if (!certificate.token.economics) {
          errors.push("Token: Missing economics");
        } else if (!certificate.token.economics.supply) {
          errors.push("Token: Missing supply configuration");
        }
      }

      // Cryptographic verification (if not skipped)
      if (errors.length === 0 && !skipCrypto) {
        const isValid = await verifyTokenCertificate(certificate);
        if (!isValid) {
          errors.push("Cryptographic verification failed");
        }
      }

      setValidationResult({
        valid: errors.length === 0,
        errors: errors,
        type: "token",
        skippedCrypto: skipCrypto,
      });
    } catch (error) {
      setValidationResult({
        valid: false,
        errors: [
          error instanceof Error ? error.message : "Validation failed",
        ],
      });
    } finally {
      setValidating(false);
    }
  };

  // Debug signature verification data
  const handleDebugSignature = (): void => {
    if (!certificate) {
      console.warn("[Debug] No certificate loaded");
      return;
    }

    console.log("\n🔍 === SIGNATURE DEBUG MODE ===");

    // Recreate verification data
    const data = recreateSignatureVerificationData(certificate);
    setDebugData(data);
    setShowDebugInfo(true);

    console.log("Canonical length:", data.canonical.length);
    console.log("Canonical (first 200):", data.canonical.substring(0, 200));
    console.log("Domain:", data.domain);
    console.log("Message length:", data.message.length);
    console.log("Message (first 300):", data.message.substring(0, 300));
    console.log("Public Key:", data.publicKey);
    console.log("Signature:", data.signature);

    // Copy to clipboard for comparison with server
    const debugOutput = JSON.stringify(
      {
        canonical: data.canonical,
        canonicalLength: data.canonical.length,
        domain: data.domain,
        messageLength: data.message.length,
        messageFirst300: data.message.substring(0, 300),
        publicKey: data.publicKey,
        publicKeyLength: data.publicKey.length,
        signature: data.signature,
        signatureLength: data.signature.length,
      },
      null,
      2,
    );

    navigator.clipboard.writeText(debugOutput).then(() => {
      console.log("✅ Debug data copied to clipboard!");
    }).catch(() => {
      console.warn("Failed to copy to clipboard");
    });
  };

  // Clear all
  const handleClear = (): void => {
    setJsonInput("");
    setCertificate(null);
    setValidationResult(null);
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl h-[92vh] flex flex-col bg-card border border-border rounded shadow-xl overflow-hidden">
        {/* Header */}
        <div className="border-b border-border bg-muted/20 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-500/20 rounded">
                <Shield className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Certificate Validator
                </h2>
                <p className="text-xs text-muted-foreground">
                  Verify token genesis certificates
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
          <div className="space-y-4">
            {/* Upload Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Load Certificate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* File Upload */}
                <div>
                  <label
                    htmlFor="file-upload"
                    className="block w-full p-3 border-2 border-dashed border-border rounded cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FileJson className="w-6 h-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Click to upload certificate.json
                      </span>
                    </div>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Or paste JSON */}
                <div className="relative">
                  <div className="absolute left-3 top-2 text-xs text-muted-foreground">
                    Or paste JSON:
                  </div>
                  <Textarea
                    value={jsonInput}
                    onChange={(e) => {
                      setJsonInput(e.target.value);
                      handleParse(e.target.value);
                    }}
                    placeholder=""
                    className="min-h-[120px] text-xs font-mono pt-7"
                  />
                </div>

                {/* Validation Options */}
                <div className="p-2 bg-muted/30 rounded border border-border">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={skipCrypto}
                      onChange={(e) => setSkipCrypto(e.target.checked)}
                      className="w-3.5 h-3.5"
                    />
                    <span className="text-xs text-muted-foreground">
                      Skip cryptographic verification (structure only)
                    </span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleValidate}
                    disabled={!certificate || validating}
                    size="sm"
                    className="flex-1 h-7 text-xs bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    {validating ? "Validating..." : "Validate"}
                  </Button>
                  <Button
                    onClick={handleDebugSignature}
                    disabled={!certificate}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    <Bug className="w-3 h-3 mr-1" />
                    Debug
                  </Button>
                  <Button
                    onClick={handleClear}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Validation Result */}
            {validationResult && (
              <Card
                className={cn(
                  "border-2",
                  validationResult.type === "genesis"
                    ? "border-blue-500/50 bg-blue-500/5"
                    : validationResult.valid
                    ? "border-green-500/50 bg-green-500/5"
                    : "border-red-500/50 bg-red-500/5",
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {validationResult.type === "genesis"
                      ? (
                        <AlertCircle className="w-6 h-6 text-blue-500 flex-shrink-0" />
                      )
                      : validationResult.valid
                      ? (
                        <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                      )
                      : (
                        <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                      )}
                    <div className="flex-1">
                      <h3
                        className={cn(
                          "text-sm font-bold mb-2",
                          validationResult.type === "genesis"
                            ? "text-blue-600 dark:text-blue-500"
                            : validationResult.valid
                            ? "text-green-600 dark:text-green-500"
                            : "text-red-600 dark:text-red-500",
                        )}
                      >
                        {validationResult.type === "genesis"
                          ? "ℹ️ Genesis Certificate"
                          : validationResult.valid
                          ? "✓ Certificate is Valid"
                          : "✗ Certificate is Invalid"}
                      </h3>

                      {validationResult.type === "genesis"
                        ? (
                          <div>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                              ℹ️ Genesis Document Detected
                            </p>
                            <div className="text-xs text-muted-foreground mb-3 space-y-1">
                              <p>
                                This is a{" "}
                                <strong>
                                  STELS Network Genesis certificate
                                </strong>{" "}
                                (genesis.json), not a token certificate.
                              </p>
                              <p className="font-mono text-[10px] bg-blue-500/10 p-1.5 rounded">
                                Structure: genesis.id (network genesis)
                              </p>
                              <p>
                                Genesis certificates use a different signing
                                protocol than token certificates.
                              </p>
                            </div>
                            <div className="p-2 bg-muted/30 rounded border border-border">
                              <p className="text-xs text-muted-foreground">
                                ✓ Structure validation passed
                                {validationResult.errors.length === 0 && (
                                  <>
                                    <br />
                                    ⚠ Cryptographic verification requires
                                    genesis-specific tools
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                        )
                        : validationResult.valid
                        ? (
                          <div>
                            <p className="text-xs text-green-600 dark:text-green-500 mb-2">
                              ℹ️ Token Certificate Validated
                            </p>
                            <div className="text-xs text-muted-foreground mb-3 space-y-1">
                              <p>
                                This is a{" "}
                                <strong>Token Genesis Certificate</strong>{" "}
                                created with Token Builder.
                              </p>
                              <p className="font-mono text-[10px] bg-green-500/10 p-1.5 rounded">
                                Structure: token.id (token certificate)
                              </p>
                            </div>
                            <div className="p-2 bg-muted/30 rounded border border-border">
                              <p className="text-xs text-muted-foreground">
                                ✓ All required fields are present and valid.
                                {validationResult.skippedCrypto
                                  ? " Structure validation passed."
                                  : " The signature is cryptographically verified and matches the schema content."}
                              </p>
                              {validationResult.skippedCrypto && (
                                <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                                  ⚠️ Cryptographic verification was skipped
                                </p>
                              )}
                            </div>
                          </div>
                        )
                        : (
                          <div>
                            {validationResult.type === "unknown"
                              ? (
                                <div>
                                  <p className="text-xs text-red-600 dark:text-red-500 mb-2">
                                    ⚠️ Unknown Document Format
                                  </p>
                                  <div className="text-xs text-muted-foreground mb-3 space-y-1">
                                    <p>
                                      The document does not match known
                                      certificate formats.
                                    </p>
                                    <p className="font-semibold">
                                      Expected formats:
                                    </p>
                                    <div className="space-y-1 ml-2">
                                      <p className="font-mono text-[10px] bg-muted/50 p-1.5 rounded">
                                        • Token Certificate:{" "}
                                        <span className="text-green-600">
                                          token.id
                                        </span>
                                      </p>
                                      <p className="font-mono text-[10px] bg-muted/50 p-1.5 rounded">
                                        • Genesis Document:{" "}
                                        <span className="text-blue-600">
                                          genesis.id
                                        </span>
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )
                              : (
                                <p className="text-xs text-muted-foreground mb-2">
                                  The following issues were found:
                                </p>
                              )}
                            <ul className="space-y-1">
                              {validationResult.errors.map((error, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2 text-xs text-red-600 dark:text-red-500"
                                >
                                  <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                  <span>{error}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Certificate Details */}
            {certificate && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileJson className="w-4 h-4" />
                    Certificate Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Token Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 bg-muted/30 rounded border border-border">
                      <div className="text-xs text-muted-foreground mb-1">
                        Token Name
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {certificate.token.metadata.name}
                      </div>
                    </div>

                    <div className="p-2 bg-muted/30 rounded border border-border">
                      <div className="text-xs text-muted-foreground mb-1">
                        Symbol
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {certificate.token.metadata.symbol}
                      </div>
                    </div>

                    <div className="p-2 bg-muted/30 rounded border border-border">
                      <div className="text-xs text-muted-foreground mb-1">
                        Standard
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {certificate.token.standard}
                      </Badge>
                    </div>

                    <div className="p-2 bg-muted/30 rounded border border-border">
                      <div className="text-xs text-muted-foreground mb-1">
                        Initial Supply
                      </div>
                      <div className="text-sm font-mono text-foreground">
                        {certificate.token.economics.supply.initial}
                      </div>
                    </div>
                  </div>

                  {/* Certificate Info */}
                  <div className="p-3 bg-background rounded border border-border">
                    <div className="text-xs font-semibold text-foreground mb-2">
                      Certificate Information
                    </div>
                    <div className="space-y-1 text-xs font-mono text-muted-foreground">
                      <div className="flex justify-between">
                        <span>ID:</span>
                        <span className="text-foreground">
                          {certificate.token.id.substring(0, 32)}...
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Network:</span>
                        <span className="text-foreground">
                          {certificate.network.name}{" "}
                          (chain:{certificate.network.chain_id})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Protocol:</span>
                        <span className="text-foreground">
                          {certificate.protocol.tx_version}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span className="text-foreground">
                          {new Date(certificate.token.created_at)
                            .toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Issuer:</span>
                        <span className="text-foreground">
                          {certificate.token.issuer.address.substring(0, 16)}...
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hash:</span>
                        <span className="text-foreground">
                          {certificate.content.hash.substring(7, 23)}...
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Size:</span>
                        <span className="text-foreground">
                          {certificate.content.size} bytes
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Signatures:</span>
                        <span className="text-foreground">
                          {certificate.signatures.signers.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="p-3 bg-background rounded border border-border">
                    <div className="text-xs font-semibold text-foreground mb-2">
                      Signatures ({certificate.signatures.signers.length})
                    </div>
                    {certificate.signatures.signers.map((sig, idx) => (
                      <div
                        key={idx}
                        className="mb-2 last:mb-0 p-2 bg-muted/30 rounded"
                      >
                        <div className="text-[10px] text-muted-foreground mb-1">
                          Signature {idx + 1}
                        </div>
                        <div className="space-y-1 text-xs font-mono">
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground w-12 flex-shrink-0">
                              Key:
                            </span>
                            <span className="text-foreground break-all">
                              {sig.kid}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground w-12 flex-shrink-0">
                              Alg:
                            </span>
                            <span className="text-foreground">{sig.alg}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground w-12 flex-shrink-0">
                              Sig:
                            </span>
                            <span className="text-foreground break-all">
                              {sig.sig.substring(0, 48)}...
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Readable Format */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-semibold text-foreground">
                        Readable Certificate
                      </div>
                    </div>
                    <div className="rounded border border-border overflow-hidden">
                      <SyntaxHighlighter
                        language="text"
                        style={resolvedTheme === "dark" ? oneDark : oneLight}
                        customStyle={{
                          margin: 0,
                          padding: "12px",
                          fontSize: "10px",
                          lineHeight: "1.5",
                          background: resolvedTheme === "dark"
                            ? "#1a1a1a"
                            : "#fafafa",
                        }}
                        wrapLongLines={false}
                      >
                        {exportCertificate(certificate, "readable")}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Debug Info */}
            {showDebugInfo && debugData && (
              <Card className="border-amber-500/50 bg-amber-500/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Bug className="w-4 h-4 text-amber-500" />
                      Signature Debug Information
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDebugInfo(false)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-xs">
                    <div className="p-2 bg-muted/30 rounded border border-border">
                      <div className="text-muted-foreground mb-1 font-medium">
                        Domain:
                      </div>
                      <code className="text-foreground font-mono">
                        {debugData.domain}
                      </code>
                    </div>

                    <div className="p-2 bg-muted/30 rounded border border-border">
                      <div className="text-muted-foreground mb-1 font-medium">
                        Canonical (length: {debugData.canonical.length}):
                      </div>
                      <div className="max-h-32 overflow-y-auto">
                        <code className="text-[10px] text-foreground font-mono break-all">
                          {debugData.canonical.substring(0, 500)}
                          {debugData.canonical.length > 500 && "..."}
                        </code>
                      </div>
                    </div>

                    <div className="p-2 bg-muted/30 rounded border border-border">
                      <div className="text-muted-foreground mb-1 font-medium">
                        Message (length: {debugData.message.length}):
                      </div>
                      <div className="max-h-32 overflow-y-auto">
                        <code className="text-[10px] text-foreground font-mono break-all">
                          {debugData.message.substring(0, 500)}
                          {debugData.message.length > 500 && "..."}
                        </code>
                      </div>
                    </div>

                    <div className="p-2 bg-muted/30 rounded border border-border">
                      <div className="text-muted-foreground mb-1 font-medium">
                        Public Key (kid, length: {debugData.publicKey.length}):
                      </div>
                      <code className="text-[10px] text-foreground font-mono break-all">
                        {debugData.publicKey}
                      </code>
                      {debugData.publicKey.length === 130 &&
                          debugData.publicKey.startsWith("04")
                        ? (
                          <div className="text-green-600 dark:text-green-400 mt-1 font-medium">
                            ✅ Uncompressed format (130 chars, starts with 04)
                          </div>
                        )
                        : (
                          <div className="text-red-600 dark:text-red-400 mt-1 font-medium">
                            ❌ Wrong format! Expected 130 chars starting with 04
                          </div>
                        )}
                    </div>

                    <div className="p-2 bg-muted/30 rounded border border-border">
                      <div className="text-muted-foreground mb-1 font-medium">
                        Signature (DER hex, length:{" "}
                        {debugData.signature.length}):
                      </div>
                      <code className="text-[10px] text-foreground font-mono break-all">
                        {debugData.signature}
                      </code>
                    </div>

                    <div className="p-3 bg-amber-500/10 rounded border border-amber-500/30">
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-2">
                        📋 Debug data copied to clipboard!
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Compare this output with server logs to find
                        discrepancies in:
                      </p>
                      <ul className="text-xs text-muted-foreground ml-4 mt-1 space-y-0.5">
                        <li>
                          • Canonical serialization (deterministicStringify)
                        </li>
                        <li>• Domain separator format</li>
                        <li>• Public key format (must be uncompressed)</li>
                        <li>• Message construction (domain + canonical)</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-muted/20 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            {certificate && (
              <Badge variant="outline" className="text-xs">
                {certificate.token.metadata.symbol}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {validationResult && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs px-2 py-1 rounded",
                  validationResult.type === "genesis"
                    ? "bg-blue-500/20 text-blue-600"
                    : validationResult.valid
                    ? "bg-green-500/20 text-green-600"
                    : "bg-red-500/20 text-red-600",
                )}
              >
                {validationResult.type === "genesis"
                  ? <AlertCircle className="w-3 h-3" />
                  : validationResult.valid
                  ? <Check className="w-3 h-3" />
                  : <X className="w-3 h-3" />}
                <span>
                  {validationResult.type === "genesis"
                    ? "Genesis"
                    : validationResult.valid
                    ? "Valid"
                    : "Invalid"}
                </span>
              </div>
            )}
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
    </div>
  );
}

export default CertificateValidator;
