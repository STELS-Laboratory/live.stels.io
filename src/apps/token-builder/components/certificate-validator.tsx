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
  Check,
  CheckCircle,
  FileJson,
  Shield,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { exportCertificate, verifyTokenCertificate } from "../signing";
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
  const detectType = (
    cert: Record<string, unknown>,
  ): "token" | "genesis" | "unknown" => {
    if (cert.genesis && cert.network && cert.protocol) {
      return "genesis";
    }
    if (cert.id && cert.schema && cert.issuer) {
      return "token";
    }
    return "unknown";
  };

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
      // Detect certificate type
      const certType = detectType(
        certificate as unknown as Record<string, unknown>,
      );

      // Handle genesis.json
      if (certType === "genesis") {
        setValidationResult({
          valid: true,
          errors: [],
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
            "Unknown certificate format - not a token or genesis certificate",
          ],
          type: "unknown",
        });
        setValidating(false);
        return;
      }

      // Basic structure validation for token certificates
      if (!certificate.id) errors.push("Missing certificate ID");
      if (!certificate.createdAt) errors.push("Missing creation timestamp");
      if (!certificate.issuer) errors.push("Missing issuer information");
      if (!certificate.schema) errors.push("Missing token schema");
      if (!certificate.signatures || certificate.signatures.length === 0) {
        errors.push("Missing signatures");
      }

      // Schema validation
      if (certificate.schema) {
        if (!certificate.schema.version) {
          errors.push("Schema: Missing version");
        }
        if (!certificate.schema.standard) {
          errors.push("Schema: Missing token standard");
        }
        if (!certificate.schema.metadata) {
          errors.push("Schema: Missing metadata");
        } else {
          if (!certificate.schema.metadata.name) {
            errors.push("Schema: Missing token name");
          }
          if (!certificate.schema.metadata.symbol) {
            errors.push("Schema: Missing token symbol");
          }
        }
        if (!certificate.schema.economics) {
          errors.push("Schema: Missing economics");
        } else if (!certificate.schema.economics.supply) {
          errors.push("Schema: Missing supply configuration");
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

  // Clear all
  const handleClear = (): void => {
    setJsonInput("");
    setCertificate(null);
    setValidationResult(null);
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl h-[92vh] flex flex-col bg-card border border-border rounded-lg shadow-xl overflow-hidden">
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
                    {validating ? "Validating..." : "Validate Certificate"}
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
                              ℹ️ Genesis Certificate Detected
                            </p>
                            <p className="text-xs text-muted-foreground mb-2">
                              This is a STELS Network Genesis certificate
                              (genesis.json), not a token certificate. Genesis
                              certificates use a different signing protocol.
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ✓ Structure validation passed<br />
                              ⚠ Cryptographic verification requires
                              genesis-specific tools
                            </p>
                          </div>
                        )
                        : validationResult.valid
                        ? (
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">
                              ✓ All required fields are present and valid.
                              {validationResult.skippedCrypto
                                ? " Structure validation passed."
                                : " The signature is cryptographically verified and matches the schema content."}
                            </p>
                            {validationResult.skippedCrypto && (
                              <p className="text-xs text-amber-600 dark:text-amber-500">
                                ⚠️ Cryptographic verification was skipped
                              </p>
                            )}
                          </div>
                        )
                        : (
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">
                              The following issues were found:
                            </p>
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
                        {certificate.schema.metadata.name}
                      </div>
                    </div>

                    <div className="p-2 bg-muted/30 rounded border border-border">
                      <div className="text-xs text-muted-foreground mb-1">
                        Symbol
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {certificate.schema.metadata.symbol}
                      </div>
                    </div>

                    <div className="p-2 bg-muted/30 rounded border border-border">
                      <div className="text-xs text-muted-foreground mb-1">
                        Standard
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {certificate.schema.standard}
                      </Badge>
                    </div>

                    <div className="p-2 bg-muted/30 rounded border border-border">
                      <div className="text-xs text-muted-foreground mb-1">
                        Initial Supply
                      </div>
                      <div className="text-sm font-mono text-foreground">
                        {certificate.schema.economics.supply.initial}
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
                          {certificate.id.substring(0, 32)}...
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span className="text-foreground">
                          {new Date(certificate.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Issuer:</span>
                        <span className="text-foreground">
                          {certificate.issuer.address.substring(0, 16)}...
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
                          {certificate.signatures.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="p-3 bg-background rounded border border-border">
                    <div className="text-xs font-semibold text-foreground mb-2">
                      Signatures ({certificate.signatures.length})
                    </div>
                    {certificate.signatures.map((sig, idx) => (
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
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-muted/20 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            {certificate && (
              <Badge variant="outline" className="text-xs">
                {certificate.schema.metadata.symbol}
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
