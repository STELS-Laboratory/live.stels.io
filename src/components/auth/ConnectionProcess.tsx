import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Loader2,
  RefreshCw,
  Shield,
} from "lucide-react";
import { useAuthStore } from "@/stores/modules/auth.store";
import { WalletPreview } from "./WalletPreview";

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
      // Simulate connection progress
      const steps = [
        { step: "Initializing connection...", progress: 10 },
        { step: "Validating wallet credentials...", progress: 25 },
        { step: "Creating authentication transaction...", progress: 40 },
        { step: "Signing transaction...", progress: 55 },
        { step: "Sending to network node...", progress: 70 },
        { step: "Verifying transaction signature...", progress: 85 },
        { step: "Establishing WebSocket connection...", progress: 95 },
        { step: "Creating secure session...", progress: 100 },
      ];

      let currentStepIndex = 0;
      const interval = setInterval(() => {
        if (currentStepIndex < steps.length) {
          const current = steps[currentStepIndex];
          setCurrentStep(current.step);
          setProgress(current.progress);
          currentStepIndex++;
        } else {
          clearInterval(interval);
        }
      }, 800);

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
      }, 1500);
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
    <div className="space-y-6">
      {/* Wallet Preview */}
      <WalletPreview />

      {/* Connection Process */}
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            {getStatusIcon()}
            <span className={getStatusColor()}>
              {getStatusText()}
            </span>
          </CardTitle>
          <p className="text-zinc-400 mt-2">
            {selectedNetwork?.name} • {selectedNetwork?.api}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Connection Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress
              value={progress}
              className="w-full h-2"
            />
          </div>

          {/* Current Step */}
          <div className="text-center">
            <p className="text-sm text-zinc-300">
              {currentStep || (connectionError
                ? "Connection failed"
                : "Preparing connection...")}
            </p>
          </div>

          {/* Connection Steps */}
          {!connectionError && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div
                  className={`w-2 h-2 rounded-full ${
                    progress >= 10 ? "bg-green-500" : "bg-zinc-600"
                  }`}
                />
                <span className="text-zinc-400">Initialize connection</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div
                  className={`w-2 h-2 rounded-full ${
                    progress >= 25 ? "bg-green-500" : "bg-zinc-600"
                  }`}
                />
                <span className="text-zinc-400">Validate credentials</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div
                  className={`w-2 h-2 rounded-full ${
                    progress >= 40 ? "bg-green-500" : "bg-zinc-600"
                  }`}
                />
                <span className="text-zinc-400">
                  Create authentication transaction
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div
                  className={`w-2 h-2 rounded-full ${
                    progress >= 55 ? "bg-green-500" : "bg-zinc-600"
                  }`}
                />
                <span className="text-zinc-400">Sign transaction</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div
                  className={`w-2 h-2 rounded-full ${
                    progress >= 70 ? "bg-green-500" : "bg-zinc-600"
                  }`}
                />
                <span className="text-zinc-400">Send to network node</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div
                  className={`w-2 h-2 rounded-full ${
                    progress >= 85 ? "bg-green-500" : "bg-zinc-600"
                  }`}
                />
                <span className="text-zinc-400">Verify signature</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div
                  className={`w-2 h-2 rounded-full ${
                    progress >= 95 ? "bg-green-500" : "bg-zinc-600"
                  }`}
                />
                <span className="text-zinc-400">Establish WebSocket</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div
                  className={`w-2 h-2 rounded-full ${
                    progress >= 100 ? "bg-green-500" : "bg-zinc-600"
                  }`}
                />
                <span className="text-zinc-400">Create session</span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {connectionError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {connectionError}
              </AlertDescription>
            </Alert>
          )}

          {/* Security Notice */}
          {!connectionError && (
            <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/30">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-500" />
                <div className="text-sm">
                  <div className="font-medium text-foreground">
                    Secure Connection
                  </div>
                  <div className="text-zinc-400">
                    Your connection is encrypted and authenticated using your
                    wallet's private key
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
              className="flex-1"
              disabled={isConnecting}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {connectionError && (
              <Button
                onClick={handleRetry}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-zinc-900"
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
