import React, { useEffect, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Sparkles,
  Upload,
  Lock,
} from "lucide-react";
import { useAuthStore } from "@/stores/modules/auth.store";
import { LOTTIE_ANIMATIONS, LOTTIE_SIZES } from "./lottie_config";
import {
  decryptWithPassword,
  hexToUint8Array,
  DEFAULT_PBKDF2_ITERATIONS,
  type PasswordEncryptionResult,
} from "@/lib/crypto";

interface WalletCreatorProps {
  walletType: "create" | "import";
  onBack: () => void;
  onSuccess: () => void;
}

/**
 * Professional Wallet creator/importer component
 */
export function WalletCreator(
  { walletType, onBack, onSuccess }: WalletCreatorProps,
): React.ReactElement {
  const {
    createNewWallet,
    importExistingWallet,
    connectionError,
    clearConnectionError,
  } = useAuthStore();
  const [privateKey, setPrivateKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [pendingEncryptedData, setPendingEncryptedData] = useState<{
    encrypted: PasswordEncryptionResult;
    iterations: number;
  } | null>(null);
  const [validationState, setValidationState] = useState<{
    isValid: boolean;
    message: string;
    type: "success" | "error" | "warning" | null;
  }>({ isValid: false, message: "", type: null });

  // Enhanced private key validation
  const validatePrivateKey = (key: string): boolean => {
    // Remove any whitespace and 0x prefix
    const cleanKey = key.replace(/^0x/, "").replace(/\s/g, "");

    // Check if it's a valid hex string
    if (!/^[0-9a-fA-F]+$/.test(cleanKey)) {
      setValidationState({
        isValid: false,
        message:
          "Private key must contain only hexadecimal characters (0-9, a-f)",
        type: "error",
      });
      return false;
    }

    // Check length (64 characters for 256-bit key)
    if (cleanKey.length !== 64) {
      setValidationState({
        isValid: false,
        message:
          `Private key must be exactly 64 characters long (currently ${cleanKey.length})`,
        type: "error",
      });
      return false;
    }

    setValidationState({
      isValid: true,
      message: "Private key format is valid",
      type: "success",
    });
    return true;
  };

  // Validate private key on change
  useEffect(() => {
    if (privateKey.trim() && walletType === "import") {
      validatePrivateKey(privateKey);
    } else {
      setValidationState({ isValid: false, message: "", type: null });
    }
  }, [privateKey, walletType]);

  const handleCreateWallet = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    clearConnectionError();

    try {
      // Small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 150));
      createNewWallet();
      onSuccess();
    } catch {
      setError("Failed to create Wallet. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportWallet = async (): Promise<void> => {
    if (!privateKey.trim()) {
      setError("Private key is required");
      return;
    }

    if (!validatePrivateKey(privateKey)) {
      setError("Please enter a valid private key");
      return;
    }

    setIsLoading(true);
    setError(null);
    clearConnectionError();

    try {
      // Small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 200));

      const success = importExistingWallet(privateKey.trim());

      if (success) {
        setPrivateKey("");
        setValidationState({ isValid: false, message: "", type: null });
        onSuccess();
      } else {
        setError("Invalid private key format. Please check and try again.");
      }
    } catch {
      setError(
        "Failed to import Wallet. Please check your private key and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadFromFile = (): void => {
    // Trigger file input click
    fileInputRef?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset file input
    if (event.target) {
      event.target.value = "";
    }

    try {
      // Read file content
      const text = await file.text();
      
      // Try to parse as encrypted JSON file
      try {
        const parsed = JSON.parse(text);
        
        // Check if it's an encrypted wallet file
        if (parsed.encrypted === true && parsed.data && parsed.salt && parsed.iv) {
          // This is an encrypted file - need password to decrypt
          const encrypted: PasswordEncryptionResult = {
            encryptedData: hexToUint8Array(parsed.data),
            iv: hexToUint8Array(parsed.iv),
            salt: hexToUint8Array(parsed.salt),
          };
          
          setPendingEncryptedData({
            encrypted,
            iterations: parsed.iterations || DEFAULT_PBKDF2_ITERATIONS,
          });
          setPassword("");
          setPasswordError(null);
          setShowPasswordDialog(true);
          return;
        }
      } catch {
        // Not JSON or not encrypted format, continue with plain text processing
      }
      
      // Plain text processing (for unencrypted files)
      // Clean and extract private key
      // Remove whitespace, newlines, 0x prefix, and any other non-hex characters
      let cleanedKey = text
        .replace(/^0x/i, "") // Remove 0x prefix
        .replace(/\s/g, "") // Remove all whitespace
        .replace(/\n/g, "") // Remove newlines
        .replace(/\r/g, "") // Remove carriage returns
        .trim();

      // If file contains JSON, try to extract privateKey field
      if (cleanedKey.startsWith("{") || cleanedKey.startsWith("[")) {
        try {
          const parsed = JSON.parse(text);
          cleanedKey = parsed.privateKey || parsed.private_key || parsed.key || cleanedKey;
          // Clean again after extraction
          cleanedKey = cleanedKey
            .replace(/^0x/i, "")
            .replace(/\s/g, "")
            .replace(/\n/g, "")
            .replace(/\r/g, "")
            .trim();
        } catch {
          // Not valid JSON, continue with original cleaned key
        }
      }

      // Validate and set
      if (cleanedKey.length > 0) {
        setPrivateKey(cleanedKey);
        // Validation will happen automatically via useEffect
      } else {
        setError("Could not extract private key from file. Please ensure the file contains a valid 64-character hexadecimal private key.");
      }
    } catch {

      setError("Failed to read file. Please ensure the file is a valid text file.");
    }
  };

  const handleDecryptFile = async (): Promise<void> => {
    if (!password || !pendingEncryptedData) {
      setPasswordError("Password is required");
      return;
    }

    setIsDecrypting(true);
    setPasswordError(null);

    try {
      const decryptedKey = await decryptWithPassword(
        pendingEncryptedData.encrypted,
        password,
        pendingEncryptedData.iterations,
      );

      // Clean the decrypted key
      const cleanedKey = decryptedKey
        .replace(/^0x/i, "")
        .replace(/\s/g, "")
        .replace(/\n/g, "")
        .replace(/\r/g, "")
        .trim();

      // Validate and set
      if (cleanedKey.length > 0) {
        setPrivateKey(cleanedKey);
        // Validation will happen automatically via useEffect
        setShowPasswordDialog(false);
        setPassword("");
        setPendingEncryptedData(null);
      } else {
        setPasswordError("Decrypted key is invalid. Please check your password.");
      }
    } catch {

      setPasswordError(
        error instanceof Error && error.message.includes("decrypt")
          ? "Incorrect password. Please try again."
          : "Failed to decrypt file. Please check your password and try again.",
      );
    } finally {
      setIsDecrypting(false);
    }
  };

  const getContent = () => {
    if (walletType === "create") {
      return {
        title: "Create New Wallet",
        subtitle: "Generate a secure Wallet with a unique private key",
        icon: <Sparkles className="icon-lg text-primary" />,
        description:
          "We'll generate a cryptographically secure private key for your new Wallet. This process is completely secure and happens locally in your browser.",
        actionText: "Generate Wallet",
        actionHandler: handleCreateWallet,
      };
    } else {
      return {
        title: "Import Existing Wallet",
        subtitle: "Restore your Wallet using your private key",
        icon: <Key className="icon-lg text-secondary-foreground" />,
        description:
          "Enter your 64-character hexadecimal private key to restore access to your existing Wallet and funds.",
        actionText: "Import Wallet",
        actionHandler: handleImportWallet,
        showInput: true,
      };
    }
  };

  const content = getContent();

  return (
    <div className="w-full">
      <Card className="bg-transparent border-0">
        <CardHeader className="text-center pb-2 sm:pb-3 md:pb-4 px-3 sm:px-4 md:px-6">
          {/* Lottie Animation */}
          <div className="flex h-20 sm:h-24 md:h-32 items-center justify-center mb-2 sm:mb-3">
            <DotLottieReact
              src={walletType === "create"
                ? LOTTIE_ANIMATIONS.creating
                : LOTTIE_ANIMATIONS.importing}
              loop
              autoplay
              style={LOTTIE_SIZES.medium}
            />
          </div>

          <CardTitle className="flex flex-col items-center justify-center gap-1 sm:gap-2 text-base sm:text-lg md:text-xl font-bold">
            <span className="text-foreground">
              {content.title}
            </span>
          </CardTitle>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1.5 sm:mt-2 px-2">
            {content.subtitle}
          </p>
        </CardHeader>

        <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6 space-y-3 sm:space-y-4">
          {/* Description */}
          <div className="p-2.5 sm:p-3 md:p-4 bg-muted/50 border border-border rounded">
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              {content.description}
            </p>
          </div>

          {/* Enhanced Private Key Input (only for import) */}
          {content.showInput && (
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="privateKey"
                  className="text-xs sm:text-sm font-semibold text-card-foreground flex items-center gap-1.5 sm:gap-2"
                >
                  <Key className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Private Key
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLoadFromFile}
                  disabled={isLoading}
                  className="h-7 sm:h-8 px-2 sm:px-3 text-xs gap-1.5"
                >
                  <Upload className="h-3 w-3" />
                  <span className="hidden sm:inline">Load from File</span>
                  <span className="sm:hidden">Load</span>
                </Button>
              </div>

              {/* Hidden file input */}
              <input
                ref={(el) => setFileInputRef(el)}
                type="file"
                accept=".txt,.key,.json,text/*"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Load private key from file"
              />

              <div className="relative">
                <Input
                  id="privateKey"
                  type={showPrivateKey ? "text" : "password"}
                  placeholder="Enter your 64-character hex private key..."
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  className={`h-9 sm:h-10 font-mono text-xs sm:text-sm transition-colors ${
                    validationState.type === "error"
                      ? "border-red-500/30 focus:border-red-500 bg-red-500/5"
                      : validationState.type === "success"
                      ? "border-green-500/30 focus:border-green-500 bg-green-500/5"
                      : "border-border focus:border-amber-500"
                  }`}
                  disabled={isLoading}
                  aria-describedby="private-key-help private-key-validation"
                  aria-invalid={validationState.type === "error"}
                  autoComplete="off"
                  spellCheck="false"
                />

                {/* Toggle visibility button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 icon-container-sm p-0"
                  disabled={isLoading}
                >
                  {showPrivateKey
                    ? <EyeOff className="icon-md text-muted-foreground" />
                    : <Eye className="icon-md text-muted-foreground" />}
                </Button>
              </div>

              {/* Validation feedback */}
              {validationState.message && (
                <div
                  id="private-key-validation"
                  className={`flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm transition-all duration-150 ${
                    validationState.type === "error"
                      ? "text-red-700 dark:text-red-400"
                      : "text-green-700 dark:text-green-600"
                  }`}
                  role="alert"
                  aria-live="polite"
                >
                  {validationState.type === "error"
                    ? (
                      <AlertCircle
                        className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                        aria-hidden="true"
                      />
                    )
                    : (
                      <CheckCircle
                        className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                        aria-hidden="true"
                      />
                    )}
                  <span className="leading-tight">
                    {validationState.message}
                  </span>
                </div>
              )}

              <p
                id="private-key-help"
                className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed"
              >
                Your private key is 64 hexadecimal characters (0-9, a-f). It's
                processed securely in your browser. You can enter it manually or load from a file.
              </p>
            </div>
          )}

          {/* Error Display */}
          {(error || connectionError) && (
            <Alert
              variant="destructive"
              className="border-red-500/30 bg-red-500/10"
            >
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-500">
                {error || connectionError}
              </AlertDescription>
            </Alert>
          )}

          {/* Security Notice */}
          <div className="p-2.5 sm:p-3 md:p-4 bg-green-500/10 border border-green-500/30 rounded">
            <div className="flex items-start gap-2 sm:gap-2.5 md:gap-3">
              <div className="p-1 sm:p-1.5 rounded border border-green-500/30 bg-green-500/10 flex-shrink-0">
                <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
              </div>
              <div>
                <div className="font-bold text-foreground mb-0.5 sm:mb-1 text-[11px] sm:text-xs">
                  Maximum Security
                </div>
                <div className="text-muted-foreground text-[10px] sm:text-xs leading-relaxed">
                  Your private key is processed locally in your browser using
                  advanced cryptographic functions. We never have access to your
                  private keys, and all operations happen securely on your
                  device.
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-3 md:pt-4">
            <Button
              onClick={onBack}
              variant="outline"
              className="flex-1 h-9 sm:h-10 text-xs sm:text-sm"
              disabled={isLoading}
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="">Back</span>
            </Button>
            <Button
              onClick={content.actionHandler}
              disabled={isLoading ||
                (content.showInput &&
                  (!privateKey.trim() || !validationState.isValid))}
              className={`flex-1 h-9 sm:h-10 font-bold text-xs sm:text-sm ${
                walletType === "create"
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
              }`}
            >
              {isLoading
                ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                    {walletType === "create" ? "Generating..." : "Importing..."}
                  </>
                )
                : (
                  <>
                    <span className="truncate">{content.actionText}</span>
                    {walletType === "create"
                      ? (
                        <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1.5 sm:ml-2 flex-shrink-0" />
                      )
                      : (
                        <Key className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1.5 sm:ml-2 flex-shrink-0" />
                      )}
                  </>
                )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Dialog for Decrypting Encrypted File */}
      <Dialog open={showPasswordDialog} onOpenChange={(open) => {
        if (!open) {
          setShowPasswordDialog(false);
          setPassword("");
          setPasswordError(null);
          setPendingEncryptedData(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-500" />
              Decrypt Private Key File
            </DialogTitle>
            <DialogDescription>
              Enter the password you used to encrypt this file to decrypt your private key.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="decrypt-password">Password</Label>
              <div className="relative">
                <Input
                  id="decrypt-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  placeholder="Enter decryption password"
                  className="pr-10"
                  disabled={isDecrypting}
                  aria-invalid={!!passwordError}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && password) {
                      handleDecryptFile();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  disabled={isDecrypting}
                >
                  {showPassword
                    ? <EyeOff className="h-3.5 w-3.5" />
                    : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>

            {passwordError && (
              <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-700 dark:text-amber-400">
              <div className="font-semibold mb-1">ℹ️ Information:</div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li>The file is encrypted using AES-GCM with PBKDF2</li>
                <li>Enter the password you set when creating the encrypted file</li>
                <li>If you forgot the password, the file cannot be decrypted</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(false);
                setPassword("");
                setPasswordError(null);
                setPendingEncryptedData(null);
              }}
              disabled={isDecrypting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDecryptFile}
              disabled={isDecrypting || !password}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isDecrypting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Decrypting...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Decrypt & Import
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
