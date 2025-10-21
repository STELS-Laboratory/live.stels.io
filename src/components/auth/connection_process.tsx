import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
//import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Loader2,
  //Lock,
  RefreshCw,
  Shield,
  Wifi,
  //Zap,
} from "lucide-react";
import { useAuthStore } from "@/stores/modules/auth.store";
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

  const getStatusIcon = () => {
    if (connectionError) {
      return <AlertCircle className="h-6 w-6 text-red-500" />;
    } else if (isConnected) {
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    } else {
      return <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    if (connectionError) {
      return "text-red-700 dark:text-red-400";
    } else if (isConnected) {
      return "text-green-700 dark:text-green-600";
    } else {
      return "text-amber-700 dark:text-amber-400";
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
    <div className="w-full space-y-6">
      {/* Connection Process */}
      <Card className="w-full max-w-2xl mx-auto backdrop-blur-md bg-card/80 border border-border">
        <CardHeader className="text-center pb-4">
          <CardTitle className="flex items-center justify-center gap-3 text-xl font-bold">
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                connectionError
                  ? "bg-gradient-to-br from-red-500 to-red-600"
                  : isConnected
                  ? "bg-gradient-to-br from-green-500 to-emerald-600"
                  : "bg-gradient-to-br from-amber-500 to-orange-600"
              }`}
            >
              {getStatusIcon()}
            </div>
            <span className={getStatusColor()}>
              {getStatusText()}
            </span>
          </CardTitle>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border border-border rounded-lg">
              <Wifi className="h-3 w-3 text-amber-500" />
              <span className="text-xs text-foreground font-medium">
                {selectedNetwork?.name}
              </span>
            </div>
            <div className="text-muted-foreground text-xs">•</div>
            <div className="text-[10px] text-muted-foreground font-mono">
              {selectedNetwork?.api}
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6 space-y-4">
          {/* Enhanced Progress Bar */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-card-foreground">
                Connection Progress
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-card-foreground">
                  {progress}%
                </span>
                {isConnecting && (
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                )}
              </div>
            </div>

            <div className="relative w-full bg-muted h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  connectionError
                    ? "bg-gradient-to-r from-red-500 to-red-600"
                    : isConnected
                    ? "bg-gradient-to-r from-green-500 to-emerald-600"
                    : "bg-gradient-to-r from-amber-500 to-orange-600"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Current Step */}
          <div className="text-center p-4 bg-muted/50 border border-border rounded-lg">
            <p className="text-sm text-foreground font-medium">
              {currentStep || (connectionError
                ? "Connection failed"
                : "Preparing secure connection...")}
            </p>
          </div>

          {/* Enhanced Connection Steps */}
          {!connectionError && (
            <div className="space-y-4">
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
                    className={`flex items-center gap-3 text-xs transition-colors ${
                      isCompleted
                        ? "text-green-500"
                        : isCurrent
                        ? "text-amber-500"
                        : "text-muted-foreground"
                    }`}
                  >
                    <div className="relative">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                          isCompleted
                            ? "bg-green-500/20 border border-green-500/50"
                            : isCurrent
                            ? "bg-amber-500/20 border border-amber-500/50"
                            : "bg-muted border border-border"
                        }`}
                      >
                        {isCompleted
                          ? <CheckCircle className="w-3 h-3" />
                          : <span className="text-[10px]">{item.icon}</span>}
                      </div>

                      {/* Pulse for current step */}
                      {isCurrent && !isCompleted && (
                        <div className="absolute inset-0 rounded-lg border border-amber-500 animate-ping" />
                      )}
                    </div>

                    <span className="font-medium">{item.step}</span>
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
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg border border-green-500/30 bg-green-500/10">
                  <Shield className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <div className="font-bold text-foreground mb-1 text-xs">
                    Secure Connection
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Your connection is encrypted and authenticated using your
                    wallet's private key. All data transmission is secured with
                    industry-standard encryption protocols.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onBack}
              variant="outline"
              className="flex-1 h-10"
              disabled={isConnecting}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Network
            </Button>
            {connectionError && (
              <Button
                onClick={handleRetry}
                className="flex-1 h-10 bg-amber-500 hover:bg-amber-600 text-black font-bold"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Connection
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
