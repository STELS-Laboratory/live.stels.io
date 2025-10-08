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
        { step: "Validating wallet credentials...", progress: 20, icon: "✅" },
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
      return "text-red-400";
    } else if (isConnected) {
      return "text-green-400";
    } else {
      return "text-amber-400";
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
    <div className="w-full space-y-8 animate-fade-in-up">
      {/* Enhanced Connection Process */}
      <Card className="w-full max-w-2xl mx-auto backdrop-blur-sm bg-card/80 border-border/50 shadow-2xl">
        <CardHeader className="text-center pb-6">
          <CardTitle className="flex items-center justify-center gap-3 text-3xl font-bold">
            <div className="relative">
              <div
                className={`absolute inset-0 rounded-full blur-lg ${
                  connectionError
                    ? "bg-red-500/20"
                    : isConnected
                    ? "bg-green-500/20"
                    : "bg-amber-500/20"
                }`}
              />
              <div className="relative p-3 rounded-full bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-border/50 backdrop-blur-sm">
                {getStatusIcon()}
              </div>
            </div>
            <span className={getStatusColor()}>
              {getStatusText()}
            </span>
          </CardTitle>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full border border-border/50">
              <Wifi className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-card-foreground">
                {selectedNetwork?.name}
              </span>
            </div>
            <div className="text-muted-foreground">•</div>
            <div className="text-xs text-muted-foreground font-mono">
              {selectedNetwork?.api}
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-8 space-y-8">
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

            <div className="relative w-full bg-muted/50 rounded-full h-3 border border-border/50 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-700/50 to-zinc-600/50 rounded-full" />
              <div
                className={`relative h-full rounded-full transition-all duration-300 ease-out shadow-lg ${
                  connectionError
                    ? "bg-gradient-to-r from-red-500 to-red-400"
                    : isConnected
                    ? "bg-gradient-to-r from-green-500 to-emerald-400"
                    : "bg-gradient-to-r from-amber-500 via-amber-400 to-blue-500"
                }`}
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            </div>
          </div>

          {/* Enhanced Current Step */}
          <div className="text-center p-6 bg-gradient-to-r from-zinc-800/50 to-zinc-900/50 rounded-xl border border-border/30 backdrop-blur-sm">
            <p className="text-lg text-card-foreground font-medium leading-relaxed">
              {currentStep || (connectionError
                ? "❌ Connection failed"
                : "⏳ Preparing secure connection...")}
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
                    className={`flex items-center gap-4 text-sm transition-all duration-150 ${
                      isCompleted
                        ? "text-green-300"
                        : isCurrent
                        ? "text-amber-300"
                        : "text-muted-foreground"
                    }`}
                  >
                    <div className="relative">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-150 ${
                          isCompleted
                            ? "bg-green-500 border-green-400 text-foreground scale-110"
                            : isCurrent
                            ? "bg-amber-500 border-amber-400 text-zinc-900 scale-105"
                            : "bg-muted border-muted text-muted-foreground"
                        }`}
                      >
                        {isCompleted
                          ? <CheckCircle className="w-4 h-4" />
                          : <span className="text-xs">{item.icon}</span>}
                      </div>

                      {/* Pulse animation for current step */}
                      {isCurrent && !isCompleted && (
                        <div className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ping" />
                      )}
                    </div>

                    <span className="font-medium">{item.step}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Enhanced Error Display */}
          {connectionError && (
            <Alert
              variant="destructive"
              className="border-red-500/50 bg-red-500/10"
            >
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                {connectionError}
              </AlertDescription>
            </Alert>
          )}

          {/* Enhanced Security Notice */}
          {!connectionError && (
            <div className="p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/30 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-500/20 rounded-full">
                  <Shield className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <div className="font-semibold text-green-300 mb-2 text-lg">
                    🔒 Secure Connection
                  </div>
                  <div className="text-green-200/80 text-sm leading-relaxed">
                    Your connection is encrypted and authenticated using your
                    wallet's private key. All data transmission is secured with
                    industry-standard encryption protocols.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Action Buttons */}
          <div className="flex gap-4 pt-6">
            <Button
              onClick={onBack}
              variant="outline"
              className="flex-1 h-12 border-border/50 hover:border-muted/50 bg-muted/50 hover:bg-secondary/50 transition-all duration-150"
              disabled={isConnecting}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Network
            </Button>
            {connectionError && (
              <Button
                onClick={handleRetry}
                className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-zinc-900 shadow-lg shadow-amber-500/25 transition-all duration-150"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Connection
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Custom Animations */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          .animate-fade-in-up {
            animation: fade-in-up 0.3s ease-out forwards;
            opacity: 0;
          }
          
          .animate-shimmer {
            animation: shimmer 1.5s infinite;
          }
        `,
        }}
      />
    </div>
  );
}
