import React, { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";
import { useAuthStore } from "@/stores/modules/auth.store";
import { WalletTypeSelector } from "./WalletTypeSelector";
import { WalletCreator } from "./WalletCreator";
import { WalletConfirmation } from "./WalletConfirmation";
import { NetworkSetup } from "./NetworkSetup";
import { ConnectionProcess } from "./ConnectionProcess";

/**
 * Professional authentication flow with step-by-step process
 */
export function ProfessionalConnectionFlow(): React.ReactElement {
  const { isConnected, connectionSession, connectToNode } = useAuthStore();

  // Flow steps
  const [currentStep, setCurrentStep] = useState<
    "type" | "create" | "confirm" | "network" | "connecting" | "success"
  >("type");
  const [walletType, setWalletType] = useState<"create" | "import">("create");

  // Reset to initial step if not connected
  useEffect(() => {
    if (!isConnected && currentStep === "success") {
      setCurrentStep("type");
    }
  }, [isConnected, currentStep]);

  // Auto-advance to success if connected
  useEffect(() => {
    if (isConnected && connectionSession && currentStep === "connecting") {
      setCurrentStep("success");
    }
  }, [isConnected, connectionSession, currentStep]);

  const handleTypeSelect = (type: "create" | "import"): void => {
    setWalletType(type);
    setCurrentStep("create");
  };

  const handleCreateSuccess = (): void => {
    setCurrentStep("confirm");
  };

  const handleConfirmSuccess = (): void => {
    setCurrentStep("network");
  };

  const handleNetworkConnect = async (): Promise<void> => {
    console.log("[ProfessionalConnectionFlow] Starting network connection...");
    setCurrentStep("connecting");
    // Start the actual connection process
    try {
      console.log("[ProfessionalConnectionFlow] Calling connectToNode...");
      const result = await connectToNode();
      console.log("[ProfessionalConnectionFlow] connectToNode result:", result);
    } catch (error) {
      console.error("[ProfessionalConnectionFlow] Connection failed:", error);
      // Error handling is done in ConnectionProcess component
    }
  };

  const handleConnectionSuccess = (): void => {
    setCurrentStep("success");
  };

  const handleConnectionError = (): void => {
    // Stay on connecting step to show error and retry option
  };

  const handleBackToType = (): void => {
    setCurrentStep("type");
  };

  const handleBackToCreate = (): void => {
    setCurrentStep("create");
  };

  const handleBackToConfirm = (): void => {
    setCurrentStep("confirm");
  };

  const handleBackToNetwork = (): void => {
    setCurrentStep("network");
  };

  const renderStep = () => {
    switch (currentStep) {
      case "type":
        return <WalletTypeSelector onSelectType={handleTypeSelect} />;

      case "create":
        return (
          <WalletCreator
            walletType={walletType}
            onBack={handleBackToType}
            onSuccess={handleCreateSuccess}
          />
        );

      case "confirm":
        return (
          <WalletConfirmation
            walletType={walletType}
            onConfirm={handleConfirmSuccess}
            onBack={handleBackToCreate}
          />
        );

      case "network":
        return (
          <NetworkSetup
            onBack={handleBackToConfirm}
            onConnect={handleNetworkConnect}
          />
        );

      case "connecting":
        return (
          <ConnectionProcess
            onBack={handleBackToNetwork}
            onSuccess={handleConnectionSuccess}
            onError={handleConnectionError}
          />
        );

      case "success":
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-6 bg-green-500/20 rounded-full">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Welcome to SONAR Web3
              </h2>
              <p className="text-zinc-400 text-lg">
                Your wallet is connected and ready to use
              </p>
            </div>
            <Alert className="max-w-md mx-auto bg-green-500/10 border-green-500/30">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-300">
                You can now access all features of the SONAR Web3 platform
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case "type":
        return 0;
      case "create":
        return 20;
      case "confirm":
        return 40;
      case "network":
        return 60;
      case "connecting":
        return 80;
      case "success":
        return 100;
      default:
        return 0;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case "type":
        return "Choose Setup Method";
      case "create":
        return walletType === "create" ? "Create New Wallet" : "Import Wallet";
      case "confirm":
        return "Confirm Wallet";
      case "network":
        return "Select Network";
      case "connecting":
        return "Connecting...";
      case "success":
        return "Welcome!";
      default:
        return "";
    }
  };

  const progress = getStepProgress();
  const stepTitle = getStepTitle();

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Web3 Platform
          </h1>
          <p className="text-zinc-400 text-lg">
            Secure cryptocurrency wallet and trading platform
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-zinc-400">
              {stepTitle}
            </span>
            <span className="text-sm font-medium text-zinc-400">
              {progress}%
            </span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div
              className="bg-amber-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between mt-4">
            {[
              { step: "type", label: "Setup", progress: 20 },
              { step: "create", label: "Wallet", progress: 40 },
              { step: "confirm", label: "Confirm", progress: 60 },
              { step: "network", label: "Network", progress: 80 },
              { step: "connecting", label: "Connect", progress: 100 },
            ].map((item) => {
              const isActive = progress >= item.progress;
              const isCurrent = currentStep === item.step;

              return (
                <div key={item.step} className="flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-full transition-all ${
                      isActive
                        ? isCurrent ? "bg-amber-500 scale-125" : "bg-green-500"
                        : "bg-zinc-600"
                    }`}
                  />
                  <span
                    className={`text-xs mt-1 transition-colors ${
                      isActive ? "text-foreground" : "text-zinc-500"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex justify-center">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
