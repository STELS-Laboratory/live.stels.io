import React, { useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  ArrowRight,
  CheckCircle,
  Copy,
  Download,
  Eye,
  EyeOff,
  Shield,
  Lock,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "@/stores/modules/auth.store";
import { LOTTIE_ANIMATIONS, LOTTIE_SIZES } from "./lottie_config";
import {
  encryptWithPassword,
  uint8ArrayToHex,
  DEFAULT_PBKDF2_ITERATIONS,
} from "@/lib/crypto";

interface WalletConfirmationProps {
  walletType: "create" | "import";
  onConfirm: () => void;
  onBack: () => void;
}

/**
 * Professional Wallet confirmation component
 */
export function WalletConfirmation({
  walletType,
  onConfirm,
  onBack,
}: WalletConfirmationProps): React.ReactElement {
  const { wallet } = useAuthStore();
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedPrivateKey, setCopiedPrivateKey] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showFullPrivateKey, setShowFullPrivateKey] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (!wallet) {
    return (
      <Card className="bg-transparent border-0">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">No wallet data available</p>
        </CardContent>
      </Card>
    );
  }

  const handleConfirm = (): void => {
    onConfirm();
  };

  const handleCopyAddress = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 1500);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  const handleCopyPrivateKey = async (): Promise<void> => {
    try {
      // SECURITY: Copy private key to clipboard without displaying in DOM
      await navigator.clipboard.writeText(wallet.privateKey);
      setCopiedPrivateKey(true);
      setTimeout(() => setCopiedPrivateKey(false), 1500);
    } catch (error) {
      console.error("Failed to copy private key:", error);
      // Fallback: Show full key so user can copy manually
      setShowFullPrivateKey(true);
    }
  };

  const handleDownloadClick = (): void => {
    setPassword("");
    setConfirmPassword("");
    setPasswordError(null);
    setShowPasswordDialog(true);
  };

  const handleDownloadPrivateKey = async (): Promise<void> => {
    // Validate password
    if (!password || password.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setIsEncrypting(true);
    setPasswordError(null);

    try {
      // Encrypt private key with password
      const encrypted = await encryptWithPassword(
        wallet.privateKey,
        password,
        DEFAULT_PBKDF2_ITERATIONS,
      );

      // Create JSON structure
      const encryptedFile = {
        version: "1.0",
        encrypted: true,
        algorithm: "AES-GCM",
        keyDerivation: "PBKDF2",
        iterations: DEFAULT_PBKDF2_ITERATIONS,
        salt: uint8ArrayToHex(encrypted.salt),
        iv: uint8ArrayToHex(encrypted.iv),
        data: uint8ArrayToHex(encrypted.encryptedData),
        address: wallet.address,
        createdAt: new Date().toISOString(),
      };

      // Download as JSON file
      const blob = new Blob([JSON.stringify(encryptedFile, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gliesereum-wallet-${wallet.address.slice(0, 8)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Close dialog and reset
      setShowPasswordDialog(false);
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Failed to encrypt and download private key:", error);
      setPasswordError(
        error instanceof Error
          ? error.message
          : "Failed to encrypt private key. Please try again.",
      );
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleShowFullKey = (): void => {
    // Show warning before displaying full key
    const confirmed = window.confirm(
      "⚠️ SECURITY WARNING\n\n" +
      "You are about to view your full private key in the browser.\n\n" +
      "This is a security risk. Make sure:\n" +
      "• No one is watching your screen\n" +
      "• No malicious browser extensions are installed\n" +
      "• You are in a private/incognito window\n\n" +
      "Do you want to continue?"
    );
    
    if (confirmed) {
      setShowFullPrivateKey(true);
    }
  };

  // const handleDownloadPrivateKey = (): void => {
  //   const blob = new Blob([Wallet.privateKey], { type: "text/plain" });
  //   const url = URL.createObjectURL(blob);
  //   const a = document.createElement("a");
  //   a.href = url;
  //   a.download = `gliesereum-private-key-${Wallet.address.slice(0, 8)}.txt`;
  //   document.body.appendChild(a);
  //   a.click();
  //   document.body.removeChild(a);
  //   URL.revokeObjectURL(url);
  // };

  const getWalletTypeInfo = () => {
    if (walletType === "create") {
      return {
        title: "New Wallet Created",
        subtitle: "Your Wallet has been successfully generated",
        badge: {
          text: "New Wallet",
          className:
            "bg-accent text-accent-foreground border-accent-foreground/30",
        },
        icon: <CheckCircle className="icon-lg text-accent-foreground" />,
      };
    } else {
      return {
        title: "Wallet Imported",
        subtitle: "Your existing Wallet has been successfully imported",
        badge: {
          text: "Imported",
          className:
            "bg-secondary text-secondary-foreground border-secondary-foreground/30",
        },
        icon: <CheckCircle className="icon-lg text-secondary-foreground" />,
      };
    }
  };

  const typeInfo = getWalletTypeInfo();

  return (
    <div className="w-full space-y-3 sm:space-y-4">
      {/* Wallet Confirmation Card */}
      <Card className="bg-transparent border-0">
        <CardHeader className="text-center pb-2 sm:pb-3 md:pb-4 px-3 sm:px-4 md:px-6">
          {/* Lottie Animation - Success Checkmark */}
          <div className="flex h-20 sm:h-24 md:h-32 items-center justify-center mb-2 sm:mb-3">
            <DotLottieReact
              src={LOTTIE_ANIMATIONS.success}
              loop
              speed={0.5}
              autoplay
              style={LOTTIE_SIZES.small}
            />
          </div>

          <CardTitle className="flex flex-col items-center justify-center gap-1 sm:gap-2 text-base sm:text-lg md:text-xl font-bold">
            <span className="text-foreground">
              {typeInfo.title}
            </span>
          </CardTitle>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1.5 sm:mt-2 px-2">
            {typeInfo.subtitle}
          </p>
          <Badge
            className={`mx-auto mt-1.5 sm:mt-2 text-xs ${typeInfo.badge.className}`}
          >
            {typeInfo.badge.text}
          </Badge>
        </CardHeader>

        <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6 space-y-3 sm:space-y-4">
          {/* Wallet Information Section */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-card-foreground flex items-center gap-1.5 sm:gap-2">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-amber-700 dark:text-amber-400" />
              Wallet Details
            </h3>

            <div className="p-2.5 sm:p-3 md:p-4 bg-muted/50 border border-border rounded space-y-2 sm:space-y-3">
              {/* Wallet Address */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Wallet Address
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyAddress}
                    className="h-7 sm:h-8 px-1.5 sm:px-2 text-xs"
                  >
                    {copiedAddress
                      ? (
                        <CheckCircle className="h-3 w-3 text-accent-foreground" />
                      )
                      : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <div className="p-1.5 sm:p-2 bg-background border border-border rounded">
                  <div className="font-mono text-[10px] sm:text-xs text-foreground break-all leading-tight">
                    {wallet.address}
                  </div>
                </div>
              </div>

              {/* Card Number */}
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Card Number
                </label>
                <div className="p-1.5 sm:p-2 bg-background border border-border rounded">
                  <div className="font-mono text-xs sm:text-sm text-foreground">
                    {wallet.number}
                  </div>
                </div>
              </div>

              {/* Private Key - SECURITY: Show full key only when explicitly requested */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Private Key
                  </label>
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                      className="h-7 sm:h-8 px-1.5 sm:px-2 text-xs"
                      aria-label={showPrivateKey ? "Hide private key preview" : "Show private key preview"}
                    >
                      {showPrivateKey
                        ? <EyeOff className="h-3 w-3" />
                        : <Eye className="h-3 w-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyPrivateKey}
                      className="h-7 sm:h-8 px-1.5 sm:px-2 text-xs"
                      aria-label="Copy private key to clipboard"
                      title="Copy private key to clipboard (Ctrl+C / Cmd+C if button fails)"
                    >
                      {copiedPrivateKey
                        ? (
                          <CheckCircle className="h-3 w-3 text-accent-foreground" />
                        )
                        : <Copy className="h-3 w-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDownloadClick}
                      className="h-7 sm:h-8 px-1.5 sm:px-2 text-xs"
                      aria-label="Download encrypted private key as file"
                      title="Download encrypted private key as JSON file"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="p-1.5 sm:p-2 bg-background border border-border rounded">
                  {showFullPrivateKey
                    ? (
                      // SECURITY WARNING: Full key displayed - user can select and copy manually
                      <div className="space-y-2">
                        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-[10px] text-red-700 dark:text-red-400">
                          ⚠️ Full private key is visible. Select text and copy manually (Ctrl+C / Cmd+C)
                        </div>
                        <div 
                          className="font-mono text-[10px] sm:text-xs text-foreground break-all leading-tight select-all cursor-text"
                          onDoubleClick={(e) => {
                            // Select all text on double click
                            const range = document.createRange();
                            range.selectNodeContents(e.currentTarget);
                            const selection = window.getSelection();
                            selection?.removeAllRanges();
                            selection?.addRange(range);
                          }}
                        >
                          {wallet.privateKey}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowFullPrivateKey(false)}
                          className="w-full h-7 text-xs"
                        >
                          Hide Full Key
                        </Button>
                      </div>
                    )
                    : showPrivateKey
                    ? (
                      // SECURITY: Show masked preview only (first 8 and last 8 chars)
                      <div className="space-y-2">
                        <div className="font-mono text-[10px] sm:text-xs text-foreground break-all leading-tight">
                          {wallet.privateKey.slice(0, 8)}••••••••••••••••••••••••••••••••••••••••••••••••{wallet.privateKey.slice(-8)}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleShowFullKey}
                          className="w-full h-7 text-xs"
                        >
                          Show Full Key (Manual Copy)
                        </Button>
                      </div>
                    )
                    : (
                      <div className="font-mono text-[10px] sm:text-xs text-muted-foreground">
                        •••••••••••••••••••••••••••••••
                      </div>
                    )}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">
                    Click copy button to copy to clipboard, or download as file
                  </p>
                  {!showFullPrivateKey && (
                    <p className="text-[10px] text-muted-foreground">
                      If copy button fails, click "Show Full Key" to copy manually
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-2.5 sm:p-3 md:p-4 bg-primary/10 border border-primary/30 rounded">
            <div className="flex items-start gap-2 sm:gap-2.5 md:gap-3">
              <div className="p-1 sm:p-1.5 rounded border border-primary/30 bg-primary/10 flex-shrink-0">
                <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              </div>
              <div>
                <div className="font-bold text-foreground mb-0.5 sm:mb-1 text-[11px] sm:text-xs">
                  Critical: Backup Your Private Key
                </div>
                <div className="text-muted-foreground text-[10px] sm:text-xs leading-relaxed">
                  Your private key is the ONLY way to access your wallet and
                  funds. STELS cannot recover your private key if lost. Write it
                  down on paper and store it in a secure location, or use a
                  password manager. Never share it with anyone or store it
                  online.
                </div>
              </div>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start gap-2 sm:gap-2.5 md:gap-3 p-2.5 sm:p-3 bg-muted/50 border border-border rounded">
            <input
              type="checkbox"
              id="confirmWallet"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary bg-secondary border-muted rounded focus:ring-primary focus:ring-2 mt-0.5"
            />
            <label
              htmlFor="confirmWallet"
              className="text-[11px] sm:text-xs md:text-sm text-card-foreground leading-relaxed"
            >
              I have securely saved my private key and understand that losing it
              will result in permanent loss of access to my wallet and all
              associated funds.
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-3 md:pt-4">
            <Button
              onClick={onBack}
              variant="outline"
              className="flex-1 h-9 sm:h-10 text-xs sm:text-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="">Back</span>
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!isConfirmed}
              className="flex-1 h-9 sm:h-10 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">
                Continue to Network Setup
              </span>
              <span className="sm:hidden">Continue</span>
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1.5 sm:ml-2 flex-shrink-0" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Dialog for Encrypted Download */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-500" />
              Encrypt Private Key File
            </DialogTitle>
            <DialogDescription>
              Enter a password to encrypt your private key file. You'll need this
              password to decrypt the file when importing your wallet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="encrypt-password">Password</Label>
              <div className="relative">
                <Input
                  id="encrypt-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  placeholder="Enter password (min 8 characters)"
                  className="pr-10"
                  disabled={isEncrypting}
                  aria-invalid={!!passwordError}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  disabled={isEncrypting}
                >
                  {showPassword
                    ? <EyeOff className="h-3.5 w-3.5" />
                    : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum 8 characters. Use a strong, unique password.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordError(null);
                }}
                placeholder="Confirm password"
                disabled={isEncrypting}
                aria-invalid={!!passwordError}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && password && confirmPassword) {
                    handleDownloadPrivateKey();
                  }
                }}
              />
            </div>

            {passwordError && (
              <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-700 dark:text-amber-400">
              <div className="font-semibold mb-1">⚠️ Important:</div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li>Remember this password - you'll need it to decrypt the file</li>
                <li>The file will be encrypted using AES-GCM with PBKDF2</li>
                <li>Store the password securely - it cannot be recovered</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(false);
                setPassword("");
                setConfirmPassword("");
                setPasswordError(null);
              }}
              disabled={isEncrypting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDownloadPrivateKey}
              disabled={
                isEncrypting ||
                !password ||
                !confirmPassword ||
                password.length < 8
              }
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isEncrypting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Encrypting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download Encrypted File
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
