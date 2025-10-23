import React, { useEffect, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
//import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  //Lock,
  RefreshCw,
  Shield,
  Wifi,
  //Zap,
} from "lucide-react";
import { useAuthStore } from "@/stores/modules/auth.store";
import { LOTTIE_ANIMATIONS, LOTTIE_SIZES } from "./lottie_config";
//import { WalletPreview } from "./WalletPreview";

interface ConnectionProcessProps {
  onBack: () => void;
  onSuccess: () => void;
  onError: () => void;
}

/**
 * Professional connection process component
 */
export function ConnectionProcess(
  { onBack, onSuccess, onError }: ConnectionProcessProps,
): React.ReactElement {
  const {
    selectedNetwork,
    isConnecting,
    isConnected,
    connectionError,
    connectToNode,
  } = useAuthStore();

  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");

  useEffect(() => {
    if (isConnecting) {
      // Enhanced connection progress with faster realistic timing
      const steps = [
        { step: "Initializing secure connection...", progress: 10, icon: "🔐" },
        { step: "Validating Wallet credentials...", progress: 20, icon: "✅" },
        {
          step: "Creating authentication transaction...",
          progress: 35,
          icon: "📝",
        },
        {
          step: "Signing transaction with private key...",
          progress: 50,
          icon: "✍️",
        },
        {
          step: "Encrypting and sending to network...",
          progress: 65,
          icon: "🔒",
        },
        {
          step: "Verifying transaction signature...",
          progress: 80,
          icon: "🔍",
        },
        {
          step: "Establishing WebSocket connection...",
          progress: 90,
          icon: "🌐",
        },
        { step: "Creating secure session...", progress: 100, icon: "🎯" },
      ];

      let currentStepIndex = 0;
      const interval = setInterval(() => {
        if (currentStepIndex < steps.length) {
          const current = steps[currentStepIndex];
          setCurrentStep(`${current.icon} ${current.step}`);
          setProgress(current.progress);
          currentStepIndex++;
        } else {
          clearInterval(interval);
        }
      }, 250); // Faster intervals for responsive UX

      return () => clearInterval(interval);
    }
  }, [isConnecting]);

  useEffect(() => {
    if (isConnected) {
      setCurrentStep("Connection established successfully!");
      setProgress(100);
      // Auto-success after a short delay
      setTimeout(() => {
        onSuccess();
      }, 400);
    }
  }, [isConnected, onSuccess]);

  useEffect(() => {
    if (connectionError) {
      onError();
    }
  }, [connectionError, onError]);

  const handleRetry = async (): Promise<void> => {
    setProgress(0);
    setCurrentStep("");
    await connectToNode();
  };

  const getStatusColor = () => {
    if (connectionError) {
      return "text-destructive";
    } else if (isConnected) {
      return "text-accent-foreground";
    } else {
      return "text-primary";
    }
  };

  const getStatusText = () => {
    if (connectionError) {
      return "Connection Failed";
    } else if (isConnected) {
      return "Connected Successfully";
    } else {
      return "Connecting to Network";
    }
  };

  return (
    <div className="w-full space-y-3 sm:space-y-4">
      {/* Connection Process */}
      <Card className="bg-transparent border-0">
        <CardHeader className="text-center pb-2 sm:pb-3 md:pb-4 px-3 sm:px-4 md:px-6">
          {/* Lottie Animation - Connection State */}
          <div className="flex h-20 sm:h-24 md:h-28 items-center justify-center mb-2 sm:mb-3">
            {connectionError
              ? (
                <DotLottieReact
                  src={LOTTIE_ANIMATIONS.error}
                  autoplay
                  style={LOTTIE_SIZES.medium}
                />
              )
              : isConnected
              ? (
                <DotLottieReact
                  src={LOTTIE_ANIMATIONS.connected}
                  autoplay
                  style={LOTTIE_SIZES.medium}
                />
              )
              : (
                <DotLottieReact
                  src={LOTTIE_ANIMATIONS.connecting}
                  loop
                  autoplay
                  style={LOTTIE_SIZES.medium}
                />
              )}
          </div>

          <CardTitle className="flex flex-col items-center justify-center gap-1 sm:gap-2 text-base sm:text-lg md:text-xl font-bold">
            <span className={getStatusColor()}>
              {getStatusText()}
            </span>
          </CardTitle>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-muted/50 border border-border rounded">
              <Wifi className="h-3 w-3 text-primary" />
              <span className="text-[10px] sm:text-xs text-foreground font-medium">
                {selectedNetwork?.name}
              </span>
            </div>
            <div className="hidden sm:block text-muted-foreground text-xs">
              •
            </div>
            <div className="text-[9px] sm:text-[10px] text-muted-foreground font-mono truncate max-w-[200px] sm:max-w-none">
              {selectedNetwork?.api}
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6 space-y-3 sm:space-y-4">
          {/* Enhanced Progress Bar */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm font-medium text-card-foreground">
                Connection Progress
              </span>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium text-card-foreground">
                  {progress}%
                </span>
                {isConnecting && (
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-pulse" />
                )}
              </div>
            </div>

            <div className="relative w-full bg-muted h-1.5 sm:h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  connectionError
                    ? "bg-destructive"
                    : isConnected
                    ? "bg-accent-foreground"
                    : "bg-primary"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Current Step */}
          <div className="text-center p-2.5 sm:p-3 md:p-4 bg-muted/50 border border-border rounded">
            <p className="text-xs sm:text-sm text-foreground font-medium leading-relaxed">
              {currentStep || (connectionError
                ? "Connection failed"
                : "Preparing secure connection...")}
            </p>
          </div>

          {/* Enhanced Connection Steps */}
          {!connectionError && (
            <div className="space-y-2 sm:space-y-3">
              {[
                { step: "Initialize connection", progress: 10, icon: "🔐" },
                { step: "Validate credentials", progress: 20, icon: "✅" },
                {
                  step: "Create authentication transaction",
                  progress: 35,
                  icon: "📝",
                },
                { step: "Sign transaction", progress: 50, icon: "✍️" },
                { step: "Send to network node", progress: 65, icon: "🔒" },
                { step: "Verify signature", progress: 80, icon: "🔍" },
                { step: "Establish WebSocket", progress: 90, icon: "🌐" },
                { step: "Create session", progress: 100, icon: "🎯" },
              ].map((item, index) => {
                const isCompleted = progress >= item.progress;
                const isCurrent = Math.abs(progress - item.progress) < 10;

                return (
                  <div
                    key={index}
                    className={`flex items-center gap-2 sm:gap-2.5 md:gap-3 text-[10px] sm:text-xs transition-colors ${
                      isCompleted
                        ? "text-accent-foreground"
                        : isCurrent
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded flex items-center justify-center transition-all ${
                          isCompleted
                            ? "bg-accent/20 border border-accent-foreground/50"
                            : isCurrent
                            ? "bg-primary/20 border border-primary/50"
                            : "bg-muted border border-border"
                        }`}
                      >
                        {isCompleted
                          ? (
                            <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          )
                          : (
                            <span className="text-[9px] sm:text-[10px]">
                              {item.icon}
                            </span>
                          )}
                      </div>

                      {/* Pulse for current step */}
                      {isCurrent && !isCompleted && (
                        <div className="absolute inset-0 rounded border border-primary animate-ping" />
                      )}
                    </div>

                    <span className="font-medium leading-tight">
                      {item.step}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Error Display */}
          {connectionError && (
            <Alert
              variant="destructive"
              className="border-red-500/30 bg-red-500/10"
            >
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-500">
                {connectionError}
              </AlertDescription>
            </Alert>
          )}

          {/* Security Notice */}
          {!connectionError && (
            <div className="p-2.5 sm:p-3 md:p-4 bg-accent/10 border border-accent-foreground/30 rounded">
              <div className="flex items-start gap-2 sm:gap-2.5 md:gap-3">
                <div className="p-1 sm:p-1.5 rounded border border-accent-foreground/30 bg-accent/10 flex-shrink-0">
                  <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent-foreground" />
                </div>
                <div>
                  <div className="font-bold text-foreground mb-0.5 sm:mb-1 text-[11px] sm:text-xs">
                    Secure Connection
                  </div>
                  <div className="text-muted-foreground text-[10px] sm:text-xs leading-relaxed">
                    Your connection is encrypted and authenticated using your
                    wallet's private key. All data transmission is secured with
                    industry-standard encryption protocols.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-3 md:pt-4">
            <Button
              onClick={onBack}
              variant="outline"
              className="flex-1 h-9 sm:h-10 text-xs sm:text-sm"
              disabled={isConnecting}
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="">Back</span>
            </Button>
            {connectionError && (
              <Button
                onClick={handleRetry}
                className="flex-1 h-9 sm:h-10 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs sm:text-sm"
              >
                <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="hidden xs:inline">Retry Connection</span>
                <span className="xs:hidden">Retry</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
