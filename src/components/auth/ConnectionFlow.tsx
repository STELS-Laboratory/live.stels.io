import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Loader2,
  Network,
  Shield,
} from "lucide-react";
import { useAuthStore } from "@/stores/modules/auth.store";
import { WalletSetup } from "./WalletSetup";
import { NetworkSelector } from "./NetworkSelector";

/**
 * Complete authentication flow component
 */
export function ConnectionFlow(): React.ReactElement {
  const {
    isWalletCreated,
    wallet,
    selectedNetwork,
    isConnected,
    isConnecting,
    connectionError,
    connectToNode,
    disconnectFromNode,
    clearConnectionError,
  } = useAuthStore();

  const [currentStep, setCurrentStep] = useState<
    "wallet" | "network" | "connecting" | "connected"
  >("wallet");
  const [connectionProgress, setConnectionProgress] = useState(0);

  // Update current step based on state
  useEffect(() => {
    if (isConnected) {
      setCurrentStep("connected");
    } else if (isConnecting) {
      setCurrentStep("connecting");
    } else if (isWalletCreated && selectedNetwork) {
      setCurrentStep("network");
    } else if (isWalletCreated) {
      setCurrentStep("network");
    } else {
      setCurrentStep("wallet");
    }
  }, [isWalletCreated, selectedNetwork, isConnected, isConnecting]);

  // Simulate connection progress
  useEffect(() => {
    if (isConnecting) {
      const interval = setInterval(() => {
        setConnectionProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      return () => clearInterval(interval);
    } else {
      setConnectionProgress(0);
    }
  }, [isConnecting]);

  const handleConnect = async (): Promise<void> => {
    clearConnectionError();
    const success = await connectToNode();

    if (success) {
      console.log("[ConnectionFlow] Successfully connected to node");
    }
  };

  const handleDisconnect = (): void => {
    disconnectFromNode();
    setCurrentStep("wallet");
  };

  const getStepIcon = (step: string) => {
    const isActive = currentStep === step;
    const isCompleted = (step === "wallet" && isWalletCreated) ||
      (step === "network" && selectedNetwork) ||
      (step === "connecting" && isConnected) ||
      (step === "connected" && isConnected);

    if (isCompleted) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (isActive) {
      return <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />;
    } else {
      return <div className="h-5 w-5 rounded-full border-2 border-zinc-600" />;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "wallet":
        return <WalletSetup />;

      case "network":
        return <NetworkSelector />;

      case "connecting":
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
                Connecting to Node
              </CardTitle>
              <p className="text-sm text-zinc-400">
                Authenticating with {selectedNetwork?.name}...
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Connection Progress</span>
                  <span>{connectionProgress}%</span>
                </div>
                <Progress value={connectionProgress} className="w-full" />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Shield className="h-4 w-4" />
                  <span>Verifying transaction signature...</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-400">
                  <Network className="h-4 w-4" />
                  <span>Establishing WebSocket connection...</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-400">
                  <CheckCircle className="h-4 w-4" />
                  <span>Creating session...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case "connected":
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Connected Successfully
              </CardTitle>
              <p className="text-sm text-zinc-400">
                You are now connected to {selectedNetwork?.name}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="text-sm font-medium text-green-400">
                    Network: {selectedNetwork?.name}
                  </div>
                  <div className="text-xs text-zinc-400">
                    {selectedNetwork?.api}
                  </div>
                </div>

                <div className="p-3 bg-zinc-800 rounded-lg">
                  <div className="text-sm font-medium text-foreground">
                    Wallet Address
                  </div>
                  <div className="text-xs font-mono text-zinc-400 break-all">
                    {wallet?.address}
                  </div>
                </div>
              </div>

              <Button
                onClick={handleDisconnect}
                variant="outline"
                className="w-full"
              >
                Disconnect
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">
            SONAR Web3 Platform
          </h1>
          <p className="text-zinc-400">
            Connect your wallet and join the network
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-8">
          <div className="flex items-center gap-2">
            {getStepIcon("wallet")}
            <span
              className={`text-sm ${
                currentStep === "wallet" ? "text-amber-400" : "text-zinc-400"
              }`}
            >
              Wallet
            </span>
          </div>

          <ArrowRight className="h-4 w-4 text-zinc-600" />

          <div className="flex items-center gap-2">
            {getStepIcon("network")}
            <span
              className={`text-sm ${
                currentStep === "network" ? "text-amber-400" : "text-zinc-400"
              }`}
            >
              Network
            </span>
          </div>

          <ArrowRight className="h-4 w-4 text-zinc-600" />

          <div className="flex items-center gap-2">
            {getStepIcon("connecting")}
            <span
              className={`text-sm ${
                currentStep === "connecting"
                  ? "text-amber-400"
                  : "text-zinc-400"
              }`}
            >
              Connect
            </span>
          </div>

          <ArrowRight className="h-4 w-4 text-zinc-600" />

          <div className="flex items-center gap-2">
            {getStepIcon("connected")}
            <span
              className={`text-sm ${
                currentStep === "connected" ? "text-green-400" : "text-zinc-400"
              }`}
            >
              Ready
            </span>
          </div>
        </div>

        {/* Step Content */}
        {renderStepContent()}

        {/* Action Buttons */}
        {currentStep === "network" && selectedNetwork && (
          <div className="flex justify-center">
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              size="lg"
              className="px-8"
            >
              {isConnecting
                ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                )
                : (
                  <>
                    <Network className="h-4 w-4 mr-2" />
                    Connect to {selectedNetwork.name}
                  </>
                )}
            </Button>
          </div>
        )}

        {/* Error Display */}
        {connectionError && (
          <Alert variant="destructive" className="max-w-md mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{connectionError}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
