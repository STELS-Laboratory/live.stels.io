/**
 * Token Builder Application
 * Professional tool for creating Web Tokens in STELS network
 */

import React, { useEffect, useState } from "react";
import { useMobile } from "@/hooks/use_mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Coins,
  Download,
  FileJson,
  Lock,
  RefreshCw,
  Shield,
  Smartphone,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTokenBuilderStore } from "./store";
import { TOKEN_TEMPLATES } from "./templates";
import { exportCertificate } from "./signing";
import { sanitizeInput } from "./validation";
import { CertificateValidator } from "./components/certificate-validator";
import { CertificateHistory } from "./components/certificate-history";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "@/hooks/use_theme";
import { useAuthWallet } from "./hooks/use-auth-wallet";
import type { TokenGenesisCertificate, TokenStandard } from "./types";

/**
 * Step 1: Token Type Selection
 * Choose token standard and load template
 */
const TypeStep = React.memo(function TypeStep(): React.ReactElement {
  const schema = useTokenBuilderStore((state) => state.schema);
  const errors = useTokenBuilderStore((state) => state.errors);
  const updateSchema = useTokenBuilderStore((state) => state.updateSchema);
  const loadTemplate = useTokenBuilderStore((state) => state.loadTemplate);
  const certificateHistory = useTokenBuilderStore(
    (state) => state.certificateHistory,
  );
  const [showAllHistory, setShowAllHistory] = useState(false);

  /**
   * Export certificate from history
   */
  const handleExportFromHistory = (cert: TokenGenesisCertificate): void => {
    const json = exportCertificate(cert, "json");
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `token-${cert.schema.metadata.symbol}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Show first 3 certificates by default
  const displayedHistory = showAllHistory
    ? certificateHistory
    : certificateHistory.slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Recently Created Tokens */}
      {certificateHistory.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-foreground">
              Recently Created Tokens
            </h3>
            {certificateHistory.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllHistory(!showAllHistory)}
                className="h-6 text-[10px] px-2"
              >
                {showAllHistory
                  ? "Show Less"
                  : `View All (${certificateHistory.length})`}
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {displayedHistory.map((cert) => (
              <Card
                key={cert.id}
                className="border-border hover:bg-muted/30 transition-colors"
              >
                <CardContent className="p-2.5">
                  <div className="flex items-center gap-2">
                    {/* Token Icon */}
                    <div className="w-8 h-8 border border-border rounded overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                      {cert.schema.metadata.icon
                        ? (
                          <img
                            src={cert.schema.metadata.icon}
                            alt={cert.schema.metadata.symbol}
                            className="w-full h-full object-contain"
                          />
                        )
                        : <Coins className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {cert.schema.metadata.name}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {cert.schema.metadata.symbol}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[9px] bg-blue-500/10 border-blue-500/30 text-blue-600"
                        >
                          {cert.schema.standard}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span>
                          {new Date(cert.createdAt).toLocaleDateString()}
                        </span>
                        <span>
                          Supply: {cert.schema.economics.supply.initial}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleExportFromHistory(cert)}
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 flex-shrink-0"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">
          Choose Template
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {TOKEN_TEMPLATES.filter((t) => t.popular).map((template) => (
            <button
              key={template.id}
              onClick={() => loadTemplate(template)}
              className={cn(
                "p-3 border rounded text-left transition-all hover:bg-muted",
                schema.standard === template.standard
                  ? "border-amber-500 bg-amber-500/5"
                  : "border-border",
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{template.icon}</span>
                <span className="text-sm font-medium">{template.name}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {template.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="standard" className="text-xs">
          Token Standard
        </Label>
        <Select
          value={schema.standard}
          onValueChange={(value) =>
            updateSchema({ standard: value as TokenStandard })}
        >
          <SelectTrigger id="standard" className="h-8 text-xs">
            <SelectValue placeholder="Select standard" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fungible">Fungible Token</SelectItem>
            <SelectItem value="non-fungible">Non-Fungible (NFT)</SelectItem>
            <SelectItem value="semi-fungible">Semi-Fungible</SelectItem>
            <SelectItem value="soulbound">Soulbound</SelectItem>
            <SelectItem value="wrapped">Wrapped Asset</SelectItem>
            <SelectItem value="governance">Governance</SelectItem>
            <SelectItem value="utility">Utility</SelectItem>
            <SelectItem value="security">Security</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
        {errors["standard"] && (
          <p className="text-xs text-red-500 mt-1">{errors["standard"][0]}</p>
        )}
      </div>
    </div>
  );
});

/**
 * Step 2: Token Metadata
 * Collect and sanitize token information
 */
const MetadataStep = React.memo(function MetadataStep(): React.ReactElement {
  const schema = useTokenBuilderStore((state) => state.schema);
  const errors = useTokenBuilderStore((state) => state.errors);
  const updateMetadata = useTokenBuilderStore((state) => state.updateMetadata);
  const [iconLoading, setIconLoading] = useState(false);
  const [iconPreview, setIconPreview] = useState<string | null>(
    schema.metadata?.icon || null,
  );

  /**
   * Handle icon file upload
   * Validates size (max 128KB) and converts to Data URL
   */
  const handleIconUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    // Validate file size (128KB)
    const maxSizeInBytes = 128 * 1024;
    if (file.size > maxSizeInBytes) {
      alert(
        `Icon size (${
          Math.round(file.size / 1024)
        }KB) exceeds maximum allowed size (128KB). Please upload a smaller image.`,
      );
      return;
    }

    setIconLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = (event): void => {
        const dataUrl = event.target?.result as string;
        setIconPreview(dataUrl);
        updateMetadata({ icon: dataUrl });
        setIconLoading(false);
      };
      reader.onerror = (): void => {
        alert("Failed to read file");
        setIconLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Icon upload error:", error);
      alert("Failed to upload icon");
      setIconLoading(false);
    }
  };

  /**
   * Remove icon
   */
  const handleIconRemove = (): void => {
    setIconPreview(null);
    updateMetadata({ icon: undefined });
    // Reset file input
    const fileInput = document.getElementById("icon") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="name" className="text-xs">
          Token Name *
        </Label>
        <Input
          id="name"
          value={schema.metadata?.name || ""}
          onChange={(e) =>
            updateMetadata({ name: sanitizeInput(e.target.value) })}
          placeholder="e.g., My Token"
          className="h-8 text-xs"
          maxLength={64}
        />
        {errors["metadata.name"] && (
          <p className="text-xs text-red-500 mt-1">
            {errors["metadata.name"][0]}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="symbol" className="text-xs">
          Token Symbol *
        </Label>
        <Input
          id="symbol"
          value={schema.metadata?.symbol || ""}
          onChange={(e) =>
            updateMetadata({
              symbol: sanitizeInput(e.target.value.toUpperCase()),
            })}
          placeholder="e.g., MTK"
          className="h-8 text-xs"
          maxLength={12}
        />
        {errors["metadata.symbol"] && (
          <p className="text-xs text-red-500 mt-1">
            {errors["metadata.symbol"][0]}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="description" className="text-xs">
          Description
        </Label>
        <Textarea
          id="description"
          value={schema.metadata?.description || ""}
          onChange={(e) =>
            updateMetadata({ description: sanitizeInput(e.target.value) })}
          placeholder="Describe your token..."
          className="text-xs min-h-[60px]"
          maxLength={512}
        />
      </div>

      <div>
        <Label htmlFor="icon" className="text-xs">
          Token Icon (max 128KB)
        </Label>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              id="icon"
              type="file"
              accept="image/*"
              onChange={handleIconUpload}
              disabled={iconLoading}
              className="h-8 text-xs file:text-xs file:mr-2"
            />
          </div>
          {iconPreview && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 border border-border rounded overflow-hidden bg-muted flex items-center justify-center">
                <img
                  src={iconPreview}
                  alt="Icon preview"
                  className="w-full h-full object-contain"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleIconRemove}
                className="h-7 w-7 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
        {iconLoading && (
          <p className="text-xs text-muted-foreground mt-1">Uploading...</p>
        )}
        {errors["metadata.icon"] && (
          <p className="text-xs text-red-500 mt-1">
            {errors["metadata.icon"][0]}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground mt-1">
          PNG, JPG, GIF, or SVG. Max 128KB.
        </p>
      </div>

      <div>
        <Label htmlFor="decimals" className="text-xs">
          Decimals
        </Label>
        <Input
          id="decimals"
          type="number"
          value={schema.metadata?.decimals || 6}
          onChange={(e) =>
            updateMetadata({ decimals: parseInt(e.target.value) || 0 })}
          min={0}
          max={18}
          className="h-8 text-xs"
        />
      </div>
    </div>
  );
});

/**
 * Step 3: Token Economics
 * Configure token supply and minting policy
 */
const EconomicsStep = React.memo(function EconomicsStep(): React.ReactElement {
  const schema = useTokenBuilderStore((state) => state.schema);
  const errors = useTokenBuilderStore((state) => state.errors);
  const updateEconomics = useTokenBuilderStore((state) =>
    state.updateEconomics
  );

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="initial" className="text-xs">
          Initial Supply *
        </Label>
        <Input
          id="initial"
          value={schema.economics?.supply?.initial || ""}
          onChange={(e) =>
            updateEconomics({
              supply: {
                ...schema.economics?.supply,
                initial: e.target.value,
                mintingPolicy: schema.economics?.supply?.mintingPolicy ||
                  "fixed",
              },
            })}
          placeholder="e.g., 1000000"
          className="h-8 text-xs"
        />
        {errors["economics.supply.initial"] && (
          <p className="text-xs text-red-500 mt-1">
            {errors["economics.supply.initial"][0]}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="max" className="text-xs">
          Maximum Supply (optional)
        </Label>
        <Input
          id="max"
          value={schema.economics?.supply?.max || ""}
          onChange={(e) =>
            updateEconomics({
              supply: {
                ...schema.economics?.supply,
                initial: schema.economics?.supply?.initial || "0",
                max: e.target.value,
                mintingPolicy: schema.economics?.supply?.mintingPolicy ||
                  "fixed",
              },
            })}
          placeholder="Leave empty for unlimited"
          className="h-8 text-xs"
        />
      </div>

      <div>
        <Label htmlFor="minting" className="text-xs">
          Minting Policy
        </Label>
        <Select
          value={schema.economics?.supply?.mintingPolicy || "fixed"}
          onValueChange={(value) =>
            updateEconomics({
              supply: {
                ...schema.economics?.supply,
                initial: schema.economics?.supply?.initial || "0",
                mintingPolicy: value as
                  | "fixed"
                  | "mintable"
                  | "burnable"
                  | "mintable-burnable",
              },
            })}
        >
          <SelectTrigger id="minting" className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed">Fixed Supply</SelectItem>
            <SelectItem value="mintable">Mintable</SelectItem>
            <SelectItem value="burnable">Burnable</SelectItem>
            <SelectItem value="mintable-burnable">
              Mintable & Burnable
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
});

/**
 * Step 4: Advanced Settings
 * Configure governance and transfer restrictions (optional)
 */
const AdvancedStep = React.memo(function AdvancedStep(): React.ReactElement {
  const schema = useTokenBuilderStore((state) => state.schema);
  const updateSchema = useTokenBuilderStore((state) => state.updateSchema);

  return (
    <div className="space-y-3">
      <div className="p-3 bg-blue-500/5 border border-blue-500/30 rounded">
        <p className="text-xs text-muted-foreground">
          Advanced settings are optional. You can add governance, transfer
          restrictions, and custom fields here or skip to review.
        </p>
      </div>

      <div>
        <Label className="text-xs flex items-center gap-2">
          <input
            type="checkbox"
            checked={schema.governance?.enabled || false}
            onChange={(e) =>
              updateSchema({
                governance: {
                  ...schema.governance,
                  enabled: e.target.checked,
                },
              })}
            className="w-4 h-4"
          />
          Enable Governance
        </Label>
      </div>

      {schema.governance?.enabled && (
        <>
          <div>
            <Label htmlFor="proposalThreshold" className="text-xs">
              Proposal Threshold
            </Label>
            <Input
              id="proposalThreshold"
              value={schema.governance?.proposalThreshold || ""}
              onChange={(e) =>
                updateSchema({
                  governance: {
                    ...schema.governance,
                    enabled: true,
                    proposalThreshold: e.target.value,
                  },
                })}
              placeholder="Min tokens to create proposal"
              className="h-8 text-xs"
            />
          </div>

          <div>
            <Label htmlFor="quorum" className="text-xs">
              Quorum Threshold
            </Label>
            <Input
              id="quorum"
              value={schema.governance?.quorumThreshold || ""}
              onChange={(e) =>
                updateSchema({
                  governance: {
                    ...schema.governance,
                    enabled: true,
                    quorumThreshold: e.target.value,
                  },
                })}
              placeholder="Min votes for valid proposal"
              className="h-8 text-xs"
            />
          </div>
        </>
      )}
    </div>
  );
});

/**
 * Step 5: Review & Sign
 * Review schema and create signed certificate
 */
const ReviewStep = React.memo(function ReviewStep(): React.ReactElement {
  const { resolvedTheme } = useTheme();
  const {
    address,
    hasWallet,
    network,
    getPrivateKey, // Secure getter - use only when needed
  } = useAuthWallet();

  const schema = useTokenBuilderStore((state) => state.schema);
  const certificate = useTokenBuilderStore((state) => state.certificate);
  const errors = useTokenBuilderStore((state) => state.errors);
  const validateSchema = useTokenBuilderStore((state) => state.validateSchema);
  const signSchema = useTokenBuilderStore((state) => state.signSchema);
  const exportSchema = useTokenBuilderStore((state) => state.exportSchema);

  const [showPreview, setShowPreview] = useState(false);
  const [signing, setSigning] = useState(false);
  const [useAuthKey, setUseAuthKey] = useState(true);
  const [manualKey, setManualKey] = useState("");
  const [lastSignTime, setLastSignTime] = useState(0);

  // Rate limiting constant
  const SIGN_COOLDOWN = 2000; // 2 seconds between signing attempts

  useEffect(() => {
    validateSchema();
  }, [validateSchema]);

  const handleSign = async (): Promise<void> => {
    // SECURITY: Rate limiting to prevent abuse
    const now = Date.now();
    if (now - lastSignTime < SIGN_COOLDOWN) {
      alert(
        `Please wait ${
          Math.ceil((SIGN_COOLDOWN - (now - lastSignTime)) / 1000)
        } seconds before signing again.`,
      );
      return;
    }

    // Get private key securely - only when needed, never stored
    let privateKey: string | null = null;

    try {
      if (useAuthKey) {
        privateKey = getPrivateKey();
        if (!privateKey) {
          alert(
            "No wallet connected. Please connect wallet or use manual key.",
          );
          return;
        }
      } else {
        if (!manualKey) {
          alert("Please enter your private key");
          return;
        }
        privateKey = manualKey;
      }

      setSigning(true);
      setLastSignTime(now); // Update rate limit timestamp

      // Sign with the private key
      await signSchema(privateKey);

      // SECURITY: Clear all references to private key immediately
      privateKey = null;
      setManualKey("");

      alert("Token certificate created successfully!");
    } catch (error) {
      console.error("Signing error:", error);
      alert(error instanceof Error ? error.message : "Failed to sign schema");
    } finally {
      // SECURITY: Ensure cleanup even on error
      privateKey = null;
      setManualKey("");
      setSigning(false);
    }
  };

  /**
   * Export certificate to JSON file
   */
  const handleExport = (): void => {
    if (!certificate) {
      alert("No certificate to export");
      return;
    }

    const json = exportCertificate(certificate, "json");
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `token-${schema.metadata?.symbol || "TOKEN"}-certificate.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Create another token
   * Exports current certificate and resets wizard for new token
   */
  const handleCreateAnother = (): void => {
    // Auto-export current certificate before starting new one
    if (certificate) {
      handleExport();
    }

    // Get reset function from store
    const resetBuilder = useTokenBuilderStore.getState().resetBuilder;

    // Reset to start new token creation
    resetBuilder();

    // Show confirmation
    setTimeout(() => {
      alert("Previous certificate exported. Ready to create new token!");
    }, 100);
  };

  return (
    <div className="space-y-3">
      {/* Schema Preview */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-foreground">
            Token Schema
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="h-6 text-xs"
          >
            <FileJson className="w-3 h-3 mr-1" />
            {showPreview ? "Hide" : "Show"} JSON
          </Button>
        </div>

        {showPreview && (
          <div className="rounded border border-border overflow-hidden">
            <SyntaxHighlighter
              language="json"
              style={resolvedTheme === "dark" ? oneDark : oneLight}
              customStyle={{
                margin: 0,
                padding: "8px",
                fontSize: "10px",
                lineHeight: "1.4",
                background: resolvedTheme === "dark" ? "#1a1a1a" : "#fafafa",
              }}
              wrapLongLines={true}
            >
              {exportSchema("json")}
            </SyntaxHighlighter>
          </div>
        )}
      </div>

      {/* Validation Status */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-blue-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-foreground mb-1">
                Validation Status
              </p>
              {Object.keys(errors).length === 0
                ? (
                  <p className="text-xs text-green-600">
                    ✓ Schema is valid and ready to sign
                  </p>
                )
                : (
                  <div className="text-xs text-red-600">
                    <p>✗ Please fix the following errors:</p>
                    <ul className="list-disc list-inside mt-1">
                      {Object.entries(errors).map(([field, messages]) => (
                        <li key={field}>
                          {field}: {messages[0]}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sign Section */}
      {!certificate && Object.keys(errors).length === 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <p className="text-xs font-semibold text-foreground">
                  Sign Certificate
                </p>

                {/* Wallet Info */}
                {hasWallet && (
                  <div className="p-2 bg-green-500/10 border border-green-500/30 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <Check className="w-3 h-3 text-green-500" />
                      <span className="text-xs font-semibold text-green-600 dark:text-green-500">
                        Wallet Connected
                      </span>
                    </div>
                    <div className="text-xs font-mono text-muted-foreground space-y-0.5">
                      <div>Address: {address}</div>
                      <div>Network: {network?.name || "Unknown"}</div>
                    </div>
                  </div>
                )}

                {/* Key Source Selection */}
                <div className="space-y-2">
                  {hasWallet && (
                    <label className="flex items-center gap-2 cursor-pointer p-2 bg-muted/30 rounded border border-border">
                      <input
                        type="radio"
                        checked={useAuthKey}
                        onChange={() => setUseAuthKey(true)}
                        className="w-3.5 h-3.5"
                      />
                      <div className="flex-1">
                        <span className="text-xs text-foreground font-medium">
                          Use connected wallet
                        </span>
                        <p className="text-[10px] text-muted-foreground">
                          Sign with {address?.substring(0, 12)}...
                        </p>
                      </div>
                    </label>
                  )}

                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-muted/30 rounded border border-border">
                    <input
                      type="radio"
                      checked={!useAuthKey}
                      onChange={() => setUseAuthKey(false)}
                      className="w-3.5 h-3.5"
                    />
                    <div className="flex-1">
                      <span className="text-xs text-foreground font-medium">
                        Use manual private key
                      </span>
                      <p className="text-[10px] text-muted-foreground">
                        Enter private key manually
                      </p>
                    </div>
                  </label>
                </div>

                {/* Manual Key Input */}
                {!useAuthKey && (
                  <Input
                    type="password"
                    value={manualKey}
                    onChange={(e) => setManualKey(e.target.value)}
                    placeholder="Enter private key..."
                    className="h-8 text-xs font-mono"
                  />
                )}

                {/* Sign Button */}
                <Button
                  onClick={handleSign}
                  disabled={signing || (!useAuthKey && !manualKey) ||
                    (useAuthKey && !hasWallet)}
                  size="sm"
                  className="h-7 text-xs w-full bg-amber-500 hover:bg-amber-600 text-black font-bold"
                >
                  {signing ? "Signing..." : "Sign & Create Certificate"}
                </Button>

                {/* Warning if no wallet */}
                {!hasWallet && (
                  <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded">
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      ℹ️ No wallet connected. You can enter private key manually
                      or connect wallet in the sidebar.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certificate Display */}
      {certificate && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-2">
                  {/* Token Icon */}
                  {schema.metadata?.icon && (
                    <div className="w-12 h-12 border border-green-500/30 rounded overflow-hidden bg-background flex items-center justify-center flex-shrink-0">
                      <img
                        src={schema.metadata.icon}
                        alt={schema.metadata.symbol || "Token"}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-green-600 mb-1">
                      ✓ Certificate Created Successfully!
                    </p>
                    <div className="text-xs font-mono text-muted-foreground space-y-1">
                      <div>ID: {certificate.id.substring(0, 40)}...</div>
                      <div>
                        Created:{" "}
                        {new Date(certificate.createdAt).toLocaleString()}
                      </div>
                      <div>
                        Token: {schema.metadata?.name} (
                        {schema.metadata?.symbol})
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleExport}
                    size="sm"
                    className="h-7 text-xs flex-1"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Export Certificate
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
          </CardContent>
        </Card>
      )}
    </div>
  );
});

/**
 * Token Builder Application Component
 * Step-by-step wizard for creating Web Tokens
 */
function TokenBuilder(): React.ReactElement {
  const mobile = useMobile();

  // Store state
  const currentStep = useTokenBuilderStore((state) => state.currentStep);
  const steps = useTokenBuilderStore((state) => state.steps);
  const errors = useTokenBuilderStore((state) => state.errors);
  const certificateHistory = useTokenBuilderStore(
    (state) => state.certificateHistory,
  );

  // Store actions
  const nextStep = useTokenBuilderStore((state) => state.nextStep);
  const previousStep = useTokenBuilderStore((state) => state.previousStep);
  const resetBuilder = useTokenBuilderStore((state) => state.resetBuilder);

  // Local state for validator
  const [showValidator, setShowValidator] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Mobile warning
  if (mobile) {
    return (
      <div className="flex items-center justify-center h-full bg-background p-4">
        <Card className="w-full max-w-md border-amber-500/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded">
                <Smartphone className="w-6 h-6 text-amber-500" />
              </div>
              <CardTitle>Desktop Required</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Token Builder requires a desktop environment for creating and
              signing token certificates. Please access this app from a desktop
              computer.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render current step
  const renderStep = (): React.ReactElement => {
    const step = steps[currentStep];

    switch (step.id) {
      case "type":
        return <TypeStep />;
      case "metadata":
        return <MetadataStep />;
      case "economics":
        return <EconomicsStep />;
      case "advanced":
        return <AdvancedStep />;
      case "review":
        return <ReviewStep />;
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-muted/20 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/20 rounded">
              <Coins className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-foreground">
                  Web Token Builder
                </h1>
                {certificateHistory.length > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-green-500/10 border-green-500/30 text-green-600"
                  >
                    {certificateHistory.length} created
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Create STELS network token certificates
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {certificateHistory.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(true)}
                className="h-7 text-xs"
              >
                <FileJson className="w-3 h-3 mr-1" />
                History ({certificateHistory.length})
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowValidator(true)}
              className="h-7 text-xs"
            >
              <Shield className="w-3 h-3 mr-1" />
              Validate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetBuilder}
              className="h-7 text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-2 flex-1">
              <div
                className={cn(
                  "flex-1 h-1 rounded-full transition-all",
                  idx < currentStep
                    ? "bg-green-500"
                    : idx === currentStep
                    ? "bg-amber-500"
                    : "bg-muted",
                )}
              />
              {idx < steps.length - 1 && (
                <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </span>
              {steps[currentStep].completed && (
                <Check className="w-3 h-3 text-green-500" />
              )}
            </div>
            <h2 className="text-lg font-bold text-foreground">
              {steps[currentStep].title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {steps[currentStep].description}
            </p>
          </div>

          <Card>
            <CardContent className="p-4">{renderStep()}</CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-muted/20 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={previousStep}
          disabled={currentStep === 0}
          className="h-7 text-xs"
        >
          <ChevronLeft className="w-3 h-3 mr-1" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {Object.keys(errors).length > 0 && (
            <div className="flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="w-3 h-3" />
              <span>{Object.keys(errors).length} errors</span>
            </div>
          )}
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={nextStep}
          disabled={currentStep === steps.length - 1}
          className="h-7 text-xs bg-amber-500 hover:bg-amber-600 text-black font-bold"
        >
          Next
          <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </div>

      {/* Certificate Validator */}
      <CertificateValidator
        isOpen={showValidator}
        onClose={() => setShowValidator(false)}
      />

      {/* Certificate History */}
      <CertificateHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
}

export default TokenBuilder;
