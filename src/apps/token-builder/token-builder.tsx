/**
 * Token Builder Application
 * Professional tool for creating Web Tokens in STELS network
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  RefreshCw,
  Shield,
  Smartphone,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTokenBuilderStore } from "./store";
import { TOKEN_TEMPLATES } from "./templates";
import { sanitizeInput } from "./validation";
import { CertificateValidator } from "./components/certificate-validator";
import { CertificateHistory } from "./components/certificate-history";
import { AVAILABLE_NETWORKS, PROTOCOL_CONFIG } from "./constants";
import { HISTORY_DISPLAY, readFileAsDataURL, validateIconFile } from "./utils";
import { useExportCertificate } from "./hooks/use-export-certificate";
import { useTokenToast } from "./hooks/use-token-toast";
import type { TokenGenesisCertificate, TokenStandard } from "./types";
import ErrorBoundary from "./components/ErrorBoundary";

// Review step components
import {
  CertificateDisplay,
  SchemaPreview,
  SigningSection,
  ValidationStatus,
} from "./components/review";

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

  const { exportCert } = useExportCertificate();
  const { showCertificateExported, showError } = useTokenToast();

  /**
   * Export certificate from history
   */
  const handleExportFromHistory = (cert: TokenGenesisCertificate): void => {
    if (exportCert(cert)) {
      showCertificateExported();
    } else {
      showError("Failed to export certificate");
    }
  };

  // Filter only genesis-compliant certificates (new format)
  // Old certificates don't have 'token' field, so filter them out
  const genesisCompliantHistory = certificateHistory.filter(
    (cert) => cert.token !== undefined,
  );

  // Show first N certificates by default
  const displayedHistory = showAllHistory
    ? genesisCompliantHistory
    : genesisCompliantHistory.slice(0, HISTORY_DISPLAY.DEFAULT_LIMIT);

  return (
    <div className="space-y-4">
      {/* Network Selector */}
      <div>
        <Label htmlFor="network" className="text-xs font-semibold mb-1.5 block">
          Target Network
        </Label>
        <Select
          value={schema.technical?.networkId || "testnet"}
          onValueChange={(networkId) => {
            const network = AVAILABLE_NETWORKS[networkId];
            updateSchema({
              technical: {
                ...schema.technical,
                networkId: networkId,
                network: network.name,
                chainId: network.chain_id,
                protocol: PROTOCOL_CONFIG.tx_version,
                encoding: "utf-8",
                hashAlgorithm: "sha256",
              },
            });
          }}
        >
          <SelectTrigger id="network" className="h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(AVAILABLE_NETWORKS).map(([id, network]) => (
              <SelectItem key={id} value={id}>
                {network.name} (chain:{network.chain_id})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Recently Created Tokens */}
      {genesisCompliantHistory.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-foreground">
              Recently Created Tokens
            </h3>
            {genesisCompliantHistory.length > HISTORY_DISPLAY.DEFAULT_LIMIT && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllHistory(!showAllHistory)}
                className="h-6 text-[10px] px-2"
              >
                {showAllHistory
                  ? "Show Less"
                  : `View All (${genesisCompliantHistory.length})`}
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {displayedHistory.map((cert) => (
              <Card
                key={cert.token.id}
                className="border-border hover:bg-muted/30 transition-colors"
              >
                <CardContent className="p-2.5">
                  <div className="flex items-center gap-2">
                    {/* Token Icon */}
                    <div className="w-8 h-8 border border-border rounded overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                      {cert.token.metadata.icon
                        ? (
                          <img
                            src={cert.token.metadata.icon}
                            alt={cert.token.metadata.symbol}
                            className="w-[70%] h-[70%] object-contain"
                          />
                        )
                        : <Coins className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {cert.token.metadata.name}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {cert.token.metadata.symbol}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[9px] bg-blue-500/10 border-blue-500/30 text-blue-600"
                        >
                          {cert.token.standard}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span>
                          {new Date(cert.token.created_at).toLocaleDateString()}
                        </span>
                        <span>
                          Supply: {cert.token.economics.supply.initial}
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

  const { showIconUploaded, showError } = useTokenToast();

  /**
   * Handle icon file upload
   * Validates size (max 128KB) and converts to Data URL
   */
  const handleIconUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateIconFile(file);
    if (!validation.valid) {
      showError(validation.error || "Invalid file");
      return;
    }

    setIconLoading(true);

    try {
      const dataUrl = await readFileAsDataURL(file);
      setIconPreview(dataUrl);
      updateMetadata({ icon: dataUrl });
      showIconUploaded();
    } catch {

      showError(
        error instanceof Error ? error.message : "Failed to upload icon",
      );
    } finally {
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
          onChange={(e) => {
            const cleaned = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
            updateMetadata({
              symbol: sanitizeInput(cleaned),
            });
          }}
          placeholder="e.g., TOKEN (3-5 letters)"
          className="h-8 text-xs uppercase"
          maxLength={5}
          minLength={3}
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
        <Label htmlFor="contact" className="text-xs">
          Contact Email (Optional)
        </Label>
        <Input
          id="contact"
          type="email"
          value={schema.metadata?.contact || ""}
          onChange={(e) =>
            updateMetadata({ contact: sanitizeInput(e.target.value) })}
          placeholder="your@email.com"
          className="h-8 text-xs"
          maxLength={128}
        />
        {errors["metadata.contact"] && (
          <p className="text-xs text-red-500 mt-1">
            {errors["metadata.contact"][0]}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="website" className="text-xs">
          Website (Optional)
        </Label>
        <Input
          id="website"
          type="url"
          value={schema.metadata?.website || ""}
          onChange={(e) =>
            updateMetadata({ website: sanitizeInput(e.target.value) })}
          placeholder="https://yourproject.com"
          className="h-8 text-xs"
          maxLength={256}
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
                  className="w-[70%] h-[70%] object-contain"
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
    </div>
  );
});

/**
 * Step 3: Token Economics
 * Configure token supply, distribution, and fees
 */
const EconomicsStep = React.memo(function EconomicsStep(): React.ReactElement {
  const schema = useTokenBuilderStore((state) => state.schema);
  const errors = useTokenBuilderStore((state) => state.errors);
  const updateEconomics = useTokenBuilderStore((state) =>
    state.updateEconomics
  );
  const [showDistribution, setShowDistribution] = useState(
    (schema.economics?.distribution?.length || 0) > 0,
  );

  /**
   * Add distribution entry
   */
  const addDistribution = (): void => {
    const current = schema.economics?.distribution || [];
    updateEconomics({
      ...schema.economics,
      distribution: [
        ...current,
        { address: "", amount: "" },
      ],
    });
  };

  /**
   * Remove distribution entry
   */
  const removeDistribution = (index: number): void => {
    const current = schema.economics?.distribution || [];
    updateEconomics({
      ...schema.economics,
      distribution: current.filter((_, i) => i !== index),
    });
  };

  /**
   * Update distribution entry
   */
  const updateDistribution = (
    index: number,
    field: string,
    value: string,
  ): void => {
    const current = schema.economics?.distribution || [];
    const updated = [...current];
    updated[index] = { ...updated[index], [field]: value };
    updateEconomics({
      ...schema.economics,
      distribution: updated,
    });
  };

  return (
    <div className="space-y-3">
      {/* Supply Configuration */}
      <div>
        <Label htmlFor="initial" className="text-xs">
          Initial Supply *
        </Label>
        <Input
          id="initial"
          value={schema.economics?.supply?.initial || ""}
          onChange={(e) => {
            const mintingPolicy = schema.economics?.supply?.mintingPolicy ||
              "fixed";
            const initial = e.target.value;

            updateEconomics({
              supply: {
                ...schema.economics?.supply,
                initial: initial,
                mintingPolicy: mintingPolicy,
                // For fixed supply, max must equal initial
                max: mintingPolicy === "fixed"
                  ? initial
                  : schema.economics?.supply?.max,
              },
            });
          }}
          placeholder="e.g., 1000000"
          className="h-8 text-xs"
        />
        {errors["economics.supply.initial"] && (
          <p className="text-xs text-red-500 mt-1">
            {errors["economics.supply.initial"][0]}
          </p>
        )}
      </div>

      {/* Max Supply - только для non-fixed policies */}
      {schema.economics?.supply?.mintingPolicy !== "fixed" && (
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
          <p className="text-xs text-muted-foreground mt-1">
            {schema.economics?.supply?.mintingPolicy === "mintable"
              ? "Maximum tokens that can be minted"
              : "Maximum total supply (initial + minting)"}
          </p>
        </div>
      )}

      {/* Info for fixed supply */}
      {schema.economics?.supply?.mintingPolicy === "fixed" && (
        <div className="p-2 bg-blue-500/5 border border-blue-500/30 rounded">
          <p className="text-xs text-muted-foreground">
            <strong>Fixed Supply:</strong> Maximum supply automatically set to
            {" "}
            {schema.economics?.supply?.initial || "0"} (no additional minting)
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="minting" className="text-xs">
          Minting Policy
        </Label>
        <Select
          value={schema.economics?.supply?.mintingPolicy || "fixed"}
          onValueChange={(value) => {
            const policy = value as
              | "fixed"
              | "mintable"
              | "burnable"
              | "mintable-burnable";
            const initial = schema.economics?.supply?.initial || "0";

            updateEconomics({
              supply: {
                ...schema.economics?.supply,
                initial: initial,
                mintingPolicy: policy,
                // For fixed supply, max must equal initial
                max: policy === "fixed"
                  ? initial
                  : schema.economics?.supply?.max,
              },
            });
          }}
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
        <p className="text-xs text-muted-foreground mt-1">
          {schema.economics?.supply?.mintingPolicy === "fixed" &&
            "No additional tokens can be minted"}
          {schema.economics?.supply?.mintingPolicy === "mintable" &&
            "New tokens can be minted after launch"}
          {schema.economics?.supply?.mintingPolicy === "burnable" &&
            "Tokens can be permanently burned"}
          {schema.economics?.supply?.mintingPolicy === "mintable-burnable" &&
            "Tokens can be minted and burned"}
        </p>
      </div>

      {/* Burn Rate (for burnable tokens) */}
      {(schema.economics?.supply?.mintingPolicy === "burnable" ||
        schema.economics?.supply?.mintingPolicy === "mintable-burnable") && (
        <div>
          <Label htmlFor="burnRate" className="text-xs">
            Burn Rate % (optional)
          </Label>
          <Input
            id="burnRate"
            value={schema.economics?.supply?.burnRate || ""}
            onChange={(e) =>
              updateEconomics({
                supply: {
                  ...schema.economics?.supply,
                  initial: schema.economics?.supply?.initial || "0",
                  mintingPolicy: schema.economics?.supply?.mintingPolicy ||
                    "fixed",
                  burnRate: e.target.value,
                },
              })}
            placeholder="e.g., 0.01 (1% per tx)"
            className="h-8 text-xs"
          />
        </div>
      )}

      {/* Initial Distribution */}
      <div className="pt-3 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs font-semibold">
            Initial Distribution (optional)
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowDistribution(!showDistribution)}
            className="h-6 text-xs"
          >
            {showDistribution ? "Hide" : "Configure"}
          </Button>
        </div>

        {showDistribution && (
          <div className="space-y-2">
            {schema.economics?.distribution?.map((dist, idx) => (
              <div
                key={idx}
                className="p-2 border border-border rounded space-y-2"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={dist.address}
                      onChange={(e) =>
                        updateDistribution(idx, "address", e.target.value)}
                      placeholder="Recipient address (base58)"
                      className="h-7 text-xs font-mono"
                    />
                    <Input
                      value={dist.amount}
                      onChange={(e) =>
                        updateDistribution(idx, "amount", e.target.value)}
                      placeholder="Amount"
                      className="h-7 text-xs"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDistribution(idx)}
                    className="h-7 w-7 p-0 text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addDistribution}
              className="h-7 text-xs w-full"
            >
              + Add Distribution Entry
            </Button>
          </div>
        )}
      </div>

      {/* Fee Structure */}
      <div className="pt-3 border-t border-border">
        <Label className="text-xs font-semibold mb-2 block">
          Fee Structure (optional)
        </Label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label htmlFor="transferFee" className="text-xs">
              Transfer %
            </Label>
            <Input
              id="transferFee"
              value={schema.economics?.feeStructure?.transfer || ""}
              onChange={(e) =>
                updateEconomics({
                  ...schema.economics,
                  feeStructure: {
                    ...schema.economics?.feeStructure,
                    transfer: e.target.value,
                  },
                })}
              placeholder="0.001"
              className="h-7 text-xs"
            />
          </div>
          <div>
            <Label htmlFor="mintFee" className="text-xs">
              Mint %
            </Label>
            <Input
              id="mintFee"
              value={schema.economics?.feeStructure?.mint || ""}
              onChange={(e) =>
                updateEconomics({
                  ...schema.economics,
                  feeStructure: {
                    ...schema.economics?.feeStructure,
                    mint: e.target.value,
                  },
                })}
              placeholder="0.001"
              className="h-7 text-xs"
            />
          </div>
          <div>
            <Label htmlFor="burnFee" className="text-xs">
              Burn %
            </Label>
            <Input
              id="burnFee"
              value={schema.economics?.feeStructure?.burn || ""}
              onChange={(e) =>
                updateEconomics({
                  ...schema.economics,
                  feeStructure: {
                    ...schema.economics?.feeStructure,
                    burn: e.target.value,
                  },
                })}
              placeholder="0.001"
              className="h-7 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Treasury Address */}
      <div>
        <Label htmlFor="treasury" className="text-xs">
          Treasury Address (optional)
        </Label>
        <Input
          id="treasury"
          value={schema.economics?.treasury || ""}
          onChange={(e) =>
            updateEconomics({
              ...schema.economics,
              treasury: e.target.value,
            })}
          placeholder="Base58 address for treasury"
          className="h-8 text-xs font-mono"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Address that receives fees and treasury allocations
        </p>
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

          <div>
            <Label htmlFor="votingPower" className="text-xs">
              Voting Power Method
            </Label>
            <Select
              value={schema.governance?.votingPower || "balance"}
              onValueChange={(value) =>
                updateSchema({
                  governance: {
                    ...schema.governance,
                    enabled: true,
                    votingPower: value as
                      | "balance"
                      | "staked"
                      | "quadratic"
                      | "custom",
                  },
                })}
            >
              <SelectTrigger id="votingPower" className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="balance">Token Balance</SelectItem>
                <SelectItem value="staked">Staked Balance</SelectItem>
                <SelectItem value="quadratic">Quadratic Voting</SelectItem>
                <SelectItem value="custom">Custom Formula</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="votingPeriod" className="text-xs">
              Voting Period (days)
            </Label>
            <Input
              id="votingPeriod"
              type="number"
              value={schema.governance?.votingPeriod
                ? Math.floor(schema.governance.votingPeriod / 86400000)
                : 7}
              onChange={(e) =>
                updateSchema({
                  governance: {
                    ...schema.governance,
                    enabled: true,
                    votingPeriod: parseInt(e.target.value) * 86400000 ||
                      604800000,
                  },
                })}
              placeholder="7"
              className="h-8 text-xs"
              min={1}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Duration for voting on proposals
            </p>
          </div>
        </>
      )}

      {/* Transfer Restrictions */}
      <div className="pt-3 border-t border-border">
        <Label className="text-xs flex items-center gap-2">
          <input
            type="checkbox"
            checked={schema.transferRestrictions?.enabled || false}
            onChange={(e) =>
              updateSchema({
                transferRestrictions: {
                  ...schema.transferRestrictions,
                  enabled: e.target.checked,
                },
              })}
            className="w-4 h-4"
          />
          Enable Transfer Restrictions
        </Label>
      </div>

      {schema.transferRestrictions?.enabled && (
        <div>
          <Label htmlFor="timelock" className="text-xs">
            Timelock Period (hours)
          </Label>
          <Input
            id="timelock"
            type="number"
            value={schema.transferRestrictions?.timelock
              ? Math.floor(schema.transferRestrictions.timelock / 3600000)
              : 0}
            onChange={(e) =>
              updateSchema({
                transferRestrictions: {
                  ...schema.transferRestrictions,
                  enabled: true,
                  timelock: parseInt(e.target.value) * 3600000 || 0,
                },
              })}
            placeholder="24"
            className="h-8 text-xs"
            min={0}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Required waiting period before transfers (0 = no timelock)
          </p>
        </div>
      )}
    </div>
  );
});

/**
 * Step 5: Review & Sign
 * Review schema and create signed certificate
 */
const ReviewStep = React.memo(function ReviewStep(): React.ReactElement {
  const validateSchema = useTokenBuilderStore((state) => state.validateSchema);
  const errors = useTokenBuilderStore((state) => state.errors);

  useEffect(() => {
    validateSchema();
  }, [validateSchema]);

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="space-y-3">
      <SchemaPreview />
      <ValidationStatus />
      <SigningSection hasErrors={hasErrors} />
      <CertificateDisplay />
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
  const schema = useTokenBuilderStore((state) => state.schema);
  const certificateHistory = useTokenBuilderStore(
    (state) => state.certificateHistory,
  );

  // Filter only genesis-compliant certificates
  const genesisCompliantHistory = certificateHistory.filter(
    (cert) => cert.token !== undefined,
  );

  // Get selected network
  const selectedNetworkId = schema.technical?.networkId || "testnet";
  const selectedNetwork = AVAILABLE_NETWORKS[selectedNetworkId];

  // Store actions
  const nextStep = useTokenBuilderStore((state) => state.nextStep);
  const previousStep = useTokenBuilderStore((state) => state.previousStep);
  const resetBuilder = useTokenBuilderStore((state) => state.resetBuilder);
  const validateSchema = useTokenBuilderStore((state) => state.validateSchema);

  // Local state for validator
  const [showValidator, setShowValidator] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Auto-validate schema whenever it changes
  useEffect(() => {
    validateSchema();
  }, [schema, validateSchema]);

  /**
   * Check if current step is valid (memoized to prevent infinite loops)
   * Does NOT call validateSchema() to avoid triggering re-renders
   */
  const isCurrentStepValid = useMemo(() => {
    // Define required fields for each step
    const stepRequirements: Record<number, string[]> = {
      0: ["standard"], // Step 1: Standard Selection
      1: [ // Step 2: Token Information
        "metadata.name",
        "metadata.symbol",
        "metadata.description",
      ],
      2: [ // Step 3: Economics
        "economics.supply.initial",
        "economics.supply.mintingPolicy",
      ],
      3: [], // Step 4: Optional features (all optional)
      4: [], // Step 5: Review (no validation needed)
    };

    const requiredFields = stepRequirements[currentStep] || [];
    const stepErrors = requiredFields.filter((field) => field in errors);

    // Additional validation for symbol
    if (currentStep === 1 && schema.metadata?.symbol) {
      const symbol = schema.metadata.symbol.trim().toUpperCase();
      if (symbol.length < 3 || symbol.length > 5 || !/^[A-Z]+$/.test(symbol)) {
        return false;
      }
    }

    return stepErrors.length === 0;
  }, [currentStep, errors, schema.metadata?.symbol]);

  /**
   * Handle next step with validation
   */
  const handleNextStep = useCallback((): void => {
    // Validation happens automatically in useEffect
    if (isCurrentStepValid) {
      nextStep();
    }
  }, [isCurrentStepValid, nextStep]);

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
                {genesisCompliantHistory.length > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-green-500/10 border-green-500/30 text-green-600"
                  >
                    {genesisCompliantHistory.length} created
                  </Badge>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Create genesis.json-compliant token certificates
                </p>
                <p className="text-[10px] text-muted-foreground/80">
                  {selectedNetwork.name} (chain:{selectedNetwork.chain_id})
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {genesisCompliantHistory.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(true)}
                className="h-7 text-xs"
              >
                <FileJson className="w-3 h-3 mr-1" />
                History ({genesisCompliantHistory.length})
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
            <CardContent className="p-4">
              <ErrorBoundary
                onReset={() => {
                  // Optionally reset to first step on error

                }}
              >
                {renderStep()}
              </ErrorBoundary>
            </CardContent>
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
          onClick={handleNextStep}
          disabled={currentStep === steps.length - 1 || !isCurrentStepValid}
          className="h-7 text-xs bg-amber-500 hover:bg-amber-600 text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed"
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
